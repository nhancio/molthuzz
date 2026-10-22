import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createPaymentService, paymentHandler } from './payment-service.mjs';

const now = Date.parse('2024-01-31T08:15:00Z');
const end = Date.parse('2024-02-29T08:15:00Z');
const plan = { id: 'plan_monthly', interval: 1, period: 'monthly', item: { amount: 9900, currency: 'INR' } };
const config = { planId: plan.id, webhookSecret: 'test-webhook-secret', origins: ['https://makein.example'] };

// Firestore is an external boundary; keep transaction serialization and persisted reads/writes real.
function database(initial) {
  const records = new Map(Object.entries(initial));
  let tail = Promise.resolve();
  const doc = (path) => ({ path, get: async () => ({ exists: records.has(path), data: () => structuredClone(records.get(path)) }) });
  return { records, doc, runTransaction(fn) {
    const run = tail.then(() => fn({ get: (ref) => ref.get(), set: (ref, value, options) => records.set(ref.path, options?.merge ? { ...records.get(ref.path), ...structuredClone(value) } : structuredClone(value)) }));
    tail = run.catch(() => {});
    return run;
  } };
}

function fixture(initial = {}) {
  const db = database({ 'profiles/alice': { status: 'active', age: 30 }, 'accounts/alice': { birthDate: '1993-04-10' }, ...initial });
  const calls = [];
  let sub;
  const api = async (path, body) => {
    calls.push({ path, body });
    if (path === `plans/${plan.id}`) return plan;
    if (path === 'subscriptions') {
      sub = { id: 'sub_alice', ...body, status: 'created', short_url: 'https://rzp.io/i/test', current_end: null, charge_at: body.start_at };
      return sub;
    }
    if (path === 'subscriptions/sub_alice/cancel') return (sub = { ...sub, status: body.cancel_at_cycle_end ? sub.status : 'cancelled' });
    if (path === 'subscriptions/sub_alice') return sub;
    if (path.startsWith('invoices?')) return { items: [], count: 0 };
    throw new Error(`Unexpected API call ${path}`);
  };
  const service = createPaymentService({ db, api, verifyToken: async (token, revoked) => { assert.equal(token, 'valid'); assert.equal(revoked, true); return { uid: 'alice' }; }, config, now: () => now });
  return { db, calls, api, service, setSubscription: (value) => { sub = value; } };
}

const request = (route, options = {}) => new Request(`https://makein.example/.netlify/functions/${route}`, { method: 'POST', headers: { authorization: 'Bearer valid', origin: 'https://makein.example', 'content-type': 'application/json' }, body: '{}', ...options });

test('unconfigured merchant returns 503 without initializing Firebase or pretending payment succeeded', async () => {
  const response = await paymentHandler('checkout', request('checkout'), {});
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /not configured/i);
});

test('authenticated checkout creates ₹2 intro and future monthly billing, then retry reuses URL', async () => {
  const f = fixture();
  const first = await f.service('checkout', request('checkout'));
  assert.equal(first.status, 200);
  assert.equal((await first.json()).url, 'https://rzp.io/i/test');
  const created = f.calls.find((call) => call.path === 'subscriptions').body;
  assert.equal(created.start_at, end / 1000);
  assert.deepEqual(created.addons, [{ item: { name: 'MakeIn first calendar month', amount: 200, currency: 'INR' } }]);
  assert.equal(created.plan_id, plan.id);
  assert.equal(f.db.records.has('entitlements/alice'), false);
  assert.equal((await f.service('checkout', request('checkout'))).status, 200);
  assert.equal(f.calls.filter((call) => call.path === 'subscriptions').length, 1);
});

test('concurrent checkout cannot create duplicate subscriptions', async () => {
  const f = fixture();
  const responses = await Promise.all([f.service('checkout', request('checkout')), f.service('checkout', request('checkout'))]);
  assert.equal(responses.filter((response) => response.status === 200).length, 1);
  assert.equal(f.calls.filter((call) => call.path === 'subscriptions').length, 1);
});

test('existing trial history removes introductory price from future checkout', async () => {
  const f = fixture({ 'billingAccounts/alice': { trialUsed: true } });
  assert.equal((await f.service('checkout', request('checkout'))).status, 200);
  const body = f.calls.find((call) => call.path === 'subscriptions').body;
  assert.equal(body.start_at, undefined);
  assert.equal(body.addons, undefined);
});

