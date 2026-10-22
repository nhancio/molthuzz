# MakeIn membership payments

The Razorpay adapter is prepared locally. It has **not** processed a merchant test transaction or a live debit. Both payment flags default to false. A missing merchant configuration returns HTTP 503; browser completion never activates access.

## Merchant prerequisites

1. Confirm the user's payment provider. Razorpay is a proposed adapter, not an account selected or opened on the user's behalf.
2. Use a MakeIn merchant account with Subscriptions and **UPI AutoPay** enabled in the appropriate test/live modes. Configure UPI as the allowed method in the merchant settings. Verify hosted checkout's supported intent/QR behavior on real Android/iOS devices. No personal UPI ID or static QR can implement this recurring mandate.
3. Have the merchant/provider verify **₹2 captured upfront, followed by ₹99/month after the first calendar month**. The Create Subscription API documents an upfront `addons` amount with future `start_at`; the current FAQ also says Add-ons are deprecated. This distinction must be resolved with an actual account test before enabling payments. Do not silently substitute a refundable ₹5 mandate token for the ₹2 membership purchase. [Create Subscription](https://razorpay.com/docs/api/payments/subscriptions/create-subscription/), [Subscriptions FAQ](https://razorpay.com/docs/payments/subscriptions/faqs/).
4. Create a ₹99 INR plan: `period: monthly`, `interval: 1`, `item.amount: 9900`, `item.currency: INR`. The handler fetches and checks these values rather than trusting an environment plan ID. [Fetch Plan](https://razorpay.com/docs/api/payments/subscriptions/fetch-a-plan).
5. Supply MakeIn's Firebase Admin service account and merchant credentials through Netlify's server environment. Never put server credentials in Expo's public environment, client code, Git, logs or screenshots.

## Environment

Copy public placeholders from `.env.example` to the appropriate local/build environment. `EXPO_PUBLIC_API_URL` is the origin hosting the functions, currently `https://makein-nhancio.netlify.app`. `EXPO_PUBLIC_PAYMENTS_ENABLED=true` advertises checkout availability only after verification. A client build must be regenerated when public environment values change.

Server runtime variables:

| Variable | Value |
| --- | --- |
| `PAYMENTS_ENABLED` | `true` only after merchant verification |
| `RAZORPAY_KEY_ID` | Test/live key for the same MakeIn merchant as the plan |
| `RAZORPAY_KEY_SECRET` | Matching server secret |
| `RAZORPAY_PLAN_ID` | Verified ₹99 INR monthly plan |
| `RAZORPAY_WEBHOOK_SECRET` | Independent webhook signing secret |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Serialized service account JSON for MakeIn Firebase only |
| `PAYMENT_ALLOWED_ORIGINS` | Comma-separated exact web origins, no wildcard |

The adapter uses documented HTTP Basic authentication (`key_id:key_secret`) over HTTPS to Razorpay. Its Firebase bearer verification checks revocation with `verifyIdToken(token, true)`. No credentials are fetched from another project.

## Endpoints and checkout

Netlify modern Request/Response functions:

- `POST /.netlify/functions/checkout`: Firebase bearer token required. Checks an active, adult profile and private birth date, current paid access, prior trial use and transactional checkout state. Returns a provider hosted `short_url`, amount and renewal information.
- `POST /.netlify/functions/cancel-membership`: Firebase bearer token required; acts only on the server-bound subscription.
- `POST /.netlify/functions/payment-webhook`: Exact raw-body HMAC-SHA256 and `x-razorpay-event-id` required. No client token or browser callback is an activation path.

A first checkout reserves a per-UID attempt before making the provider request, sets quantity 1, a future start date and a ₹2 upfront item. UTC month arithmetic preserves time and clamps month-end dates (31 January → 28/29 February). The renewal date is anchored to checkout creation and disclosed by the response; the checkout expires after 15 minutes. The recurring plan supports at most 1,200 monthly cycles. Returning customers with consumed trial history start at ₹99 without another introductory charge.

Native clients open the provider URL with Expo WebBrowser; web navigates to it. Closing checkout, authorizing a mandate or returning to the app never marks membership active. UI uses the existing `watchMembership` listener to observe verified server entitlements.

## Webhook verification and ordering

Subscribe to subscription lifecycle events, including `subscription.authenticated`, `subscription.activated`, `subscription.charged`, `subscription.pending`, `subscription.halted`, `subscription.cancelled` and `subscription.completed`, plus `invoice.paid` and `payment.captured`. Endpoint: `https://makein-nhancio.netlify.app/.netlify/functions/payment-webhook`.

The raw bytes are verified before JSON parsing. Processing fetches the current subscription, configured plan, subscription invoices and captured payments from Razorpay. It checks UID/attempt/subscription ownership, amount, currency, invoice/payment/order binding and paid period. A mandate without a captured ₹2 invoice cannot grant the introductory month. A paid ₹99 invoice grants only its billed month. An event ID is stored in the same Firestore transaction as the entitlement; duplicate events cannot write twice. Event payload status never overrides authoritative provider state. Previously paid expiry cannot be shortened by stale event delivery, and confirmed cancellation cannot be reversed by a delayed activation event. [Webhook Validation](https://razorpay.com/docs/webhooks/validate-test/), [Subscription Invoices](https://razorpay.com/docs/api/payments/subscriptions/fetch-invoices).

## Server data

- `entitlements/{uid}` contains only client-readable membership fields: `status`, `currentPeriodEnd` in milliseconds, optional `renewalAt` and `subscriptionId`. Clients must never write it.
- `billingAccounts/{uid}` stores trial history, the current subscription, pending attempt and cancellation state.
- `billingSubscriptions/{subscriptionId}` binds a provider subscription to UID and checkout attempt, with the immutable introductory renewal date.
- `paymentEvents/{sha256(eventId)}` stores completed event processing. Billing and event collections require a default-deny client rule; server Admin writes bypass client rules.

Trial history must survive ordinary membership cancellation. Account deletion must cancel the merchant mandate before identity/data removal. Do not delete a billing account while an external recurring mandate can still debit the customer. Refund/dispute handling and retention policy need a merchant operational process before launch; this adapter covers checkout, paid periods and cancellation.

## Cancellation and ambiguous requests

During an active cycle the adapter requests `cancel_at_cycle_end: true`. Before the first regular billing cycle it cancels immediately, preserving any **already verified** ₹2 paid expiry. An unpaid cancellation has zero access; a future `start_at` is never payment evidence. Terminal subscriptions are safe to cancel repeatedly. Confirmed cancellation is persisted before further invoice reconciliation, and cancelled subscriptions with future paid expiry remain usable until that expiry. [Cancel Subscription](https://razorpay.com/docs/api/payments/subscriptions/cancel-subscription/).

Razorpay's subscription POST has no documented idempotency key. MakeIn intentionally retains a `creating` reservation if the network response is ambiguous, preventing a second subscription from retries. An authenticated webhook can recover the binding from the matching UID/attempt notes. If no webhook arrives, the merchant must inspect Razorpay using the persisted attempt ID: bind the one matching subscription or confirm no subscription exists before clearing the reservation. Never clear it on a timer. Users must be able to contact MakeIn support or cancel a UPI mandate in their UPI app while reconciliation is pending.

## Verification before enabling

Run `rtk proxy node --test netlify/functions/lib/*.test.mjs`. Test-mode acceptance must include ₹2 capture, refundable-token non-activation, recurring ₹99 capture, decline/abandonment, repeated requests, webhook retries/out-of-order delivery, UPI-app cancellation, cancellation before first billing and paid access after cancellation. Verify the exact first invoice and payment response fields against the account. Test service credentials and plan must never produce production entitlements. Enable production only with matching live credentials and webhook secret, after the provider and user have approved this billing behavior.
