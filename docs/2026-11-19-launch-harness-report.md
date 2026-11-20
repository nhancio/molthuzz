# MakeIn — Merged App & 8-Point Launch-Readiness Harness Report

**Date:** 19 November 2026  
**App:** MakeIn (`com.nhancio.makein`, Firebase `makein-nhancio-20261023`, Expo SDK 58 / React Native 0.88)

---

## 8-Point Launch-Readiness Scorecard

| # | Check | Status | Findings & Fixes |
|---|---|---|---|
| 1 | **UI** | **PASS** | Merged 5-tab bottom bar (`Home`, `Friends`, `Chats` [center], `Learn`, `Profile`) with Likes heart button on `Home` top-right header. Consistent warm editorial theme (`#F8F7F2` paper, `#20251F` ink, `#D5F36A` lime, `Instrument Serif`), safe areas, keyboard avoidance, native SwiftUI/Compose controls, and 100% 9-language i18n coverage (`en`, `hi`, `te`, `ta`, `kn`, `ml`, `mr`, `bn`, `gu`). |
| 2 | **SEO** | **PASS** | `landing/index.html` has canonical, Open Graph (1200×630 `og-image.png`), Twitter Card, JSON-LD (`WebSite`, `MobileApplication`, `FAQPage`), `robots.txt`, `sitemap.xml`, `llms.txt`. Added canonical URLs to `landing/privacy.html` and `landing/terms.html`. `npm run build:landing` passes. |
| 3 | **Security** | **WARN** | Updated `firestore.rules` & `firestore.indexes.json` for `friendRequests`, unified `matches` (`kind: 'dating' | 'friend'`), and 1-on-1 `calls` + `candidates` (strictly scoped to active unblocked members). Removed inactive `paid()` gate for free launch. `deleteAccountData` now cleans up `friendRequests` and `calls` too. `netlify/functions/learn-chat.mjs` verifies Firebase ID tokens server-side and bounds prompts. **External / iOS blocker:** iOS offers Google Sign-In without **Sign in with Apple** (Apple Guideline 4.8 requires Sign in with Apple when third-party login is offered). Also deploy updated `firestore.rules` + `firestore.indexes.json` to `makein-nhancio-20261023` and set `GEMINI_API_KEY` + `FIREBASE_WEB_API_KEY` on Netlify for live AI Coach. |
| 4 | **Terms & Conditions** | **PASS** | Updated `landing/privacy.html` and `landing/terms.html` (dated 19 Nov 2026) with real contact email (`hello@nhancio.com`), Friends, unrecorded 1-on-1 audio/video calls, Learn AI Coach (Gemini) disclosure, free-app terms, and in-app Profile → Delete account flow. |
| 5 | **Payments** | **PASS** | Hidden the unused `Membership` row in `AccountScreen` whenever `paymentConfigured === false` so the free launch shows zero external ₹2/₹99 web checkout links (Apple Guideline 3.1.1 & Google Play Billing compliant). |
| 6 | **Widgets** | **N/A** | No OS home-screen widgets (WidgetKit / AppWidget) configured or required for v1.0. |
| 7 | **Screens** | **PASS** | All routes verified: `/` (Welcome/Onboarding), `/(tabs)/home` (Dating Discovery + top-right Likes), `/(tabs)/friends` (Friends People + mood/search/language filters + requests + calls), `/(tabs)/connections` (Unified global Chats with `All`/`Dating`/`Friends` filters + inline friend requests), `/(tabs)/learn` (6 illustrated template guide cards + reader sheet + ChatGPT-style AI Coach), `/(tabs)/profile` (Account), `/likes`, `/conversation` (with Audio/Video call + safety header actions), `/call/[id]` (1-on-1 WebRTC call UI), plus global `IncomingCallBanner`. |
| 8 | **Logo & Assets** | **PASS** | `assets/icon.png` is `1024×1024` 8-bit RGB PNG (no alpha — Apple App Store compliant); `assets/favicon.png` is `64×64` RGB PNG; adaptive icon uses `#D9F66F` background. |

---

## Verification Outputs

- `npm test`: **78/78 PASS** (including all 9 locale catalogs, UI translation coverage, Friends ranking, Learn guides & AI fallback, navigation, photo processing, account deletion, payments logic)
- `npm run typecheck` (`tsc --noEmit`): **PASS** (0 errors)
- `npm run lint` (`expo lint`): **PASS** (0 errors, 0 warnings)
- `npx expo export --platform ios --platform android`: **PASS** (Android Hermes 7.3 MB + iOS Hermes 7.2 MB)
- `npm run build:landing`: **PASS**
- `node --check netlify/functions/learn-chat.mjs`: **PASS**

---

## Remaining External / Store Actions Before Submission Today

1. **Deploy Firestore rules & indexes** to `makein-nhancio-20261023` (`firebase deploy --only firestore:rules,firestore:indexes --project makein-nhancio-20261023`).
2. **Deploy Netlify site + set env vars** (`GEMINI_API_KEY`, `FIREBASE_WEB_API_KEY`) on `makein-nhancio` so live AI Coach and updated legal pages go live at `https://makein-nhancio.netlify.app`.
3. **iOS Guideline 4.8 (Sign in with Apple):** Add Sign in with Apple (`expo-apple-authentication` + Apple provider in Firebase Auth) before App Store review, or confirm if Android Play Store is shipping first while Apple Sign-In is added.
4. **Fresh EAS Production Builds:** Because `@config-plugins/react-native-webrtc` and camera/mic permissions were added, run `eas build --platform all --profile production` and submit to Play Console & App Store Connect (updating store listings & Data Safety to reflect Friends, Calling, and AI Coach).
