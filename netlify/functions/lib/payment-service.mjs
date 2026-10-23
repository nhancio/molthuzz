import { randomUUID, createHash } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { addCalendarMonth, checkoutDecision, reconcileMembership, validateBinding, validatePlan, verifyWebhook } from './payment-domain.mjs';

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

const data = async (ref) => (await ref.get()).data();
const terminal = (subscription) => ['cancelled', 'expired', 'completed'].includes(subscription.status);

export function createPaymentService({ db, api, verifyToken, config, now = Date.now }) {
  async function ledger(subscriptionId) {
    const invoices = [];
    // ponytail: bounded by the 1,200-cycle subscription; larger histories need a persisted invoice ledger.
    for (let skip = 0; skip < 1300; skip += 100) {
      const page = await api(`invoices?subscription_id=${encodeURIComponent(subscriptionId)}&count=100&skip=${skip}`);
      if (!Array.isArray(page.items)) throw new HttpError(502, 'The payment provider returned invalid invoices.');
      invoices.push(...page.items);
      if (page.items.length < 100) break;
      if (skip === 1200) throw new HttpError(502, 'Payment history requires merchant reconciliation.');
    }
    // Verify the newest paid recurring invoice and the introductory invoice. Older invoices cannot extend access.
    const paid = invoices.filter((invoice) => invoice.status === 'paid');
    const latest = paid.filter((invoice) => invoice.amount === 9900).sort((a, b) => b.billing_end - a.billing_end)[0];
    const intro = paid.find((invoice) => invoice.amount === 200);
    const selected = [...new Set([intro, latest].filter(Boolean))];
    const payments = await Promise.all(selected.map((invoice) => api(`payments/${encodeURIComponent(invoice.payment_id)}`)));
    return { invoices: selected, payments };
  }

  async function reconcile(binding, subscription, eventRef, cancelled = false) {
    const [plan, history] = await Promise.all([api(`plans/${config.planId}`), ledger(subscription.id)]);
    validatePlan(plan, config.planId);
    return db.runTransaction(async (tx) => {
      const accountRef = db.doc(`billingAccounts/${binding.uid}`);
      const membershipRef = db.doc(`entitlements/${binding.uid}`);
      const [accountSnap, membershipSnap, eventSnap] = await Promise.all([tx.get(accountRef), tx.get(membershipRef), eventRef ? tx.get(eventRef) : Promise.resolve(null)]);
      if (eventSnap?.exists) return membershipSnap.data();
      const account = accountSnap.data();
      if (account?.subscriptionId !== subscription.id || account?.attemptId !== binding.attemptId) {
        if (eventRef) tx.set(eventRef, { processedAt: now(), ignored: 'superseded subscription' });
        return membershipSnap.data();
      }
      const result = reconcileMembership({ binding, subscription, plan, ...history, previous: membershipSnap.data(), now: now(), cancelRequested: cancelled || account.cancelRequested === true });
      tx.set(membershipRef, result.membership);
      tx.set(accountRef, { trialUsed: account.trialUsed === true || result.trialUsed, cancelRequested: cancelled || account.cancelRequested === true, providerStatus: subscription.status }, { merge: true });
      if (eventRef) tx.set(eventRef, { processedAt: now(), subscriptionId: subscription.id });
      return result.membership;
    });
  }

  async function checkout(uid) {
    const accountRef = db.doc(`billingAccounts/${uid}`);
    const plan = await api(`plans/${config.planId}`);
    validatePlan(plan, config.planId);
    const attemptId = randomUUID();
    const createdAt = Math.floor(now() / 1000) * 1000;
    const reservation = await db.runTransaction(async (tx) => {
      const [accountSnap, membershipSnap, profileSnap, privateSnap] = await Promise.all([tx.get(accountRef), tx.get(db.doc(`entitlements/${uid}`)), tx.get(db.doc(`profiles/${uid}`)), tx.get(db.doc(`accounts/${uid}`))]);
      const profile = profileSnap.data();
      const account = privateSnap.data();
      const dob = new Date(`${account?.birthDate}T00:00:00Z`);
      const adult = new Date(createdAt);
      adult.setUTCFullYear(adult.getUTCFullYear() - 18);
      if (!profile || profile.status !== 'active' || profile.age < 18 || !Number.isFinite(dob.getTime()) || dob > adult) throw new HttpError(409, 'Complete an active adult profile before subscribing.');
      const current = accountSnap.data() || {};
      const decision = checkoutDecision(current, membershipSnap.data(), now());
      if (decision === 'active') throw new HttpError(409, 'Your paid membership is still available.');
      if (decision === 'blocked') throw new HttpError(409, 'Your earlier checkout is being reconciled. Do not make another payment; contact MakeIn support if it remains pending.');
      if (decision === 'reuse') return { existing: current.subscriptionId };
      const trial = current.trialUsed !== true;
      const binding = { uid, attemptId, trial, trialEnd: trial ? addCalendarMonth(createdAt) : 0 };
      tx.set(accountRef, { ...current, ...binding, phase: 'creating', startedAt: createdAt, cancelRequested: false });
      return binding;
    });
    if (reservation.existing) {
      const subscription = await api(`subscriptions/${encodeURIComponent(reservation.existing)}`);
      const binding = await data(db.doc(`billingSubscriptions/${subscription.id}`));
      if (!binding) throw new HttpError(409, 'Your checkout requires merchant reconciliation.');
      validateBinding(binding, subscription, plan);
      const membership = await reconcile(binding, subscription);
      if (membership?.currentPeriodEnd > now()) throw new HttpError(409, 'Your paid membership is still available.');
      if (!terminal(subscription)) return checkoutResult(subscription, binding);
      await db.runTransaction(async (tx) => {
        const current = (await tx.get(accountRef)).data();
        if (current.subscriptionId !== subscription.id) throw new HttpError(409, 'Membership changed. Please try again.');
        tx.set(accountRef, { subscriptionId: null, phase: 'ready', cancelRequested: false }, { merge: true });
      });
      return checkout(uid);
    }
    // A subscription POST has no documented idempotency key. Keep the reservation after any ambiguous failure.
    const subscription = await api('subscriptions', {
      plan_id: config.planId, quantity: 1, total_count: 1200, customer_notify: true,
      expire_by: Math.floor(createdAt / 1000) + 900,
      ...(reservation.trial ? { start_at: reservation.trialEnd / 1000, addons: [{ item: { name: 'MakeIn first calendar month', amount: 200, currency: 'INR' } }] } : {}),
      notes: { uid, attemptId, product: 'makein', trial: String(reservation.trial) },
    });
    const binding = { ...reservation, subscriptionId: subscription.id };
    validateBinding(binding, subscription, plan);
    await db.runTransaction(async (tx) => {
      const account = (await tx.get(accountRef)).data();
      if (account.attemptId !== attemptId) throw new HttpError(409, 'Checkout requires merchant reconciliation.');
      tx.set(db.doc(`billingSubscriptions/${subscription.id}`), binding);
      tx.set(accountRef, { ...binding, phase: 'created' }, { merge: true });
    });
    return checkoutResult(subscription, binding);
  }

  function checkoutResult(subscription, binding) {
    const url = new URL(subscription.short_url);
    if (url.protocol !== 'https:' || !['rzp.io', 'razorpay.com'].some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) throw new HttpError(502, 'The provider did not return a valid checkout URL.');
    return { url: url.href, subscriptionId: subscription.id, firstAmount: binding.trial ? 2 : 99, currency: 'INR', renewalAmount: 99, renewalAt: binding.trial ? binding.trialEnd : null };
  }

  async function cancel(uid) {
    const account = await data(db.doc(`billingAccounts/${uid}`));
    if (!account?.subscriptionId) throw new HttpError(409, account?.phase === 'creating' ? 'Checkout is still being reconciled. Contact MakeIn support to stop any pending mandate before paying.' : 'No membership subscription is linked to this account.');
    let subscription = await api(`subscriptions/${encodeURIComponent(account.subscriptionId)}`);
    const [binding, plan] = await Promise.all([data(db.doc(`billingSubscriptions/${subscription.id}`)), api(`plans/${config.planId}`)]);
    if (!binding || binding.uid !== uid) throw new HttpError(409, 'Membership requires merchant reconciliation.');
    validatePlan(plan, config.planId);
    validateBinding(binding, subscription, plan);
    if (!terminal(subscription) && !account.cancelRequested) {
      const cycle = subscription.current_start > 0 && subscription.current_end * 1000 > now();
      try { subscription = await api(`subscriptions/${subscription.id}/cancel`, { cancel_at_cycle_end: cycle }); }
      catch (error) {
        // Razorpay rejects cycle-end cancellation before the first cycle and during the final cycle.
        if (!cycle || error.providerStatus !== 400 || !/no billing cycle|final cycle/i.test(error.providerMessage || '')) throw error;
        subscription = await api(`subscriptions/${subscription.id}/cancel`, { cancel_at_cycle_end: false });
      }
      validateBinding(binding, subscription, plan);
    }
    // Record confirmed provider cancellation before further network work. A delayed webhook must not restore renewal.
    await db.runTransaction(async (tx) => {
      const accountRef = db.doc(`billingAccounts/${uid}`);
      const membershipRef = db.doc(`entitlements/${uid}`);
      const [current, paid] = await Promise.all([tx.get(accountRef), tx.get(membershipRef)]);
      if (current.data()?.subscriptionId !== subscription.id) throw new HttpError(409, 'Membership changed. Please try again.');
      tx.set(accountRef, { cancelRequested: true }, { merge: true });
      const membership = paid.data();
      if (membership?.subscriptionId === subscription.id) tx.set(membershipRef, { status: 'cancelled', subscriptionId: subscription.id, currentPeriodEnd: membership.currentPeriodEnd });
    });
    const membership = await reconcile(binding, subscription, null, true);
    return { membership, cancelled: true };
  }

  async function webhook(request) {
    const raw = Buffer.from(await request.arrayBuffer());
    if (raw.length > 262144) throw new HttpError(413, 'Webhook too large.');
    if (!verifyWebhook(raw, request.headers.get('x-razorpay-signature'), config.webhookSecret)) throw new HttpError(401, 'Invalid webhook signature.');
    let event;
    try { event = JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'Invalid webhook JSON.'); }
    const id = request.headers.get('x-razorpay-event-id');
    if (!id || id.length > 256) throw new HttpError(400, 'Missing webhook event ID.');
    const eventRef = db.doc(`paymentEvents/${createHash('sha256').update(id).digest('hex')}`);
    if ((await eventRef.get()).exists) return { received: true, duplicate: true };
    let subscriptionId = event.payload?.subscription?.entity?.id || event.payload?.invoice?.entity?.subscription_id;
    if (!subscriptionId && event.payload?.payment?.entity?.invoice_id) {
      const invoice = await api(`invoices/${encodeURIComponent(event.payload.payment.entity.invoice_id)}`);
      subscriptionId = invoice.subscription_id;
    }
    if (!subscriptionId) return { received: true, ignored: true };
    const subscription = await api(`subscriptions/${encodeURIComponent(subscriptionId)}`);
    let binding = await data(db.doc(`billingSubscriptions/${subscriptionId}`));
    if (!binding) {
      // Recover a successful create if the process stopped before persisting its response.
      const uid = subscription.notes?.uid;
      if (typeof uid !== 'string' || uid.includes('/')) return { received: true, ignored: true };
      binding = await db.runTransaction(async (tx) => {
        const accountRef = db.doc(`billingAccounts/${uid}`);
        const account = (await tx.get(accountRef)).data();
        if (account?.phase !== 'creating' || account.attemptId !== subscription.notes?.attemptId) return null;
        const recovered = { uid, subscriptionId, attemptId: account.attemptId, trial: account.trial, trialEnd: account.trialEnd };
        tx.set(db.doc(`billingSubscriptions/${subscriptionId}`), recovered);
        tx.set(accountRef, { subscriptionId, phase: 'created' }, { merge: true });
        return recovered;
      });
    }
    if (!binding) return { received: true, ignored: true };
    await reconcile(binding, subscription, eventRef);
    return { received: true };
  }

  return async (route, request) => {
    const origin = request.headers.get('origin');
    const allowedOrigin = origin && (config.origins.includes(origin) || origin === new URL(request.url).origin);
    const headers = { 'cache-control': 'no-store', ...(allowedOrigin ? { 'access-control-allow-origin': origin, vary: 'Origin' } : {}) };
    try {
      if (origin && !allowedOrigin && route !== 'payment-webhook') throw new HttpError(403, 'This origin is not allowed.');
      if (request.method === 'OPTIONS' && route !== 'payment-webhook') return new Response(null, { status: 204, headers: { ...headers, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'authorization, content-type' } });
      if (request.method !== 'POST') throw new HttpError(405, 'Use POST.');
      if (route === 'payment-webhook') return Response.json(await webhook(request), { headers });
      const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1];
      if (!token) throw new HttpError(401, 'Sign in before managing membership.');
      let user;
      try { user = await verifyToken(token, true); } catch { throw new HttpError(401, 'Your session has expired. Sign in again.'); }
      if (!user.uid || user.uid.includes('/')) throw new HttpError(401, 'Invalid account.');
      const result = route === 'checkout' ? await checkout(user.uid) : await cancel(user.uid);
      return Response.json(result, { headers });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 502;
      // Never expose provider payloads, tokens or private keys in client errors/logs.
      return Response.json({ error: error instanceof HttpError ? error.message : 'Payment verification is temporarily unavailable. Please try again or contact MakeIn support if checkout is pending.' }, { status, headers });
    }
  };
}

