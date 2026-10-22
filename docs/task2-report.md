# MakeIn universal interface

The new Expo Router app is implemented in `src/app`, `src/screens`, `src/components` and `src/theme.ts`. All screen bodies are React Native components shared by web, iOS and Android. The root loads Instrument Serif and DM Sans without blocking the interface if font loading fails, includes native safe-area handling, and supplies MakeIn web document metadata.

## Implemented flows

- Editorial responsive welcome page with illustrative stock photography, Google sign-in, explicit adult eligibility/terms and free demo entry.
- Sequential first name, date of birth/adult check, gender, interested-in genders, city, relationship intent, interests, biography, photos and conversation prompts. Profile editing reuses the validated sequence. DOB remains separate from public profile data.
- Discovery with actual `Animated`/`PanResponder` swipe gestures, visible Like/Pass controls, full profiles, photo navigation, age/city filters and loading/empty/error states.
- Incoming likes, mutual matches, conversations, matched chat, profile editing and account controls through the contract-backed Firebase services.
- Clearly labelled, isolated fictional demo profiles, incoming likes, mutual matches and local practice messages. No demo action invokes billing, sends real messages or publishes a profile.
- Membership pricing and disclosure: ₹2 first calendar month then ₹99/month INR with automatic renewal. Real interaction writes require a currently active server entitlement; payment unavailability is shown honestly. Cancellation preserves the paid period.
- Report, block, end-match, sign-out, account deletion and basic terms/privacy screens. Active renewal must be cancelled before deletion. Existing active/cancelled subscription IDs are also passed through confirmed provider cancellation before profile/auth removal; errors stop deletion.
- Image library upload through `data.uploadPhoto`, plus a truthful persistent HTTPS image URL fallback. Demo mode does not request personal library uploads.

## Verification

Fresh `npx tsc --noEmit` passed and scoped `npx eslint src/app src/components src/screens src/theme.ts` passed during implementation. Source was formatted with Prettier. The parent agent verified desktop welcome, demo like/match, practice chat, dialog dismissal and MakeIn document title in the browser. The parent continues mobile/onboarding checks and owns production export, live Firebase/provider configuration and native packaging verification; this report does not claim live Google sign-in, payment success, store availability or real device testing.

Browser integration identified a retained native-web modal overlay after opening a matched conversation. The shared Sheet now unmounts closed dialogs to release overlays and focus immediately. Gesture animation locks also disable sibling Like/Pass actions until the gesture mutation completes.

## Product limits

Demo state intentionally lasts only for the current page session and is reset on leaving/reloading. Practice chat does not fabricate responses from a real person. Membership activation is observed from the server; opening or closing checkout does not activate it. Live sign-in, storage, discovery and payments depend on the configured providers and permission rules owned by the other tasks.
