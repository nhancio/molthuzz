# MakeIn universal interface

The new Expo Router app is implemented in `src/app`, `src/screens`, `src/components` and `src/theme.ts`. All screen bodies are React Native components shared by web, iOS and Android. The root loads Instrument Serif and DM Sans without blocking the interface if font loading fails, includes native safe-area handling, and supplies MakeIn web document metadata.

## Implemented flows

- Editorial responsive welcome page with illustrative stock photography, Google sign-in, explicit adult eligibility/terms and free demo entry.
- Sequential first name, date of birth/adult check, gender, interested-in genders, city, relationship intent, interests, biography, photos and conversation prompts. Profile editing reuses the validated sequence. DOB remains separate from public profile data.
- Discovery with actual `Animated`/`PanResponder` swipe gestures, visible Like/Pass controls, full profiles, photo navigation, age/city filters and loading/empty/error states.
- Incoming likes, mutual matches, conversations, matched chat, profile editing and account controls through the contract-backed Firebase services.
- Clearly labelled, isolated fictional demo profiles, incoming likes, mutual matches and local practice messages. No demo action invokes billing, sends real messages or publishes a profile.
- Membership pricing and disclosure: ₹2 first calendar month then ₹99/month INR with automatic renewal. Real interaction writes require a currently active server entitlement; payment unavailability is shown honestly. Cancellation preserves the paid period.
- Report, block, end-match, sign-out, account deletion and basic terms/privacy screens. Active renewal must be cancelled before deletion. When billing is configured, deletion always confirms cancellation or absence of billing with the provider, including pending mandates before an entitlement exists. A known subscription ID also requires cancellation confirmation when billing is currently disabled. Errors stop profile/auth removal.
- Image library upload through `data.uploadPhoto`, plus a truthful persistent HTTPS image URL fallback. Demo mode does not request personal library uploads.

## Verification

Fresh `npx tsc --noEmit` passed and scoped `npx eslint src/app src/components src/screens src/theme.ts` passed during implementation. Source was formatted with Prettier. The parent agent verified desktop welcome, demo like/match, practice chat, dialog dismissal and MakeIn document title in the browser. The parent continues mobile/onboarding checks and owns production export, live Firebase/provider configuration and native packaging verification; this report does not claim live Google sign-in, payment success, store availability or real device testing.

Browser integration identified a retained native-web modal overlay after opening a matched conversation. The shared Sheet now unmounts closed dialogs to release overlays and focus immediately. Gesture animation locks also disable sibling Like/Pass actions until the gesture mutation completes.

## Product limits

Demo state intentionally lasts only for the current page session and is reset on leaving/reloading. Practice chat does not fabricate responses from a real person. Membership activation is observed from the server; opening or closing checkout does not activate it. Live sign-in, storage, discovery and payments depend on the configured providers and permission rules owned by the other tasks.

## Billing deletion regression verification

The account deletion sequence is implemented in `src/screens/accountDeletion.ts` and exercised by `node --experimental-strip-types --test src/screens/accountDeletion.test.ts`. Five checks cover missing/inactive entitlements with configured billing, known subscription IDs in all statuses with disabled billing, cancellation failure preserving data/auth, disabled fresh-app deletion, and reauthentication failure. The previous status-gated condition failed three checks; unconditional provider confirmation whenever billing is configured or a subscription ID exists passes all five.

## Authentication retry correction

Profile loading retries now increment a dedicated reload counter instead of copying the Firebase user into a plain object. The original authenticated instance is written only by `watchAuth`, preserving prototype methods such as `getIdToken` for subsequent payment/cancellation/deletion calls. Retry also enters the loading state immediately to avoid briefly exposing onboarding before the reload effect starts. A source-mirroring assertion was intentionally not added for this small React state change; scoped lint and typecheck verify the integration.

Existing conversations now open independently of membership so history and report/block/end-match remain accessible after expiry; the send-message entitlement gate is unchanged. Onboarding removes an optional prompt when both fields are blank, supplies the displayed default question for an answer-only draft, and validates the normalized profile before saving.