export async function paymentHandler(route, request, env = process.env) {
  const required = ['RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'RAZORPAY_PLAN_ID', 'RAZORPAY_WEBHOOK_SECRET', 'FIREBASE_SERVICE_ACCOUNT_JSON'];
  if (env.PAYMENTS_ENABLED !== 'true' || required.some((key) => !env[key])) return Response.json({ error: 'Membership payments are not configured yet. Profile setup and demo remain available.' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  try {
    const [{ getApps, initializeApp, cert }, { getAuth }, { getFirestore }] = await Promise.all([import('firebase-admin/app'), import('firebase-admin/auth'), import('firebase-admin/firestore')]);
    const app = getApps().find((value) => value.name === 'makein-payments') || initializeApp({ credential: cert(JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON)) }, 'makein-payments');
    const api = async (path, body) => {
      const response = await fetch(`https://api.razorpay.com/v1/${path}`, { method: body ? 'POST' : 'GET', headers: { authorization: `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(15000) });
      const result = await response.json();
      if (!response.ok) { const error = new Error('Provider request failed'); error.providerStatus = response.status; error.providerMessage = result.error?.description; throw error; }
      return result;
    };
    return createPaymentService({ db: getFirestore(app), verifyToken: (token, checkRevoked) => getAuth(app).verifyIdToken(token, checkRevoked), api, config: { planId: env.RAZORPAY_PLAN_ID, webhookSecret: env.RAZORPAY_WEBHOOK_SECRET, origins: (env.PAYMENT_ALLOWED_ORIGINS || '').split(',').filter(Boolean) } })(route, request);
  } catch { return Response.json({ error: 'Membership payments are temporarily unavailable.' }, { status: 503, headers: { 'cache-control': 'no-store' } }); }
}
