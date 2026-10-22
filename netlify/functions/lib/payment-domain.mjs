import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';

export function addCalendarMonth(value) {
  const date = new Date(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const last = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, last));
  return date.getTime();
}

export function verifyWebhook(raw, signature, secret) {
  if (!secret || typeof signature !== 'string' || !/^[a-f\d]{64}$/i.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}

function requireValue(condition, message) {
  if (!condition) throw new Error(`Payment verification failed: ${message}`);
}

export function validatePlan(plan, planId) {
  requireValue(plan.id === planId && plan.period === 'monthly' && plan.interval === 1 && plan.item?.amount === 9900 && plan.item?.currency === 'INR', 'expected ₹99 INR monthly plan');
}

export function validateBinding(binding, subscription, plan) {
  validatePlan(plan, subscription.plan_id);
  requireValue(subscription.id === binding.subscriptionId && subscription.notes?.uid === binding.uid && subscription.notes?.attemptId === binding.attemptId && subscription.quantity === 1, 'subscription ownership');
  if (binding.trial) requireValue(subscription.start_at * 1000 === binding.trialEnd, 'trial renewal date');
}

// Reconcile provider-fetched objects, never webhook payloads or browser callbacks.
export function reconcileMembership({ binding, subscription, plan, invoices, payments, previous, now, cancelRequested = false }) {
  validateBinding(binding, subscription, plan);
  let expiry = previous?.subscriptionId === subscription.id ? previous.currentPeriodEnd : 0;
  let trialUsed = false;
  for (const invoice of invoices) {
    requireValue(invoice.subscription_id === subscription.id && invoice.currency === 'INR', 'invoice subscription/currency');
    if (invoice.status !== 'paid') continue;
    const payment = payments.find((item) => item.id === invoice.payment_id);
    if (!payment || payment.status !== 'captured' || payment.captured !== true) continue;
    requireValue(payment.invoice_id === invoice.id && payment.order_id === invoice.order_id && payment.currency === 'INR' && payment.amount === invoice.amount && invoice.amount_paid === invoice.amount && invoice.amount_due === 0, 'captured payment/invoice amount or binding');
    if (payment.amount_refunded > 0) continue;
    const lines = invoice.line_items;
    const line = lines?.[0];
    requireValue(lines?.length === 1 && line.currency === 'INR' && line.quantity === 1 && line.amount === invoice.amount, 'invoice line items');
    if (binding.trial && invoice.amount === 200 && line.type === 'addon') {
      requireValue(invoice.paid_at * 1000 < binding.trialEnd, 'introductory payment date');
      expiry = Math.max(expiry, binding.trialEnd);
      trialUsed = true;
    } else {
      requireValue(invoice.amount === 9900 && line.type === 'plan', 'monthly charge');
      const from = invoice.billing_start * 1000;
      const end = invoice.billing_end * 1000;
      requireValue(Number.isSafeInteger(from) && Number.isSafeInteger(end) && end > from && end - from <= 32 * 86400000 && (!binding.trial || from >= binding.trialEnd), 'monthly paid period');
      expiry = Math.max(expiry, end);
    }
  }
  const cancelled = cancelRequested || previous?.status === 'cancelled' || ['cancelled', 'completed', 'expired'].includes(subscription.status);
  const membership = { status: cancelled ? 'cancelled' : expiry > now ? 'active' : 'inactive', currentPeriodEnd: expiry, subscriptionId: subscription.id };
  if (!cancelled && expiry > now && ['authenticated', 'active', 'pending'].includes(subscription.status) && subscription.charge_at * 1000 >= expiry) membership.renewalAt = subscription.charge_at * 1000;
  return { membership, trialUsed };
}

export function checkoutDecision(account, membership, now) {
  if (membership?.currentPeriodEnd > now) return 'active';
  if (account?.subscriptionId) return 'reuse';
  if (account?.phase === 'creating') return 'blocked';
  return 'create';
}
