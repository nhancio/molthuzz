# MakeIn multilingual implementation plan

> **For agentic workers:** Use superpowers:subagent-driven-development. Read the spec before editing.

**Goal:** Switch all owned native app copy among English and eight Indian languages offline.
**Architecture:** Central i18next instance with bundled source-English keyed catalogs; reactive React hook, persisted locale and device detection at the native root. Explicit translation calls at rendering boundaries preserve stored profile values and member content.
**Tech Stack:** Expo, TypeScript, i18next, react-i18next, expo-localization, existing AsyncStorage.
**Spec:** docs/superpowers/specs/2026-10-23-multilingual.md

## Global constraints
- Android and iOS only; marketing website separate.
- Languages en, hi, te, ta, kn, ml, mr, bn, gu.
- Never translate user-authored content or change canonical stored model values.
- Offline bundled catalogs, English fallback, persisted device-local preference.

### Task 1: Extract and wire interface copy
- [x] Own src/screens/*.tsx, src/components/UI.tsx and ProfileCard.tsx, src/i18n/locales/en.json.
- [x] Use `import { useTranslation } from 'react-i18next'` and `const { t, i18n } = useTranslation()` in components; source English text is the key. Render `t('Continue')`, `t('View {{name}}’s full profile', { name: card.name })`.
- [x] Replace native Text imports with `Text` from `../components/LocalizedText` (UI/ProfileCard use `./LocalizedText`). This wrapper handles script typography, never translates content automatically.
- [x] Translate dynamic enum labels explicitly: `t(value)` for known options. Preserve original option values and handlers.
- [x] Translate every owned UI/error/legal sentence; consolidate split sentences into interpolation keys. Build en.json with each key equal to its English value. Include displayed model/auth/data/payment errors without modifying backend logic.
- [x] Verify no missing UI keys with a catalog coverage check; typecheck after integration exists.

### Task 2: Locale engine, picker and persistence
- [x] Parent owns src/i18n engine/languages/resources/tests, src/components/LanguagePicker.tsx and LocalizedText.tsx, src/app/_layout.tsx and native config/dependencies.
- [x] Write tests for supported locale negotiation, invalid stored values, device fallback, device/default preference persistence and failed writes.
- [x] Use `i18n.createInstance()` with `keySeparator:false`, `nsSeparator:false`, `fallbackLng:'en'`, `interpolation.escapeValue:false`; bundle all catalogs and use initReactI18next.
- [x] Add a root language button/sheet listing native language names, English names, current selection and device-default option. Await persistence and expose a localized error on failure.
- [x] Test actual language switching and placeholder-preserving safe interpolation with i18next.

### Task 3: Complete regional catalogs
- [x] Translate final English catalog into hi/te/ta/kn/ml/mr/bn/gu, split across independent workers with exclusive file ownership.
- [x] Preserve interpolation placeholders, money, age limits and exact DELETE token. No English-filled dummy catalogs.
- [x] Validate every catalog has exactly the English keys, nonempty strings and identical interpolation tokens.

### Task 4: Review and verify
- [x] Independent scoped review for language persistence races, untranslated owned copy, canonical profile integrity and script layout.
- [x] Run `npm run typecheck`, `npm run lint`, `npm test`, language/catalog tests and `npm run export:native`.
- [x] Document supported languages and remaining physical-device language QA. Commit only this feature's files; preserve unrelated pending native/landing changes.
