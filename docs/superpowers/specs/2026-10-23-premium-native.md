# MakeIn premium native UI

Use the current Expo native UI skill explicitly requested by the owner (https://github.com/expo/skills/blob/main/plugins/expo/skills/expo-native-ui/SKILL.md), plus its Expo UI, router and animation references saved under work/expo-skills/. Upgrade the existing Android/iOS app; marketing website remains separate.

## Direction
Photo-first dating with warm ivory, dark ink, restrained lime accents, system-native body typography, compact headings, generous spacing and subtle depth. Keep all 9 languages, genuine demo labelling, current Firebase data flows, account/safety controls and disabled payments. No fake verification, activity, counts or active checkout. No untranslated new copy: reuse existing keys where possible; any new key must be added to all 9 catalogs.

## Navigation and shared UI
Replace manually drawn tabs with Expo Router NativeTabs and nested native Stacks. Four permanent tabs: Discover, Likes you, Chats, You. Push conversation onto a real stack with native Back/swipe-back; clear/fallback safely after auth or profile changes. Root provider holds the current MakeIn data/session state and overlays; file routes render that shared state. Route guards show welcome/onboarding outside authenticated tabs and preserve profile edit drafts on save failures.

Use native @expo/ui controls for sheets and grouped settings where the installed API supports them. Inspect the installed types: mixed RN children must use supported host embedding. Shared buttons/inputs/chips keep accessible semantics and at least 44pt iOS/48dp Android targets, pending/error states, wrapping Indian-script labels and keyboard-safe primary actions. SF Symbols on iOS and Material icons on Android. Use expo-image for photos and real gradients for readability. Put a compact language button in native headers and welcome/setup; remove the extra global language bar.

## Screens
Welcome: one polished phone screen with restrained portrait imagery, short brand promise and clear Google/demo entry. Onboarding: short native-form sections, readable progress, keyboard-safe actions, existing validation and photo flow. Account: personal profile summary and grouped native settings/membership rows; truthful planned billing. Discovery: large photo card, readable caption, touch photo navigation, deliberate like/pass with UI-thread Gesture Handler/Reanimated motion and single commit haptic, ReduceMotion.System. Likes/matches: virtualized photo/list layouts, accurate empty/loading/error states. Chat: native stack header, keyboard-controller composer, preserved failed-send draft and accessible safety action.

## Verification
Keep existing business/security tests. Add meaningful checks for route mapping/guards and swipe commit/recovery invariants where pure logic exists. TypeScript, uncached lint, all tests and Android/iOS exports must pass. Independently review navigation/session lifecycle and gesture transactions. Native release builds are required for Google sign-in and newly added native modules. No simulator or physical device is currently available, so do not claim rendered native screenshots, motion performance or device QA from source/export alone.
