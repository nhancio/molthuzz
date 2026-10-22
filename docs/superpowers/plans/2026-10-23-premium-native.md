# Premium native MakeIn implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Read the linked spec and installed Expo types before implementation.

**Goal:** Upgrade MakeIn to native navigation, controls and premium mobile composition.
**Architecture:** Reuse current Firebase/session state in a provider above real Expo Router tabs/stacks; modernize independent screen groups and shared UI with explicit ownership.
**Tech Stack:** Expo Router NativeTabs/Stack, @expo/ui, expo-image/symbols/haptics/linear-gradient, Reanimated4/Gesture Handler/keyboard-controller, existing i18next.
**Spec:** docs/superpowers/specs/2026-10-23-premium-native.md

## Global constraints
- Native Android/iOS product; landing page separate.
- Preserve all 9 languages, user content/canonical values, billing-disabled state and safety flows.
- No fake controls or invented member status; new copy requires every catalog.
- Physical-device rendering/performance remains unverified until real native execution.

### Task1: Native shared controls and visual system
- [x] Worker owns theme.ts, components/UI.tsx, LanguagePicker.tsx, LocalizedText.tsx and optional new shared native UI helpers.
- [x] Keep Button/Field/Chips/Badge/Notice/Empty/Sheet and Icon caller APIs compatible. Add compact prop to LanguagePicker for header placement.
- [x] Use @expo/ui native sheet/controls when supported; native SF/Material icon adapter; system typography/spacing, script-safe line heights, wrapping and accessible touch targets.
- [x] Inspect installed declarations, typecheck owned modules, commit scope.

### Task2: Welcome, onboarding and account composition
- [x] Worker owns screens/Welcome.tsx, Onboarding.tsx, Account.tsx.
- [x] Keep existing component props, data/validation contracts and translated copy. Account gets optional onLanguage? only if needed; parent header already exposes picker.
- [x] Welcome/onboarding render compact LanguagePicker. Root native Stack handles authenticated headers; avoid a second large page title on account. Use safe areas for welcome/setup only.
- [x] Native grouped forms/settings, keyboard-safe onboarding, sophisticated portrait-led welcome, honest membership.
- [x] Verify error/save/draft flows statically and typecheck; commit scope.

### Task3: Discovery, swipe, likes and conversations
- [x] Worker owns components/ProfileCard.tsx, screens/Discovery.tsx, Connections.tsx, discovery-layout.ts/tests and new gesture helpers/tests.
- [x] Preserve caller APIs; Chat accepts nativeHeader?:boolean (default false), parent passes true and supplies native header/safety controls. Remove custom back/header only in nativeHeader mode.
- [x] Gesture.Pan/ReanimatedUI-thread transforms, single transaction lock/haptic, cancellation/rejection recovery, reduced motion. Keep current swipe thresholds tested through model.swipeDirection.
- [x] Photo card gradients/expo-image; virtualized likes/conversation lists; keyboard-controller composer; preserve failed message draft.
- [x] Discovery no duplicate large heading: native navigation header supplies Discover; keep small existing section copy if helpful. Parent wrapper provides 16px horizontal content padding.
- [x] Add meaningful gesture test, typecheck and commit scope.

### Task4: Parent native routing and integration
- [x] Parent owns screens/MakeIn.tsx, src/app routes, native route helper/tests, package/deps/native config and docs/catalog updates.
- [x] Lift controller into MakeInProvider. Expose entry gate, ready/entry destination, renderTab, conversation content/title/safety and membership action. Root navigator always mounted; guards redirect safely.
- [x] NativeTabs with real OS icons, nested Stack headers and compact language/member actions; root conversation push and native Back. Respect safe-area ownership and preserve load/auth/save failures.
- [x] Write route/guard tests, run TS/lint/full tests/native exports, independent scoped review/fixes.
- [x] Submit updated native builds, push current feature branch and update existing draft PR. Report actual build status and device-QA limitation.
