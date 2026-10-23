# Photo upload and native polish implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development.

**Goal:** Fix native profile-photo uploads and replace the welcome/profile layout with a compact premium mobile experience.
**Architecture:** Preserve Expo Router NativeTabs, existing Firebase identity/data contracts and native image processing. Fix the shared upload boundary once. Extend the existing theme/control components; use native control styling and grouped rows, rather than new UI dependencies.
**Tech Stack:** Expo 58, React Native 0.88, @expo/ui 58, Firebase JS 13.
**Spec:** User screenshots and request in current conversation; previous requirements remain binding.

## Global constraints
- Preserve Google sign-in, nine-language support, adult eligibility and single continuous profile form.
- No source photo size rejection; optimize to JPEG before the existing 8 MiB storage boundary; support six photos and partial-failure retry.
- Never weaken Storage authorization rules, change backend project, enable payments or publish public store releases.
- Native platform controls, safe areas, keyboard handling and readable Dynamic Type remain required.
- All shell commands use rtk; workers are not alone and must preserve other edits.

### Task 1: Diagnose and fix native photo upload
**Ownership:** src/lib/photo-processing.ts, src/lib/photo-native.ts, src/lib/data.ts, associated upload tests only. Do not edit Onboarding or translations; report required callers/messages to parent.
- Trace actual Firebase JS 13 and RN 0.88 upload code; reproduce failure at the native byte/network boundary before choosing a fix.
- Verify configured bucket/project and preserve auth and storage rules. Do not print tokens or personal member data.
- Add a failing runnable regression for the diagnosed boundary, implement a minimal cross-platform-compatible upload transport using installed dependencies, preserve native JPEG processing/cleanup and safe errors with underlying error codes for diagnostics.
- Test success, upload failure, expired auth/authorization failure and resource cleanup as applicable; distinguish local unit proof from live native testing.
- Run focused tests and typecheck. Commit only your owned files. Write a concise report with evidence, tests and remaining runtime needs.

### Task 2: Native screen/control polish
**Ownership:** Parent: theme, shared UI/native button files, Welcome, Account, Onboarding and translations.
- Diagnose universal iOS button variant mapping and fix shared primary/secondary/text/destructive semantics. Use native regular-size controls and 44/48 point touch targets without forcing every action into a filled capsule.
- Welcome: brand/language header, bounded photo-led top visual, concise system title/body, Google primary button, demo text action and small legal links; remove giant empty spacer and duplicated large legal buttons.
- Account: photo/avatar with fallback, compact identity and edit action, native grouped settings and membership row, remove oversized marketing panels. Preserve all account actions.
- Profile form: native navigation-style Cancel/title/save actions, grouped section rhythm, compact date row that opens native date selection, six compact photo tiles with placeholders, per-item upload/retry states and no repeated error paragraphs.
- Reuse canonical translation keys; add translated keys across nine catalogs only if needed. Preserve data contracts and field validation/focus.
- Run tests/typecheck/lint and Hermes iOS/Android exports.

### Task 3: Review, runtime verification and delivery
- Independent task review and final review; address concrete findings.
- Attempt native runtime with available tools, explicitly record absence of devices/simulator if blocked; no browser screenshot used as native proof.
- After checks pass, create fresh Android preview and iOS production builds for tester delivery, record exact build IDs/status and distinguish queued/running from finished.
- Update implementation status and provide actual files/build links plus exact remaining verification limits.

## Implementation and review record
- Root upload fix uses native XHR Blob and existing Firebase SDK; ExpoFetch local-file transport was rejected after actual Android runtime testing. Resources close on success/failure.
- Android16 native QA selected three photos together, uploaded/downloaded matching JPEG byte counts with unchanged Storage owner/MIME/size rules, denied foreign-UID writes and removed QA objects. Local emulators were used; physical iOS/production success remains unverified.
-70tests, TypeScript, lint and native Hermes exports pass; independent final review cleared source/spec/accessibility. Normal and160% text layouts and Hindi switching checked natively on Android.
- Decision: reused the existing feature branch/PR to preserve ongoing release work. Cost if wrong: changes would need moving to a separate branch.
- Decision: parent owned UI while scoped worker owned upload transport. Cost if wrong: shared integration regressions; independently reviewed final combination and executed native upload checks.
- Final code commit be1a02e; Android build4 and iOS build8 requested from that exact revision. No public store release.
