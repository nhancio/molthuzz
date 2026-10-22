# MakeIn system-native controls

> **For agentic workers:** Use superpowers:subagent-driven-development. Preserve shared concurrent edits.

**Goal:** Use actual iOS/Android system controls for actions, choices, DOB and bottom navigation, using the local Aura+ app as a read-only reference.
**Architecture:** Keep existing shared Button/Chips interfaces while replacing their rendering with @expo/ui SwiftUI/Compose. Existing native sheets/Picker and NativeTabs remain. Parent makes DOB an inline iOS wheel and Android dialog, restores system iOS tab materials, and adopts native icon actions.
**Tech Stack:** Installed @expo/ui58, Expo Router NativeTabs, existing localized catalogs/profile contracts.
**Spec:** User request 2026-10-23; Aura++ native tabs and components/inputs.tsx reference.

## Constraints
- Keep the single scrolling profile form and multi-photo queue/normalization.
- Preserve pending/disabled/retry behavior, translated labels and member content.
- No changes to Aura+; SDK56 source is a reference, use installed MakeIn SDK58 declarations for supported APIs.
- No new dependency needed. Keep all9 languages. No pretend system controls implemented with Pressable.
- Report native device testing limitation.

### Task1 shared native controls — worker
Own components/UI.tsx, new native-control helper files and native-icons.tsx if needed.
- [x] Replace shared primary/secondary Button with genuine SwiftUI/Compose Button, preserve callbacks, disabled/busy/icons/compact behavior and intrinsic height for multiline/accessibility text.
- [x] Expose IconButton({icon,label,onPress,disabled?,busy?,size?}) for native icon actions, same platform semantics; no ordinary RN children directly in native trees.
- [x] Replace single-choice Chips with native Picker/menu and multiple-choice Chips with native checkbox/toggle rows, translated labels but canonical values unchanged. Optional disabled prop supported.
- [x] Inspect installed implementation/types; scoped lint/types and existing tests; meaningful contract check if nontrivial decision logic added. Commit only owned scope.

### Task2 native DOB/navigation/actions — parent
Own screens/Onboarding.tsx, app/(tabs)/_layout.tsx, components/LanguagePicker.tsx/app-navigation.tsx, affected action callers and docs.
- [x] iOS DOB inline native wheel like Aura+, Android native date dialog; no free text date field. Preserve explicit empty DOB validation and adult bounds.
- [x] Let iOS tab bar use native transparent/glass material and minimize behavior; Android native Material tabs with icons/labels retained.
- [x] Use native IconButton for ordinary close/header/send/filter/like/pass actions; keep profile/card gesture/list hit areas as RN interactions where appropriate.
- [ ] Typecheck/lint/tests/native exports; independent review; updated native builds and PR/landing links.
