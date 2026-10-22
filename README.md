# MakeIn

A dating app for adults, rebuilt from the recovered MoltHuzz repository as a universal Expo app for Android, iOS and web. The original `web/` and `backend/` implementations are retained as legacy source and are excluded from the new app build.

## Preview

- Web: https://makein-nhancio.netlify.app
- Expo: https://expo.dev/accounts/nithindidigam/projects/makein
- Android preview build: https://expo.dev/accounts/nithindidigam/projects/makein/builds/04f712cc-1fe3-4974-a50a-b1e9d8ea997d
- Firebase: https://console.firebase.google.com/project/makein-nhancio-20261023/overview

The Android build link reports its current cloud build status and exposes the APK when complete. A web export or Expo project does not imply App Store or Play Store publication.

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

Firestore rules and indexes have been deployed. Photo uploads use Firebase Storage with owner/size/MIME restrictions. The new Firebase project is on Spark, and a live Storage bucket has not been provisioned; uploading needs Storage billing/setup. Users can use their existing Google photo or another persistent HTTPS photo URL in the meantime. No temporary data URL is published as a profile photo. Discovery scans at most 100 active profiles; pagination/server discovery is needed beyond this initial scope. Dates of birth and billing records are not public profile fields.

## Checks

```sh
npm run typecheck
npm run lint
npm test
JAVA_HOME=/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home npm run test:rules
npm run export:all
```

The full security suite also covers Storage when started with `firebase emulators:exec --only firestore,storage --project demo-makein` and the same `scripts/firestore-rules.test.mjs` command. This laptop has Java 25 at the path above; the default Java 17 cannot run the current Firestore emulator.

`npm test` covers profile/birth-date rules, deliberate swipes, preference filtering, membership periods, payment signatures/ownership/replay/retry/cancellation, and deletion sequencing. Emulator tests execute production onboarding, likes/matching, incoming likes, blocks/reports and interrupted cleanup. Typecheck, lint and web/Android/iOS exports pass. Browser checks cover desktop/mobile layout, demo matching and practice chat. Physical-device login and app-store release remain separate checks.
