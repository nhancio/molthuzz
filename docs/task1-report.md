# Task 1 — MakeIn Firebase domain and client

Implemented the binding APIs in `src/lib/contracts.ts` without changing that contract or the payment module. No cloud resources were created or deployed.

## Delivered

- Domain validation for real Gregorian birthdays and the exact 18th birthday, ages 18–100, strict supported fields, bounded nonblank text, gender/intent enums, distinct preferences/interests, up to six HTTPS photos and three prompts. Public profiles contain age; DOB lives only in owner-readable `accounts/{uid}`. Atomic saves check account DOB and public age together.
- Deliberate distance/velocity swipe thresholds, canonical sorted pair IDs, mutual preference/age/city filtering, calendar-month clamping, and entitlement checks that preserve cancelled subscriptions through their paid end.
- Ten visibly marked fictional demo cards, with adult ages, mixed genders, original sample biographies and stock portrait URLs. Demo IDs are rejected by real interaction services. The UI must continue labelling and isolating demo activity.
- Nullable, environment-configured Firebase app/Auth/Firestore/Storage instances; persistent web Auth and Google popup; native AsyncStorage Auth persistence and Google native ID-token sign-in/reauthentication. Clear unconfigured/provider errors.
- Owner profile/account services; bounded discovery; immutable likes/passes; reciprocal atomic match transactions; incoming likes; match/message/membership subscriptions; text messages; JPEG/PNG/WebP uploads with an 8 MB cap and actionable Storage/billing errors; blocks; reports; ending matches; retryable account-data cleanup.
- Firestore rules and indexes matching those query shapes. Entitlements are server-write-only, own-read. Real swipes and messages require a future active or cancelled entitlement. Rules enforce active profiles, reciprocal likes, immutable canonical membership, exactly two members, verified profile names/photos, message authorship/privacy, and blocks in either direction. Safety controls and deletion do not require payment. History remains readable to conversation members after a subscription expires or a conversation ends.
- Storage rules restrict uploads/deletion/listing to the owner, image MIME types and file size. Authenticated photo reads support public dating profiles; Firebase download tokens in stored URLs provide the usual persistent image access.

## Data layout

`profiles/{uid}` contains public profile fields. `accounts/{uid}` contains `{birthDate}`. `entitlements/{uid}` is the server's membership record. `interactions/{from}~{to}` contains immutable `{from,to,decision,createdAt}`. `matches/{sortedUidA}~{sortedUidB}` contains canonical members, names, photos, status and creation timestamp; `messages` is its subcollection. `blocks/{from}~{to}` contains directional blocks, with both directions checked at interaction time. `reports/{randomId}` is readable only by the reporter and trusted server administration.

Both Firebase-generated Google UIDs and the client canonical-ID function avoid slash/tilde delimiters. Custom imported UIDs containing those delimiters are unsupported by the client.

## Verification

- `node --experimental-strip-types --test src/lib/model.test.ts`: **7 passed**. The suite was written before `model.ts`; initial execution demonstrated the missing implementation. It covers adult boundaries/impossible dates, strict schema/transient images, swipes, canonical matching, reciprocal preferences, cancelled/expired paid access and month-end arithmetic.
- Firestore + Storage emulators: **16 tests passed** using Firebase CLI 15.23.0, Firestore emulator 1.21.0, Storage rules runtime 1.1.3 and the installed Java 25 runtime. Default Java 17 is too old for this CLI. Run:

  ```sh
  JAVA_HOME=/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home PATH=/opt/homebrew/opt/openjdk@25/libexec/openjdk.jdk/Contents/Home/bin:$PATH firebase emulators:exec --only firestore,storage --project demo-makein "node --experimental-strip-types --test --test-concurrency=1 scripts/firestore-rules.test.mjs"
  ```

  Coverage includes private data, forbidden entitlement writes, rejection of outsider relationship-existence probes, strict profile/DOB schemas, maximum-size atomic profile+account saves, actual supported discovery/like/block/match queries, unpaid/expired/cancelled gating, immutable likes, forged/nonreciprocal/reordered matches, the read-then-write transaction used by `recordInterest`, message privacy/authorship/length, bidirectional blocking, irreversible ending, report ownership and deletion freezing/cleanup. A Node resolution hook replaces only platform Firebase initialization with authenticated emulator contexts. The actual production `data.ts`, `model.ts` and Firebase SDK run unchanged for maximum-size onboarding, reciprocal/idempotent matching, incoming-like refresh filtering, sending messages, repeated blocking, reporting and complete account-data cleanup. Storage is separately checked for own uploads/list/delete, authenticated reads, cross-user rejection, image MIME and maximum size. The standard Firestore-only test command skips the optional Storage test.
