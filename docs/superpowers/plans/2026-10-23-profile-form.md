# MakeIn single-screen profile form and opening repair

> **For agentic workers:** Use superpowers:subagent-driven-development. Explicitly owned files below; preserve concurrent edits.

**Goal:** Replace the ten-step wizard with one long vertical form, support selecting multiple source photos regardless of source file size with native optimization, and make opening/sign-in compact and usable.
**Architecture:** Reuse ProfileInput/Firebase contracts and the existing six-photo gallery limit. Native ImageManipulator normalizes local image bytes before Storage validation; keep owner/MIME/8MiB output rules. One ScrollView renders every section, with one final save and scroll-to-first-error. Welcome keeps essential sign-in content before any optional artwork.
**Tech Stack:** Expo SDK58/React Native, native @expo/ui date picker, keyboard-controller, ImagePicker/ImageManipulator, Firebase, existing nine i18next catalogs.
**Spec:** User request and seven attached device screenshots (2026-10-23).

## Constraints
- Android/iOS app and separate landing page; no website app replacement.
- Preserve user-authored content, stored canonical values, all9 languages and disabled payment connection.
- Any source size means accept native-decodable image sources and resize/compress before upload; keep secure final-object limits. Do not claim infinite memory or unsupported-format decoding.
- Keep six-profile-photo contract. No forced crop; select multiple, preview/remove and choose main photo.
- Partial batch failures retain uploaded photos and failed local selections for retry. Save remains blocked until the selected batch is resolved, not silently dropped.
- Native device execution unavailable; report static/bundle/cloud checks accurately.

### Task1 — photo processing (worker)
Files: src/lib/data.ts, src/lib/photo-*.ts/tests only. Parent owns dependency/config/catalogs.
- [ ] Write executable red/green checks for giant portrait/landscape sizing, no upscale, byte bounds and retry/normalization behavior through dependency-injected native adapter where needed.
- [ ] Normalize using installed Expo ImageManipulator to JPEG preserving aspect ratio, max edge1600; compress/reduce iteratively if needed below Storage8MiB. Never reject original HEIC/size before conversion. Release resources and temporary files when possible.
- [ ] Preserve uploadPhoto(uid,uri) return Promise<string>; optional dimensions arg allowed. Friendly stable errors agreed with parent; never expose infrastructure jargon in normal flow. Commit owned files.

### Task2 — single-screen form (worker)
Files: src/screens/Onboarding.tsx, setup-back.ts/test.ts and optional profile-form.ts/test.ts.
- [ ] All fields visible in one ScrollView with compact headers; remove step/progress/Continue navigation; one final Save profile action and close/back.
- [ ] Validate with existing model contract on save, reveal first invalid section; native DOB picker, keyboard-aware scrolling, preserve drafts and pending-save/back guards.
- [ ] ImagePicker allowsMultipleSelection, selectionLimit remaining slots, no forced crop. Upload sequentially; preserve successes and failed picks with retry/remove; immediate ref guard against duplicate taps. Main-photo selection reorders array. No real-member HTTPS URL field; demo may retain current HTTPS previews.
- [ ] Tests cover error targets, pending/date/back priority, partial batch failure recovery. Scoped TS/lint/tests, commit owned scope.

### Task3 — opening and integration (parent)
Files: Welcome.tsx, new brand-mark.tsx, MakeIn.tsx brand usage, catalogs, package/config/docs.
- [ ] Compact welcome header and artwork, system-font headline, sign-in near top, scroll only when required. Replace emoji asterisk with drawn mark in brand usages; preserve legal/demo/language actions.
- [ ] Translate new photo/form labels and errors into all9 catalogs; verify catalog/interface coverage.
- [ ] Full typecheck/lint/tests/native exports and independent review; fix important findings. New native builds and existing PR updated; latest landing Android build link refreshed.
