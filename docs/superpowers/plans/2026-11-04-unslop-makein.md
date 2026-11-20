# MakeIn unslop implementation plan

**Goal:** Implement the approved audit's visual polish and state corrections while preserving brand, native controls, existing features and payment gates.

**Spec:** `docs/2026-11-04-unslop-audit.md`, approved by the user's “implement it”.

**Architecture:** Extend the existing theme/components. Keep Firebase data contracts unchanged. Separate resource loading/errors inside the existing provider; reuse native UI and localization infrastructure.

**Constraints:** Expo 58 / React Native 0.88; no new runtime dependencies; all nine locales; retain age, fiction, safety and billing disclosures; preserve existing working-tree edits. No publish/deploy. Adaptive dark mode and last-message/read-state metadata are explicitly optional follow-on projects in the audit.

**Ruling:** Work on `codex/unslop-makein` in the current checkout so existing uncommitted landing changes remain the baseline. Avoid copying or committing the user's unrelated work. The approved audit supplies the design; no additional approval gate is needed.

## Task 1: Landing page

- [x] Simplify hero to direct copy and a readable, faithful simplified profile preview; preserve sections and release tokens.
- [x] Remove orbit/sticker/heart decoration and excessive entrance/hover motion.
- [x] Improve text sizes and responsive spacing at 320/390/430/768/1280px.
- [x] Add mobile access to existing nav links with native HTML disclosure semantics.
- [x] Run landing build/tests and inspect browser overflow, links, focus and menu.

Ownership: delegated worker owns `landing/index.html`, `landing/styles.css`, landing-specific checks only. Native implementation does not touch those files.

## Task 2: Native theme and content

- [x] Apply role-based spacing/radii/shadows to existing shared components and screens.
- [x] Quiet badges, metadata and transactional titles; remove redundant headings and sparkle controls.
- [x] Keep welcome actions prominent; preserve disclosures.
- [x] Put bio and actions after the main profile photo; retain remaining gallery and fallbacks.
- [x] Simplify chat header and static match rows; remove total-match notification badge.
- [x] Update all locale catalogs for changed owned copy; preserve member-authored casing.

## Task 3: Resource states

- [x] Add a small tested resource-state helper covering initial loading, stale content, refresh and failure.
- [x] Track discovery, likes, matches and messages independently; prevent false empty states.
- [x] Preserve stale data and drafts; offer localized actionable errors and resource-specific retries.
- [x] Write failing behavioral tests first, implement, then rerun relevant checks.

Ownership: parent owns native app, helpers, tests and locales. Task 2 consumes Task 3's resource props; integrate before final typecheck.

## Task 4: Verification and review

- [x] Run app tests, typecheck, lint, landing tests/build and native export when dependencies are available.
- [x] Review the combined diff for gate, localization, stale-state and accessibility regressions.
- [x] Verify web at the audit widths and save implementation coverage/limitations.
- [x] Report concrete dependency/device blockers without claiming unrun native verification.

## Completion

Implemented and reviewed on `codex/unslop-makein`. Existing user edits to deployment/build files and landing SEO were preserved. No changes were committed or deployed.

Validation: 75 app tests, 2 landing tests, typecheck, lint, landing build, iOS and Android export. Browser checks at 320/390/430/768/1280px have zero overflow; mobile keyboard/menu and anchor navigation verified. Native simulator/device verification remains outstanding because `simctl` is unavailable. See `docs/2026-11-04-unslop-implementation.md` for coverage and limitations.
