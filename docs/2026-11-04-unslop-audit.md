# MakeIn: what we can unslop

4 November 2026 · Design and UX audit · Recommendations only

**MakeIn needs a focused polish pass. Keep the ivory, ink and lime identity; put more attention on people, useful profile content and clear actions.** The largest opportunities are the landing page’s crowded hero, tiny supporting text, repeated promotional copy, inconsistent component styling and incomplete loading/error distinctions.

## Scope and evidence

- Reviewed the active native app under `src/`, the standalone marketing site under `landing/`, app configuration and the landing build script. The README identifies `web/` and `backend/` as legacy implementations; they are outside this audit.
- Detected Expo **~58.0.14**, React Native **0.88.0**, React **19.3.0**, Expo Router **~58.0.23**, Reanimated **4.7.1** and `@expo/ui` **~58.0.22** from the package manifest. These are declared versions, not a device runtime inventory.
- Read the linked [Appllama design skill](https://github.com/Appllama/appllama-skills/blob/dd5caaec3d5d50ad7fc0324da238119c6b7c3707/skills/appllama-app-design-skill/SKILL.md) and its existing-screen review playbook. Used its native behavior, hierarchy, consistency and state-completeness criteria.
- No installed skill named Unslop was found. Used the UI-focused [Unslop skill](https://github.com/heydamir/unslop/blob/main/skills/unslop/SKILL.md) and [signs checklist](https://github.com/heydamir/unslop/blob/main/skills/unslop/references/signs.md) directly from their source. **Credit: Damir Sokolovsky, @heydamir; CC BY 4.0.** Read skill blob `9a1c49e2e5062082024ee5f2a65fbdc554b05cd6` and checklist blob `e9bae0369394d56ed080ef8a7e3d15bd4ec70a7f`.
- Applied the installed Expo overview, native UI, Expo UI and design-system guidance, plus Vercel and Callstack React Native guidance. Platform behavior takes precedence over Unslop’s desktop-specific sizes and styling preferences.
- Ran the existing landing build successfully and inspected the local page in the browser at desktop and **390 × 844** phone dimensions. Rechecked mobile measurements against the generated build, where release-link placeholders were correctly replaced.
- **Native findings are source-backed recommendations or risks, not simulator-verified defects.** `xcrun simctl` was unavailable. No Appllama MCP tools were connected, so no competitor screen board or comparative benchmark was collected. No frame-rate, native keyboard, screen-reader or native dark-mode claims are made.

The audit created this report and refreshed generated `landing-dist/` output. App source and landing source were not edited. Existing working-tree edits were preserved; nothing was deployed.

## Proposed direction

| Decision | Direction |
|---|---|
| Product | A dating app for adults to discover profiles, express interest and converse after a mutual match, subject to the current membership gates |
| Character | Warm, candid, curious |
| World | Everyday introductions, personal photographs and handwritten conversation notes |
| Moments | A person’s profile photo and one specific detail that gives someone a reason to start a conversation |
| Signature | Keep the existing flat MakeIn mark; use it sparingly as a brand signature |

This direction preserves the existing brand. It does not require a new font family, generated portraits, a new navigation system or a new component library.

## Start with these six changes

1. Fix mobile horizontal overflow and enlarge important small text on the landing page.
2. Simplify the hero around one faithful app preview and a direct explanation of the product.
3. Replace decorative labels and generic slogans in task screens with useful context.
4. Consolidate spacing, corners, text roles and shadows through the existing theme.
5. Separate loading, empty and failure states, especially in Chats and discovery.
6. Make profile details and conversation lists more useful before adding visual effects.

## Landing page opportunities

Priority **P1** means the first polish batch; **P2** means a subsequent refinement. Effort is relative: **S** is localized copy/style work, **M** spans components or interaction states, and **L** includes data-contract work or a wider QA matrix. These are scope estimates, not delivery promises.

| ID | Priority / effort | Evidence and opportunity | Proposed change and acceptance check |
|---|---|---|---|
| L1 | P1 / S–M | **Horizontal overflow.** On the generated page, `document.documentElement.scrollWidth` and body width were **481px** at a **390px** viewport. Rotated `.orbit` elements extend outside the viewport; their decoration is a clear candidate contributor. See [landing CSS]. | Remove unnecessary orbit layers and contain the remaining hero artwork locally. Recheck pseudo-elements and other overflow contributors. At 320, 390, 430 and 768px, document width must fit the viewport without hiding useful content. |
| L2 | P1 / S–M | **Important text is too small.** At 390px, the hero age note is **9px**, safety note **9px**, payment explanations **10px**, and availability text **9px**. See [landing CSS] and [landing page]. | Use roughly 14–16px for explanatory text and at least 12–13px for secondary metadata as the starting target. Keep payment status, renewal terms, age eligibility and fiction disclosures readable and near the relevant action. This is a readability finding, not a claimed WCAG failure based on size alone. |
| L3 | P1 / M | **The preview is shrunk beyond usefulness.** Phone interest labels and tab labels measure **6px**; the intention label measures **7px**. It depicts a different header/tab treatment from the current native app. | Use an accurate native screenshot or a faithful simplified preview. On phones, show fewer details at a legible scale rather than shrinking a whole interface. Keep fictional content clearly identified. The preview should communicate one actual app interaction. |
| L4 | P1 / S–M | **Too many competing hero accents.** The hero combines two orbit layers, a tilted phone, two stickers, a floating heart, stars and an underline. This was visible on desktop and mobile. See [landing page]. | Keep the split composition, one app preview and the existing mark. Remove the floating heart, extra stickers and orbit decoration. The face and primary action should lead the first glance. No replacement decorative effects are needed. |
| L5 | P1 / S | **The headline describes a feeling before explaining the product.** The hero and several section headings use broadly interchangeable dating slogans. See [landing page]. | State that MakeIn is an adult dating app in the headline or first supporting sentence. Keep warmth in supporting copy. Preserve section order and the factual explanations of profiles, mutual matching and chat. See the copy examples below. |
| L6 | P2 / S | **Repeated editorial decoration.** Tracked uppercase eyebrows, italic emphasis and stars recur across the hero, manifesto, steps, safety, pricing, download and footer. | Keep the chosen serif, but concentrate expressive treatment in the main brand moment. Use sentence case for supporting labels and direct section titles. Keep the actual logo intact. |
| L7 | P2 / S–M | **Phone navigation disappears.** The small-screen stylesheet hides the header navigation without a replacement menu. Lower-page content is still reachable by scrolling. | Add one small accessible menu for the existing links if quick section access is useful. Verify keyboard focus, touch targets and expanded state. This is a navigation refinement, not an inaccessible-content claim. |
| L8 | P2 / S | **Marketing motion exceeds its purpose.** The hero uses separate 750ms and 1000ms entrances; buttons translate upward on hover. Reduced-motion CSS already exists. See [landing CSS]. | Shorten the entrance to a restrained fade, around 150–250ms, or remove it. Prefer surface/color feedback on links and buttons. Retain reduced-motion support. Avoid making first-load content feel delayed. |

## Native app opportunities

| ID | Priority / effort | Evidence and opportunity | Proposed change and acceptance check |
|---|---|---|---|
| A1 | P1 / S–M | **Task screens repeat marketing language.** Profile setup already has a native title, then adds a 44px promotional heading. Filters and membership also use slogan-like titles. See [Onboarding], [app state] and [Account]. | Use the navigator title as the primary heading. Introduce sections with direct labels such as Photos, About you and Interests. Rename the filter sheet “Discovery filters.” Verify that the first useful form controls appear sooner on compact phones and large text settings. |
| A2 | P1 / M | **The welcome photo competes with sign-in.** The hero takes 56% of window height, bounded between 300 and 560px, before the sign-in panel and legal text. See [Welcome]. | Keep the photo-led identity but reduce its height where needed. Test compact screens and XL text so the main action is easy to find. Retain the illustrative-photo disclosure and age/legal information. Actual CTA visibility needs native verification. |
| A3 | P1 / S–M | **Accent and badge overuse.** The shared badge supplies a lime background; profile interests use repeated badges. Demo information appears in a tab banner, individual cards, conversation headers and individual practice messages. See [UI], [app state] and [Connections]. | Use quiet text or neutral chips for descriptive interests. Reserve lime for a primary action or selection. Keep a persistent, readable demo indicator and contextual fiction disclosures where content can stand alone; reduce repeated chrome after reviewing the full flow. |
| A4 | P1 / S–M | **Tracked capitals make ordinary information look promotional.** `type.eyebrow` is 11px uppercase with 1.4 tracking. Discovery adds a 10px swipe instruction. Profile prompt questions are explicitly uppercased. See [Theme], [Discovery] and [app state]. | Use a readable sentence-case metadata style, starting around 12–13px, and keep user-authored prompt casing. Show gesture guidance where it teaches a first interaction instead of making it permanent decoration. Update all nine locale catalogs for owned-copy changes. |
| A5 | P1 / S–M | **Corners and spacing drift outside the theme.** A literal scan of native TSX found **17 numeric `borderRadius` values**: 2, 3, 9, 12, 14, 16, 18, 19, 20, 22, 24, 26, 28, 29, 30, 32 and 999. The declared radius scale is 8, 12, 16, 24 and 9999. Field, sheet and card paddings also vary. | Assign roles in the existing theme: for example inputs 12, panels 16, large photo cards 24, round actions circular. Keep legitimate circles and small progress marks as documented exceptions. Add recurring 12/20 spacing steps if needed, then apply shared values before local edits. The inventory is evidence of drift candidates, not 17 separate defects. |
| A6 | P1 / S | **Heavy and colored shadows add weight.** The profile card uses `0 18px 40px #20251F2E`; the lime circle action uses an olive-colored shadow. See [ProfileCard] and [UI]. | Reduce the card’s elevation and remove the colored action shadow. Start with a small neutral shadow where separation is needed. Preserve photo scrims: they help text contrast and are different from decorative hue gradients. |
| A7 | P2 / S–M | **Serif display typography spreads into routine chrome.** Large tab titles, sheet titles, list names and empty states all use display treatments. See [navigation], [UI] and [Connections]. | Keep Instrument Serif for the brand and selected profile moments. Use the system text hierarchy for controls and dense transactional surfaces. Judge changes at normal and large text sizes in English and Indian scripts. Avoid changing every heading just to satisfy a stylistic rule. |
| A8 | P2 / S | **Sparkles act as a generic shortcut.** Membership appears as a sparkle icon on every tab; the default empty-state icon is also sparkles. See [navigation] and [UI]. | Use a meaningful membership symbol or a text label where needed, and specific empty-state icons. Review whether membership needs global prominence while payments are unavailable. Keep the existing flat brand mark. |
| A9 | P1 / M | **Profile detail delays personal context.** The selected-profile sheet renders every photo before location, bio, interests and prompts; all actions follow that content. Up to six photos can push conversation-worthy details far down. See [profile detail]. | Lead with the main photo and a compact introduction, then interleave remaining photos with existing profile content or provide a gallery. Keep Like and safety actions discoverable. Add photo failure feedback using the fallback pattern already used elsewhere. No new profile fields are required. |
| A10 | P1 / S–M | **Chat repeats the introduction.** Every conversation renders a decorative paired-photo header before the message list; an empty conversation adds a second large empty-state treatment. See [Connections]. | Keep one compact introduction for an empty conversation. Once messages exist, let the conversation and composer lead. Keep practice-mode disclosure visible. Retain draft preservation and selectable message text. |
| A11 | P1 / S–M, L for metadata | **Conversation rows remain static.** Rows continue to say a first-message prompt. The current `Match` contract has no last-message preview, timestamp or read state. The Chats tab badge is `matches.length`, not unread messages. See [Connections], [contracts] and [tabs]. | First, remove misleading persistent notification emphasis or explicitly communicate that it counts matches. For a later product improvement, add real last-message metadata and read-state behavior. Never fabricate timestamps or unread counts to make a mockup look complete. |

## States and platform polish

| ID | Priority / effort | Evidence and opportunity | Proposed change and acceptance check |
|---|---|---|---|
| S1 | P1 / M | **Chats has a false-empty risk.** Matches start as an empty array, the subscription populates them later, and `Conversations` has no loading prop. A first load can therefore present empty-state copy before the initial result. See [app state] and [Connections]. | Track initial subscription completion separately from a genuine zero-result state. Render the empty state only after a successful result. Verify with a delayed first response and a failed subscription. |
| S2 | P1 / M | **Loading clears useful content.** Likes and messages pass empty arrays to their lists while loading; discovery replaces its card with an indicator. Source paths also show errors and zero-content states without dedicated per-surface failure models. See [Discovery], [Connections] and [app state]. | Keep existing content during refresh. Use shape-matched placeholders for initial profile/list loading and distinct retry states for failure. Keep an opening progress screen when authentication/session resolution genuinely requires it. Test first load, refresh, failure, retry and genuine empty results separately. |
| S3 | P1 / S–M | **Errors can expose service wording.** `messageOf()` returns raw `Error.message`, and error notices are shared across surfaces. See [app state]. | Map known failures to short recovery instructions near the affected action. Keep the draft or profile state intact. Preserve diagnostic details for debugging rather than making technical strings the main recovery UI. |
| S4 | P2 / M | **Compact-control touch area needs measurement.** Shared compact hosts have a 34px minimum; iOS compact modifiers specify 32px and Android 34px. Native components may expand their hit regions. See [UI] and [native controls]. | Measure actual hit targets on both platforms before calling this a defect. Keep compact visuals while providing at least 44pt on iOS and 48dp on Android for the complete interactive region. Test long translated labels and one-line limits. |
| S5 | P2 / L | **Dark mode is intentionally absent.** App configuration declares light appearance, the palette is static, and UI hosts force light mode. See [app config], [Theme] and [UI]. | Treat adaptive appearance as an optional scope expansion. If requested, implement it coherently through the existing theme, navigator and native hosts, with explicit photo-overlay exceptions. Light-only branding is not itself evidence of a broken screen. |

## Copy examples

These are proposed directions, not final translations. Preserve the meaning of the existing disclosures and payment terms.

| Current | Proposed |
|---|---|
| Landing supporting copy: broad promises about being yourself | “MakeIn is a dating app for adults. Share your interests, discover profiles and chat when you both like each other.” Add current preview and payment availability alongside the action. |
| “First names. Fresh starts.” | Remove the repeated display heading; retain the native “Create your profile” title |
| “Your kind of connection.” on filters | “Discovery filters” |
| “A little pause.” | “No profiles match these filters” with the existing explanation and Adjust filters action |
| “Good things take time.” | “No likes yet” with the existing helpful explanation |
| “A hello is on its way.” | “No matches yet” with a clear explanation of mutual matching |
| “More possibilities. One simple plan.” | “Membership” followed by pricing and the current availability status |
| “A thoughtful hello…” in the composer | “Message” |

Keep warmth in profile prompts and conversation guidance. Utility screens benefit from titles that state their actual state.

## What to preserve

- **The existing palette and fonts.** Ivory/ink/lime and Instrument Serif already give MakeIn character. The work is to control their roles.
- **Native tabs and stack headers.** They are already implemented; there is no reason to rebuild navigation chrome.
- **Native controls and grouped settings.** `@expo/ui` and platform files already cover buttons, settings and control behavior.
- **Useful photo gradients.** The overlays improve readability; a blanket gradient ban would make these surfaces worse.
- **The UI-thread swipe implementation and reduced-motion support.** Verify its feel rather than replacing it speculatively.
- **The continuous profile form, upload retry handling and draft preservation.** Required adult/profile setup has a purpose; removing it as generic onboarding would be a mistake.
- **Fictional/demo labels, age restrictions, payment availability and safety actions.** Improve hierarchy and readability while retaining the facts.
- **Existing multilingual support.** Owned-copy changes must reach every catalog; member names, bios, prompts and messages remain as authored.
- **Honest marketing.** The site distinguishes illustrations, preview builds and unavailable payments. It does not need invented testimonials, member counts or verification claims.

## How to execute the polish

Use Unslop’s pass order while addressing the P1 findings first:

| Pass | MakeIn work |
|---|---|
| Spacing | Fix mobile overflow; standardize repeated insets, row gaps and group gaps |
| Color | Keep one neutral family; reduce repeated lime fills |
| Icons | Keep native symbol families; remove decorative sparkle/glyph uses outside the brand mark |
| Copy | Give task screens direct titles and explain the product early |
| Type | Enlarge small supporting text; reduce tracked uppercase metadata |
| Layout | Simplify the hero; bring profile details and conversations into focus |
| Details | Consolidate corners/shadows; measure hit regions; clarify badge meaning |
| Visuals | Replace the inaccurate tiny phone illustration with a faithful product view |
| Motion | Shorten decorative entrances; retain native transitions and meaningful gesture feedback |

Work through the existing theme and shared components first. This audit does not justify adding a new design library, replacing state management, moving every list to FlashList or changing persistence. Those require separate behavioral or performance evidence.

For implementation, gather real references through Appllama when connected: adult dating sign-in, required profile setup, discovery/filtering, full-profile presentation, incoming likes, conversation lists, empty chat and membership availability. Document the hierarchy and navigation pattern adopted from each reference. No claim is made that this audit has already completed that research.

## Verification before calling a redesign finished

- **Web:** verify 320/390/430/768/1280px widths; zero unintended horizontal scroll; readable notes; keyboard focus; mobile menu if added; reduced motion; final generated release labels and links.
- **Native:** run iOS and Android flows from welcome through demo, profile setup, discovery, filters, match, chat, account and membership. Check keyboard behavior, dismissal, Back, re-entry and rapid taps.
- **States:** exercise delayed first results, loaded content, genuine empty results, refresh, failed requests and successful retry. Confirm message/profile drafts survive failures.
- **Accessibility/localization:** check VoiceOver/TalkBack labels, actual hit regions, contrast, XL/larger text, long member content and all nine app languages.
- **Motion:** record and review complete native flows; profile on a release build before making smoothness/FPS claims.
- **Repository checks after changes:** run the relevant existing tests, typecheck and lint. Run the landing build and landing tests for site changes. This report did not rerun app tests because it changes no application logic.

**Recommended first batch:** L1–L5, A1, A3–A6 and S1–S3. These address measurable web problems and widely repeated native patterns while keeping the product’s identity. Profile restructuring and real conversation metadata follow once that shared foundation is settled.

[Theme]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/theme.ts:4
[UI]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/components/UI.tsx:274
[Welcome]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/screens/Welcome.tsx:29
[Onboarding]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/screens/Onboarding.tsx:399
[Discovery]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/screens/Discovery.tsx:108
[ProfileCard]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/components/ProfileCard.tsx:256
[Connections]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/screens/Connections.tsx:160
[Account]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/screens/Account.tsx:87
[app state]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/screens/MakeIn.tsx:134
[profile detail]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/screens/MakeIn.tsx:823
[navigation]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/components/app-navigation.tsx:10
[contracts]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/lib/contracts.ts:6
[tabs]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/app/(tabs)/_layout.tsx:8
[native controls]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/src/components/native-control-platform.ios.tsx:24
[app config]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/app.json:8
[landing page]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/landing/index.html:35
[landing CSS]: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn/landing/styles.css:2
