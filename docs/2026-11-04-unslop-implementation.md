# MakeIn unslop implementation

4 November 2026 · Branch `codex/unslop-makein`

Implemented the approved audit's visual polish and state corrections across the native app and landing page. Preserved the ivory/ink/lime brand, adult eligibility, fictional-profile disclosures, native controls, languages, profile data, safety actions and inactive payment gates. No new runtime dependency, backend schema change or deployment.

## Audit coverage

| Audit items | Implementation |
|---|---|
| L1–L4 | Removed orbit/sticker/heart hero decoration, replaced the tiny tilted phone with a simplified native-style Discover preview, enlarged preview metadata to 12px and important notes to 14px, rebuilt responsive CSS |
| L5–L6 | Direct adult-dating explanation and section copy; sentence-case labels and restrained editorial emphasis |
| L7–L8 | Native HTML disclosure menu for small screens; keyboard focus treatment; removed decorative entrances and translating hover effects; retained reduced-motion handling |
| A1–A2 | Removed redundant setup headline, direct filter/membership/legal titles, shorter welcome photo that adapts to large text |
| A3–A4 | Neutral badges and empty-state surfaces, readable metadata, first-interaction swipe guidance, preserved member-authored prompt casing, localized new copy in all nine catalogs |
| A5–A6 | Existing theme gains recurring spacing steps and one neutral card shadow; shared fields, badges, panels, photo cards and chat surfaces use role-based corners; removed colored action shadows |
| A7–A8 | System typography for transactional navigation and empty/sheet titles; removed global membership sparkle shortcut; membership remains in account settings |
| A9 | Main profile photo followed by location, bio and actions; existing interests/prompts then remaining gallery; gallery reuses existing failed-photo fallback |
| A10 | Removed recurring paired-photo introduction and per-message practice badges; retained clear session/practice disclosure and draft preservation |
| A11 | Removed notification badge that counted total matches and replaced permanent first-message row prompts with neutral context. Real last-message/unread metadata remains a separate feature |
| S1–S2 | Independent discovery, incoming-like, match and message resource states; first-load placeholders, stale-content retention, distinct failure/empty states, resource-specific retries and cleanup guards |
| S3 | Friendly service-error mapping and contextual load/send recovery copy; original collection failures retained in local console diagnostics |
| S4 | Minimum compact native button frames raised to 44pt on iOS / 48dp on Android; actual rendered hit regions still need device measurement |
| S5 | Preserved the intentional light theme. Adaptive dark mode was explicitly optional in the audit and is not part of this implementation |

This is a focused adoption of the existing design system, not a mechanical replacement of every dimension. Circular avatars/actions and tiny progress marks retain appropriate geometry.

## Verification

- `npm test`: **75 passed**, including five new reducer/error cases. The new tests were observed failing before the implementations were completed.
- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings after dependency fixes.
- `node --test landing/build.test.mjs`: **2 passed**; generated release labels/URLs and local links verified.
- `npm run export:native`: successful iOS and Android bundles.
- `git diff --check`: passed.
- Browser widths **320, 390, 430, 768 and 1280px**: document width matches viewport width in every case. The audit's 481px-wide document at a 390px viewport is now 390px.
- Mobile menu: keyboard Enter toggles disclosure, visible focus outline exists, and Safety link reaches its existing section. Collapse verified.
- Source review and a scoped final re-review found no actionable P1/P2 regressions.

Browser measurements and screenshots are saved under `work/unslop/` (`responsive-checks.json`, `desktop.jpg`, `mobile.jpg`).

## Remaining verification and follow-up

`xcrun simctl` is unavailable on this machine. Native exports demonstrate bundling, not native rendering or device behavior. Verify iOS/Android keyboard, dismissal/Back, screen readers, actual hit regions, large text, all scripts and motion on devices before release. The new tests cover resource transitions; delayed Firebase snapshots, account-switch timing and subscription cleanup still need provider/device integration coverage.

Real conversation previews/timestamps/read state and adaptive dark mode remain separate optional work. No fabricated metadata was added. No Appllama MCP reference board was available; the implementation uses the approved audit direction and skill guidance.

Unslop methodology credit: [Damir Sokolovsky (@heydamir)](https://github.com/heydamir/unslop), CC BY 4.0. Appllama guidance: [Appllama skills](https://github.com/Appllama/appllama-skills).

Existing uncommitted deployment/build-script changes and landing SEO assets remain in the working tree. They were not reverted or bundled into a commit.