- Emulator findings corrected: list authorization using an array containing both `from` and `to` could not prove incoming-query safety; explicit OR conditions work. Repeated validation expressions exceeded Firestore's 1,000-expression budget for a maximum-size profile; caching list/text lengths and dropping redundant required-key checks fixed accepted maximum-size writes. Rejected malicious rewrites can still emit the expression-budget diagnostic and remain denied.
- `npx tsc --noEmit`: passed after the concurrently implemented UI became available.
- ESLint on the five implemented TypeScript modules and `model.test.ts`: passed. The repository intentionally ignores `scripts/*.mjs` in its ESLint config; the rules script is executed by Node instead.
- HEAD requests to all ten stock portrait URLs returned **200 image/jpeg**. The demo onboarding input also passes production domain validation. Incoming likes now exclude every already handled outgoing Like/Pass after refresh; a production-service emulator regression first reproduced the stale result and then passed after the fix.

## Integration requirements and limits

1. Real Google sign-in requires the actual MakeIn Firebase project, enabled Google Auth, approved web domains and registered native OAuth clients. Native Google sign-in requires an Expo development/store build, not Expo Go. None of those external flows have been claimed as live-tested.
2. Configure `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`, `EXPO_PUBLIC_FIREBASE_APP_ID`, optional Storage bucket/messaging sender ID, plus native `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. Missing configuration leaves demo available without fake authentication.
3. Firebase Storage may require billing/bucket setup. Failed uploads do not retain temporary data URLs. live upload/device behavior still needs actual provider configuration. Both Firestore and Storage rules passed emulator checks.
4. Delete flow should reauthenticate and cancel automatic renewal through the server before calling data cleanup and deleting the Auth user. Cleanup freezes the profile first, prevents new likes/chat, deletes all match messages then matches, both directions of likes/blocks, owned reports, uploaded photos, public profile and private account. If a network/Storage failure interrupts cleanup, the profile remains frozen and the operation can retry. Trusted server billing/entitlement records cannot be client-deleted and need the provider's retention/deletion policy.
5. Discovery intentionally examines the first 100 active profiles and filters locally; it can exhaust that page while other eligible profiles exist. Replace it with cursor/geospatial server discovery when the community grows. Own relationship lists and incoming-profile fan-out are unpaginated at this initial size; message subscriptions retain the latest 200 in chronological order; cleanup batches writes at 400. Larger communities need paginated relationship queries and authenticated server cleanup jobs. This is explicitly marked with `ponytail:` comments.
6. Profile age is recomputed on save. A scheduled trusted process should refresh public ages on birthdays if continuously current discovery ages are required. DOB and age entry are self-reported; this implementation is not identity/age verification.
7. Reports are securely stored for trusted administration; a moderation inbox, notifications, quotas and operational review process remain server/product work. No fake reports, likes, matches, chat messages or payment activation were seeded into real collections.

## Review follow-up — interrupted deletion

A production-service regression reproduced a retry failure: cleanup repeated the profile freeze write after an earlier attempt had already set `status: deleting`, while the rules correctly make that state immutable. Cleanup now skips an already-completed freeze. The focused emulator run passed both normal cleanup and resuming partially completed cleanup; the regression also repeats cleanup after all account data has been removed. No rules or deployed resources changed for this fix.