test('missing auth, disallowed origin, inactive profile and active paid account are rejected', async () => {
  assert.equal((await fixture().service('checkout', request('checkout', { headers: {} }))).status, 401);
  assert.equal((await fixture().service('checkout', request('checkout', { headers: { authorization: 'Bearer valid', origin: 'https://evil.example' } }))).status, 403);
  assert.equal((await fixture({ 'profiles/alice': { status: 'paused', age: 30 } }).service('checkout', request('checkout'))).status, 409);
  assert.equal((await fixture({ 'entitlements/alice': { status: 'active', currentPeriodEnd: end } }).service('checkout', request('checkout'))).status, 409);
});

test('ambiguous provider create failure leaves persistent lock so retry cannot double charge', async () => {
  const f = fixture({ 'billingAccounts/alice': { phase: 'creating', attemptId: 'unknown', startedAt: now - 3600000 } });
  assert.equal((await f.service('checkout', request('checkout'))).status, 409);
  assert.equal(f.calls.filter((call) => call.path === 'subscriptions').length, 0);
});

test('cancellation before first normal billing cancels immediately and retains paid trial access', async () => {
  const f = fixture();
  await f.service('checkout', request('checkout'));
  f.db.records.set('entitlements/alice', { status: 'active', subscriptionId: 'sub_alice', currentPeriodEnd: end, renewalAt: end });
  const response = await f.service('cancel-membership', request('cancel-membership'));
  assert.equal(response.status, 200);
  assert.deepEqual(f.calls.find((call) => call.path.endsWith('/cancel')).body, { cancel_at_cycle_end: false });
  assert.deepEqual(f.db.records.get('entitlements/alice'), { status: 'cancelled', subscriptionId: 'sub_alice', currentPeriodEnd: end });
});

test('confirmed cancellation is persisted even if invoice reconciliation temporarily fails', async () => {
  const f = fixture();
  await f.service('checkout', request('checkout'));
  f.db.records.set('entitlements/alice', { status: 'active', subscriptionId: 'sub_alice', currentPeriodEnd: end, renewalAt: end });
  const service = createPaymentService({ db: f.db, config, now: () => now, verifyToken: async () => ({ uid: 'alice' }), api: async (path, body) => {
    if (path.startsWith('invoices?')) throw new Error('Provider unavailable');
    return f.api(path, body);
  } });
  assert.equal((await service('cancel-membership', request('cancel-membership'))).status, 502);
  assert.equal(f.db.records.get('billingAccounts/alice').cancelRequested, true);
  assert.deepEqual(f.db.records.get('entitlements/alice'), { status: 'cancelled', subscriptionId: 'sub_alice', currentPeriodEnd: end });
});

test('invalid webhook signature cannot read provider or change entitlement', async () => {
  const f = fixture();
  const response = await f.service('payment-webhook', request('payment-webhook', { headers: { 'x-razorpay-signature': 'short' }, body: '{"event":"subscription.charged"}' }));
  assert.equal(response.status, 401);
  assert.equal(f.calls.length, 0);
});

test('signed webhook reconciles current provider state once and cannot replay cancellation into activation', async () => {
  const f = fixture();
  await f.service('checkout', request('checkout'));
  f.setSubscription({ id: 'sub_alice', plan_id: plan.id, notes: f.calls.find((call) => call.path === 'subscriptions').body.notes, quantity: 1, status: 'cancelled', start_at: end / 1000, current_end: null });
  const raw = JSON.stringify({ event: 'subscription.activated', payload: { subscription: { entity: { id: 'sub_alice', status: 'active' } } } });
  const headers = { 'x-razorpay-signature': createHmac('sha256', config.webhookSecret).update(raw).digest('hex'), 'x-razorpay-event-id': 'event_cancelled' };
  assert.equal((await f.service('payment-webhook', request('payment-webhook', { headers, body: raw }))).status, 200);
  assert.equal(f.db.records.get('entitlements/alice').status, 'cancelled');
  const calls = f.calls.length;
  assert.equal((await f.service('payment-webhook', request('payment-webhook', { headers, body: raw }))).status, 200);
  assert.equal(f.calls.length, calls);
});
