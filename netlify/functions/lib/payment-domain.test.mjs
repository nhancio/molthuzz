import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { addCalendarMonth, verifyWebhook, reconcileMembership, checkoutDecision } from './payment-domain.mjs';

const start = Date.parse('2024-01-31T08:15:00Z');
const trialEnd = Date.parse('2024-02-29T08:15:00Z');
const plan = { id: 'plan_monthly', period: 'monthly', interval: 1, item: { amount: 9900, currency: 'INR' } };
const binding = { uid: 'alice', subscriptionId: 'sub_alice', attemptId: 'attempt', trial: true, trialEnd };
const subscription = { id: 'sub_alice', plan_id: plan.id, quantity: 1, notes: { uid: 'alice', attemptId: 'attempt' }, status: 'authenticated', start_at: trialEnd / 1000, current_end: null, charge_at: trialEnd / 1000 };
const upfront = { id: 'inv_intro', subscription_id: 'sub_alice', order_id: 'order_intro', payment_id: 'pay_intro', status: 'paid', amount: 200, amount_paid: 200, amount_due: 0, currency: 'INR', paid_at: start / 1000, line_items: [{ type: 'addon', amount: 200, quantity: 1, currency: 'INR' }] };
const payment = { id: 'pay_intro', invoice_id: 'inv_intro', order_id: 'order_intro', status: 'captured', captured: true, amount: 200, currency: 'INR', amount_refunded: 0 };
const snapshot = (changes = {}) => ({ binding, subscription, plan, invoices: [upfront], payments: [payment], previous: null, now: start + 1000, ...changes });

test('calendar month clamps leap and ordinary February and preserves time', () => {
  assert.equal(addCalendarMonth(start), trialEnd);
  assert.equal(addCalendarMonth(Date.parse('2025-01-31T23:59:30Z')), Date.parse('2025-02-28T23:59:30Z'));
  assert.equal(addCalendarMonth(Date.parse('2025-12-31T08:15:00Z')), Date.parse('2026-01-31T08:15:00Z'));
});

test('webhook signature covers exact raw bytes and rejects malformed lengths safely', () => {
  const raw = Buffer.from('{ "event": "subscription.charged" }');
  const signature = createHmac('sha256', 'secret').update(raw).digest('hex');
  assert.equal(verifyWebhook(raw, signature, 'secret'), true);
  assert.equal(verifyWebhook(Buffer.from('{"event":"subscription.charged"}'), signature, 'secret'), false);
  for (const invalid of ['', 'a', 'zz'.repeat(32), 'a'.repeat(66), null]) assert.equal(verifyWebhook(raw, invalid, 'secret'), false);
});

test('captured ₹2 upfront grants first month even before recurring billing begins', () => {
  assert.deepEqual(reconcileMembership(snapshot()), { membership: { status: 'active', subscriptionId: 'sub_alice', currentPeriodEnd: trialEnd, renewalAt: trialEnd }, trialUsed: true });
});

test('mandate authentication or authorized payment alone cannot activate access', () => {
  assert.equal(reconcileMembership(snapshot({ payments: [{ ...payment, status: 'authorized', captured: false }] })).membership.status, 'inactive');
  assert.equal(reconcileMembership(snapshot({ invoices: [], payments: [] })).membership.currentPeriodEnd, 0);
});

test('wrong plan, price, currency, owner, attempt or invoice binding cannot grant access', () => {
  for (const changes of [
    { plan: { ...plan, item: { amount: 100, currency: 'INR' } } },
    { plan: { ...plan, period: 'yearly' } },
    { subscription: { ...subscription, plan_id: 'plan_other' } },
    { subscription: { ...subscription, notes: { uid: 'bob', attemptId: 'attempt' } } },
    { subscription: { ...subscription, notes: { uid: 'alice', attemptId: 'other' } } },
    { invoices: [{ ...upfront, subscription_id: 'sub_other' }] },
    { invoices: [{ ...upfront, currency: 'USD' }] },
    { payments: [{ ...payment, amount: 100 }] },
    { payments: [{ ...payment, order_id: 'order_other' }] },
  ]) assert.throws(() => reconcileMembership(snapshot(changes)));
});

test('a stale paid invoice cannot shorten later paid access or undo cancellation', () => {
  const later = Date.parse('2024-03-29T08:15:00Z');
  const previous = { status: 'cancelled', currentPeriodEnd: later, subscriptionId: 'sub_alice' };
  const result = reconcileMembership(snapshot({ previous }));
  assert.equal(result.membership.currentPeriodEnd, later);
  assert.equal(result.membership.status, 'cancelled');
  assert.equal(result.membership.renewalAt, undefined);
  assert.deepEqual(reconcileMembership(snapshot({ previous: result.membership })), result);
});

test('recurring ₹99 captured invoice extends only to its paid billing end', () => {
  const end = Date.parse('2024-03-29T08:15:00Z');
  const recurring = { ...upfront, id: 'inv_month', order_id: 'order_month', payment_id: 'pay_month', amount: 9900, amount_paid: 9900, billing_start: trialEnd / 1000, billing_end: end / 1000, line_items: [{ type: 'plan', amount: 9900, currency: 'INR', quantity: 1 }] };
  const paid = { ...payment, id: 'pay_month', invoice_id: 'inv_month', order_id: 'order_month', amount: 9900 };
  assert.equal(reconcileMembership(snapshot({ subscription: { ...subscription, status: 'active', current_end: end / 1000, charge_at: end / 1000 }, invoices: [recurring], payments: [paid], now: trialEnd + 1000 })).membership.currentPeriodEnd, end);
});

test('cancellation before first renewal retains verified trial expiry', () => {
  const result = reconcileMembership(snapshot({ subscription: { ...subscription, status: 'cancelled', current_end: null } }));
  assert.deepEqual(result.membership, { status: 'cancelled', subscriptionId: 'sub_alice', currentPeriodEnd: trialEnd });
});

test('unpaid cancellation cannot grant the future subscription start date', () => {
  const result = reconcileMembership(snapshot({ subscription: { ...subscription, status: 'cancelled' }, invoices: [], payments: [] }));
  assert.equal(result.membership.currentPeriodEnd, 0);
  assert.equal(result.trialUsed, false);
});

test('checkout retries reuse subscription and ambiguous creates never create a second one', () => {
  assert.equal(checkoutDecision({ subscriptionId: 'sub_a' }, null, start), 'reuse');
  assert.equal(checkoutDecision({ phase: 'creating', attemptId: 'x' }, null, start), 'blocked');
  assert.equal(checkoutDecision({}, { status: 'cancelled', currentPeriodEnd: trialEnd }, start), 'active');
  assert.equal(checkoutDecision({ trialUsed: true }, null, start), 'create');
});
