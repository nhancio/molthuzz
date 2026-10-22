# MakeIn delivery status — 23 October 2026

## Product and source
- Native Expo Android and iOS app: MakeIn, package/bundle com.nhancio.makein. Standalone marketing landing page at https://makein-nhancio.netlify.app; website has no dating UI/browser login.
- Adult onboarding, Google sign-in, profiles/photos/preferences, discovery/swipes/likes, mutual matches, chat, editing, block/report/unmatch and retryable account deletion. Labelled fictional demo is isolated from real data.
- Offline i18next interface in English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali and Gujarati: 355 strings per language, persistent global language picker, device default/English fallback, locale-aware membership dates and Indian-script typography. Member-authored content and canonical stored options remain intact.
- Profile setup/editing now uses one vertical form with a single Save action and first-invalid-field scrolling; the ten-step wizard is removed. Multiple photos can be selected at once, with ordered previews, main-photo selection, removal and partial-failure retry. Original source size/type is not rejected before native JPEG conversion/downsampling; final objects retain secure 8MiB MIME/owner rules.
- System-control pass uses Aura+ native iOS tabs/DOB as a read-only reference. MakeIn retains SDK58-native implementations on both platforms: shared action buttons and ordinary icon actions are SwiftUI/Compose; single choice is a native menu and multiple choice native switches/checkboxes. iOS tab background/material/fonts follow the OS defaults; Android uses its Material bar.
- Compact opening puts Google/demo actions before optional artwork, uses system-size typography and a drawn nonemoji mark. Native splash remains while bundled branding loads; loading UI is compact.
- Premium native UI: real Expo Router tabs and per-tab stacks; native conversation headers/back, SwiftUI/Compose buttons, menus, toggles/checkboxes, sheets and language pickers, inline iOS date wheel and Android system date dialog, grouped settings, SF/Material icons, system typography, photo/gradient discovery cards, UI-thread gestures, reduced-motion support, haptic commit feedback and keyboard-controller forms/chat. Failed saves and sends preserve drafts.
- Draft PR: https://github.com/nhancio/molthuzz/pull/1 on feat/makein-dating.

## Infrastructure
- Expo: https://expo.dev/accounts/nithindidigam/projects/makein (efbb0e70-ee9f-4747-ba4f-67d3a9472e8d).
- Firebase: makein-nhancio-20261023, owned by nithindidigam@nhancio.com. Firestore asia-south1, rules/indexes deployed; MakeIn Google provider/native OAuth clients configured.
- User approved Blaze billing and photo storage. Linked the existing One-Billing-Account, provisioned makein-nhancio-20261023.firebasestorage.app in ASIA-SOUTH1, deployed Storage rules. Production unauthenticated upload correctly returns403; native physical-device photo upload remains unverified.
- Android signing keystore remains in ignored private credentials; its SHA-1 is registered with Firebase. iOS App Store signing is configured under Nhancio, team76G23XAVL3. ASC app6825923575.
- User deferred Razorpay/UPI connection. Payment integration remains disabled; no charge or mandate created. ₹2 first calendar month then ₹99/month is the planned membership.

## Latest system-control native builds
- Android APK preview submitted: https://expo.dev/accounts/nithindidigam/projects/makein/builds/0ba810ac-81ae-492c-b452-b171048f8a12
- Signed iOS production build5 submitted: https://expo.dev/accounts/nithindidigam/projects/makein/builds/4edb746f-5520-47ef-813d-f37b46dca508
- iOS TestFlight upload scheduled after the build: https://expo.dev/accounts/nithindidigam/projects/makein/submissions/904e6c88-b13e-4f6a-b62e-f9b5cef16dab
- The earlier single-form iOS build4 finished. Its queued Android preview was cancelled for the system-control replacement. Both replacement builds and the automatic iOS submission have been accepted by EAS; build pages report current status. No store publication or public TestFlight access is claimed.
- Earlier multilingual iOS build2 also finished successfully.

## Verification
- TypeScript pass, Expo lint pass with --no-cache (removed stale missing-catalog diagnostics), 64/64 tests pass, native Android/iOS Hermes exports pass.
- Catalog tests verify complete keys, interpolation, DELETE token, price/age/date numbers, INR symbols and regional translations; tests also cover preference persistence/device negotiation/write failure and instant i18next switching/fallback/member-name interpolation. Static JSX coverage prevents untranslated owned copy and translation of known member fields.
- Earlier 16 Firestore/Storage emulator cases and targeted cleanup retry checks passed; service/rules unchanged by language feature.
- Independent current review cleared native photo decoder bounds/output size/cleanup, compact opening/splash, single-form validation, ordered partial-failure upload retry, main-photo changes, synchronous operation guards and keyboard-aware composition. New test coverage exercises normalization/error cleanup/output bounds, model-first error targets, unresolved-photo save blocking, gallery order and retry without duplicating successful uploads. Native execution remains pending. Native-control review also cleared toolkit-child ownership, multiline hosts, busy/disabled guards, canonical menu/checkbox callbacks, max8 selection with deselection, inline DOB, tab material defaults and glyph sizing. Root composition waits for fonts so Compose can resolve the Material family; root import includes only the required icon font.
- Standalone landing HTTP200 verified; old /discover route404, no Expo browser bundle. Landing build/link tests 2/2 pass after updating the premium Android link; production link verified.

## Remaining release checks
- Physical Android/iOS Google sign-in, script rendering, keyboard and photo-upload QA. No local simulator installed; EAS Simulator unavailable on the account.
- Razorpay merchant connection/testing and final store release. Real paid interactions remain locked while billing disabled; history/safety remain accessible.
- Discovery scans the first100 active profiles; server pagination needed beyond initial scope.

## Implementation decisions
- Proceeded with the premium native design under the explicit user request, without a second design approval. If the visual direction is wrong, the screens need revision.
- Used the current linked Expo skill over stale local guidance, including expo-symbols and @expo/ui native controls. Installed SDK58 types determined actual supported APIs; device integration remains a release check.
- Reused all 338 existing copy keys across all 9 languages to preserve catalog parity and member-data boundaries. New product copy requires adding translations to every catalog.

## Single-form decisions
- Six photos remain the profile limit. Any size refers to selected source file bytes/dimensions being optimized before upload. An unlimited photo count would require changing profile/rule contracts and gallery layout.
- HTTPS preview entry remains only in the fictional demo. Real members use native photo selection/upload; advanced URL entry would need restoring if requested.
- Proceeded directly under the explicit requested changes. If the revised visual direction is wrong, the screens need revision.

## Native-control decisions
- Used MakeIn installed SDK58 declarations rather than copying Aura+ SDK57 declarations. Native integration revisions may be needed if device behavior differs.
- Kept specialized swipe/card/list hit areas as React Native interactions while ordinary controls use native widgets. Broader gesture/UI work would be required if these interactions also need changing.
- Kept birth date empty until interaction or Done confirms the initial wheel value. This adds one confirmation when the proposed default date is correct.
