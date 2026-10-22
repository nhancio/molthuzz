# MakeIn

A dating app for adults, rebuilt from the recovered MoltHuzz repository as a native Expo app for Android and iOS, with a separate standalone marketing landing page. The original `web/` and `backend/` implementations are retained as legacy source and are excluded from the new app build.

## Preview

- Marketing landing page: https://makein-nhancio.netlify.app
- Expo: https://expo.dev/accounts/nithindidigam/projects/makein
- Android preview build: https://expo.dev/accounts/nithindidigam/projects/makein/builds/6cefc712-9089-489c-a076-76b07a9a5b8f
- iOS production build: https://expo.dev/accounts/nithindidigam/projects/makein/builds/3562bd5f-ac01-49a8-8004-d2366af4c40c
- Firebase: https://console.firebase.google.com/project/makein-nhancio-20261023/overview

The Android build link reports its current cloud build status and exposes the APK when complete. A web export or Expo project does not imply App Store or Play Store publication.

## Native experience

Expo Router provides real OS tabs, per-tab navigation stacks and a native chat header/back action. The compact opening screen places sign-in before decorative artwork and uses a drawn logo mark rather than an emoji. The premium ivory, ink and lime design uses system typography, SF Symbols on iOS and Material icons on Android, native SwiftUI/Compose sheets and language pickers, a platform date picker, grouped account settings and keyboard-aware forms/chat. Photo cards use expo-image, gradients and UI-thread swipe gestures with reduced-motion support and one haptic per accepted decision. Failed saves and messages preserve drafts.

This implementation follows the [Expo native UI skill](https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-native-ui/SKILL.md). Native-device rendering, keyboard and navigation behavior still require device QA.

## Features

Google sign-in, adult onboarding, private birth dates, public dating profiles and photos, relationship intentions/interests, discovery preferences and filters, swipe/Like/Pass, incoming likes, mutual matches, conversation history/chat, profile editing, reporting/blocking/unmatching and retryable account deletion. Demo profiles are fictional and demo likes/matches/practice messages stay in the current session.

The membership design is ₹2 for the first calendar month, then ₹99/month. **Razorpay/UPI AutoPay connection was explicitly deferred by the owner.** No live checkout, mandate or charge is enabled. Demo mode is free; paid real interactions remain locked until a verified entitlement exists. History and safety controls remain accessible when a membership expires. See `docs/payments-setup.md` for the prepared, disabled integration and merchant verification requirements.

## Run

```sh
npm ci
npm start
npm run web
npm run android
npm run ios
```

Copy `.env.example` to `.env.local` and configure this app's Firebase client fields. Native Google login requires a development or preview build, MakeIn-only Google client IDs, native SDK configuration files and the matching Android signing SHA-1. It does not run inside Expo Go. The local environment and EAS preview environment already contain the MakeIn public client configuration.

App identity: **MakeIn**, Expo slug **makein**, bundle/package **com.nhancio.makein**. Expo project ID: `efbb0e70-ee9f-4747-ba4f-67d3a9472e8d`. Firebase project: `makein-nhancio-20261023`, owned by the requested Nhancio account, Firestore in `asia-south1`. Google Auth is enabled with the MakeIn public name and the Netlify/Firebase hosts are authorized.

The Android release keystore and local credentials are ignored files in `.makein-credentials/` and `credentials.json`. Preserve a secure backup of both for future app updates; do not commit them. EAS uses these credentials for the preview APK. `.easignore` includes the public native Firebase config files while excluding keys, credentials, local environment files and legacy apps.

## Photos and infrastructure

Profile setup and editing use one continuous vertical form with inline validation and one Save action. Native photo selection accepts multiple images at once (up to six profile photos); original source size is not rejected. Expo ImageManipulator downsamples native-decodable images, including iPhone HEIC, to a proportional JPEG with a maximum edge of 1600px and compresses before enforcing the final 8MiB Storage limit. Upload failures keep successful photos and retain failed selections for retry/removal. The first photo is the main photo and can be changed in the form. Real members use upload controls; HTTPS preview entry is limited to the fictional demo.

Firestore rules and indexes have been deployed. Photo uploads use Firebase Storage with owner/size/MIME restrictions. The owner approved Blaze billing and the live bucket `makein-nhancio-20261023.firebasestorage.app` is provisioned in `asia-south1` with deployed Storage rules. Users can also use their existing Google photo or another persistent HTTPS photo URL. No temporary data URL is published as a profile photo. Discovery scans at most 100 active profiles; pagination/server discovery is needed beyond this initial scope. Dates of birth and billing records are not public profile fields.

## Checks

```sh
npm run typecheck
npm run lint
npm test
JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home npm run test:rules
npm run export:native
```

The full security suite also covers Storage when started with `firebase emulators:exec --only firestore,storage --project demo-makein` and the same `scripts/firestore-rules.test.mjs` command. This laptop has Java 25 at the path above; the default Java 17 cannot run the current Firestore emulator.

`npm test` covers profile/birth-date rules, deliberate swipes, preference filtering, membership periods, payment signatures/ownership/replay/retry/cancellation, and deletion sequencing. Emulator tests execute production onboarding, likes/matching, incoming likes, blocks/reports and interrupted cleanup. Typecheck, lint and Android/iOS exports are the native checks. The current suite has 50 cases, including native session/route gates, onboarding Back priorities and gesture commit/retry behavior. Earlier browser checks exercised the predecessor demo; they do not validate this native redesign. Physical-device login, rendering and app-store release remain separate checks.

## App languages

The native app offers English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali and Gujarati. The language button is available before sign-in, through onboarding and on every tab. Switching updates mounted screens immediately, and AsyncStorage remembers the choice across restarts and sign-out. “Use device language” follows the phone’s supported language preferences, with English fallback.

i18next/react-i18next load all translations from `src/i18n/locales/` without network requests. Only owned interface copy and canonical option labels are translated; member names, bios, cities, custom prompts and messages stay as authored. Selected-locale membership dates, native system fonts for Indian scripts, wrapping labels and localized errors are included. The exact account-deletion token remains `DELETE`.

To add a language, create a complete catalog with the same English keys and interpolation placeholders, register it in `src/i18n/language.ts` and `resources.ts`, and update supportedLocales in `app.config.ts`. `npm test` checks catalog coverage, placeholders, locale preference behavior and interface coverage. Native language changes require updated Android/iOS binaries because expo-localization adds native configuration. Physical-device script and keyboard QA is still required.
