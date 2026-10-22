# MakeIn delivery status — 23 October 2026

## Product and source
- Native Expo Android and iOS app: MakeIn, package/bundle com.nhancio.makein. Standalone marketing landing page at https://makein-nhancio.netlify.app; website has no dating UI/browser login.
- Adult onboarding, Google sign-in, profiles/photos/preferences, discovery/swipes/likes, mutual matches, chat, editing, block/report/unmatch and retryable account deletion. Labelled fictional demo is isolated from real data.
- Offline i18next interface in English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali and Gujarati: 338 strings per language, persistent global language picker, device default/English fallback, locale-aware membership dates and Indian-script typography. Member-authored content and canonical stored options remain intact.
- Draft PR: https://github.com/nhancio/molthuzz/pull/1 on feat/makein-dating.

## Infrastructure
- Expo: https://expo.dev/accounts/nithindidigam/projects/makein (efbb0e70-ee9f-4747-ba4f-67d3a9472e8d).
- Firebase: makein-nhancio-20261023, owned by nithindidigam@nhancio.com. Firestore asia-south1, rules/indexes deployed; MakeIn Google provider/native OAuth clients configured.
- User approved Blaze billing and photo storage. Linked the existing One-Billing-Account, provisioned makein-nhancio-20261023.firebasestorage.app in ASIA-SOUTH1, deployed Storage rules. Production unauthenticated upload correctly returns403; native physical-device photo upload remains unverified.
- Android signing keystore remains in ignored private credentials; its SHA-1 is registered with Firebase. iOS App Store signing is configured under Nhancio, team76G23XAVL3. ASC app6825923575.
- User deferred Razorpay/UPI connection. Payment integration remains disabled; no charge or mandate created. ₹2 first calendar month then ₹99/month is the planned membership.

## Latest multilingual native builds
- Android APK preview submitted: https://expo.dev/accounts/nithindidigam/projects/makein/builds/f88bc2e5-58b3-4f6c-9c05-af9193fcb7ac
- Signed iOS production build2 submitted: https://expo.dev/accounts/nithindidigam/projects/makein/builds/a66c38f7-3f82-4b64-994d-8eb37a7545cc
- iOS TestFlight upload scheduled after build: https://expo.dev/accounts/nithindidigam/projects/makein/submissions/ffc7126f-ccfc-491f-a10b-45f288333762
- Latest builds remain subject to EAS completion. Earlier English-only signed iOS build1 finished successfully; outdated queued Android builds cancelled and replaced. No App Store/Play Store publication claimed.

## Verification
- TypeScript pass, Expo lint pass with --no-cache (removed stale missing-catalog diagnostics), 43/43 tests pass, native Android/iOS Hermes exports pass.
- Catalog tests verify complete keys, interpolation, DELETE token, price/age/date numbers, INR symbols and regional translations; tests also cover preference persistence/device negotiation/write failure and instant i18next switching/fallback/member-name interpolation. Static JSX coverage prevents untranslated owned copy and translation of known member fields.
- Earlier16 Firestore/Storage emulator cases and targeted cleanup retry checks passed; service/rules unchanged by language feature.
- Independent multilingual review found price qualifier/chip overflow; fixed width/shrink constraints and scoped re-review clear. Chat measures screen origin for iOS keyboard avoidance below the global language bar.
- Standalone landing HTTP200 verified; old /discover route404, no Expo browser bundle. Landing build/link tests2/2 previously pass.

## Remaining release checks
- Physical Android/iOS Google sign-in, script rendering, keyboard and photo-upload QA. No local simulator installed; EAS Simulator unavailable on the account.
- Razorpay merchant connection/testing and final store release. Real paid interactions remain locked while billing disabled; history/safety remain accessible.
- Discovery scans the first100 active profiles; server pagination needed beyond initial scope.
