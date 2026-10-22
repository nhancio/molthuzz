# Task 3 payment subsystem report

Implemented locally in Netlify functions and `src/lib/payments.ts`, with disabled example configuration and merchant setup guidance. No merchant account was created, no secrets were obtained from another app, no live subscription was created and no payment was represented as successful.

## Delivered behavior

- Authenticated hosted checkout using Firebase Admin token revocation checks and adult/profile validation.
- Proposed Razorpay ₹2 upfront/future-start ₹99 monthly subscription, with configured plan and captured invoice validation.
- One introductory offer per Firebase UID, server-only billing state and transactional checkout reservation. Existing retries reuse the subscription; uncertain provider creates stay locked for reconciliation rather than creating a duplicate mandate.
- Raw-byte webhook HMAC with constant-time comparison and malformed-signature protection; event-ID transactional deduplication; provider-authoritative subscription/invoice/payment reconciliation; immutable owner/attempt/plan binding.
- Paid introductory access without waiting for the first regular charge, while mandate authentication alone never grants access. Captured monthly invoices extend only their paid billing period. Stale events cannot shorten paid access or restore cancelled renewals.
- Authenticated cancellation, including immediate provider cancellation before the first ordinary billing cycle, preservation of paid access and persistence of cancellation before potentially failing reconciliation calls.
- Native Expo WebBrowser checkout and web navigation. Membership is observed through the existing server entitlement listener; no client success callback writes membership.
- Honest 503 response while merchant configuration is unavailable.

## Verification

TDD red/green evidence: initial stub implementations failed eight domain assertions and all nine initial service tests. The implementation then passed the focused tests. A further regression test exposed cancellation state being persisted too late when invoice fetch fails; after correction that test passed as well.

Latest focused run: **20 tests passed, 0 failed** using `rtk proxy node --test netlify/functions/lib/payment-domain.test.mjs netlify/functions/lib/payment-service.test.mjs`.

Tests cover leap/non-leap month-end arithmetic, exact raw signature bytes and invalid lengths, invoice/payment/owner/plan/currency binding, captured introductory and recurring access, authentication without capture, unpaid cancellation, paid cancellation retention, stale/replayed state, checkout concurrency and retries, past trial history, unavailable configuration, origin/auth/profile gating, ambiguous-create lock and cancellation reconciliation failure. Full `rtk proxy npm test` passed **27 tests, 0 failures**. TypeScript `rtk proxy npx tsc --noEmit` and targeted `rtk proxy npx eslint src/lib/payments.ts netlify/functions --no-ignore` also exited 0.

External Firebase/Razorpay boundaries use isolated in-memory data and provider fixtures for focused tests. Actual Firestore transaction integration, real UPI intent/QR checkout, test capture, renewal and live merchant flows have not been verified by this payment subtask.

## Remaining prerequisites and limits

The user requested UPI AutoPay and has not selected a merchant provider. The Razorpay adapter remains a proposal. It requires the MakeIn merchant's UPI AutoPay enablement, keys, exact monthly plan, webhook secret and Firebase Admin credentials before use. Public/server payment flags stay false.

The current Razorpay Create Subscription documentation supports upfront amounts via `addons`, while its FAQ says the Add-ons feature is deprecated. The exact ₹2 captured upfront plus ₹99 monthly UPI arrangement must be confirmed against the selected merchant account. The code fails closed when invoices do not match; it must not be advertised as tested billing. Hosted UPI app/intent/QR support also depends on provider enablement and device support. [Create Subscription](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/), [Subscriptions FAQ](https://razorpay.com/docs/payments/subscriptions/faqs/).

Renewal is anchored to checkout creation (15-minute payment window), using clamped UTC calendar months. Uncertain create responses require provider reconciliation; reservations deliberately have no automatic expiry. Histories are bounded to the configured 1,200 cycles; a larger billing product needs a persisted invoice ledger. Refund/dispute operations and billing retention/deletion policy require merchant processes before live release. See `docs/payments-setup.md` for environment, webhook and acceptance details.
