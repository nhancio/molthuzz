# MakeIn Merged Multi-Module Dating App — Design Spec

**Date:** 19 November 2026  
**Target Repo:** `MakeIn/` (`com.nhancio.makein`, Firebase `makein-nhancio-20261023`, Expo SDK 58 / React Native 0.88)  
**Scope:** Merge Makezy's Friends + 1-on-1 WebRTC Calls into MakeIn, add the Learn module (template guide cards + ChatGPT-style AI flirt coach), unify Dating & Friend conversations into a centered global Chats tab, move Likes to Home's top-right header, and make the app free-to-use for Play Store / App Store submission.

---

## 1. Information Architecture & Navigation

5 native bottom tabs (`NativeTabs`) with **Chats** centered:

1. **Home** (`/(tabs)/home`)
   - Dating discovery card stack (swipe left to pass, swipe right to like, filter sheet, full profile sheet).
   - **Top-right header:** Heart button opening `/likes` (incoming dating likes) alongside the compact language switcher.
2. **Friends** (`/(tabs)/friends`)
   - Shows **People** directly (Voice Rooms intentionally excluded for this release).
   - Quick mood strip ("How are you feeling?") that updates the user's profile mood.
   - Search bar (name, city, interest) + Language and Interest filter chips.
   - Member cards with photo, age, city, languages, shared interests, mood, and stateful action button (`Say hello` → `Request sent` / `Accept` / `Chat`).
3. **Chats** (`/(tabs)/connections`, centered)
   - Unified global inbox combining **Dating Matches** and **Friends**, with filter pills (`All` · `Dating` · `Friends`).
   - Incoming pending friend requests appear at the top with inline `Accept` / `Decline` controls.
   - Tapping any row opens `/conversation`, which supports messaging plus header **Audio Call**, **Video Call**, and **Safety** (Report / Block / End connection) actions.
4. **Learn** (`/(tabs)/learn`)
   - Two views toggled via a top segmented control (`Guides` · `AI Chat`):
     - **Guides:** Curated editorial template cards with photography, category tag, and read time. Tapping a card opens a reader sheet with imagery, practical tips, "Try this / Skip this" examples, and a "Practice with AI" shortcut.
     - **AI Chat:** ChatGPT-style conversational interface with starter prompt chips, multi-turn conversation history, and live AI responses via `/.netlify/functions/learn-chat` (Gemini `gemini-2.5-flash`) with an intelligent local fallback in demo/offline mode.
5. **Profile** (`/(tabs)/profile`)
   - Existing MakeIn account screen: profile summary, edit profile (including languages & mood), 9-language UI switcher, legal policies, sign out, and retryable account deletion.

**Stack screens outside tabs (`src/app/_layout.tsx`):**
- `/` — Entry gate (Welcome, Google Sign-In, Demo mode, Onboarding / Edit Profile).
- `/likes` — Incoming dating likes grid.
- `/conversation` — Unified 1-on-1 chat with Audio/Video call triggers and safety options.
- `/call/[id]` — Full-screen 1-on-1 WebRTC audio/video call screen with mute, camera toggle, timeout, background hangup, and block enforcement.

---

## 2. Data Model & Firestore Rules

- **`profiles/{uid}`:** Existing strict schema plus optional `languages` (1–6 allowed Indian languages/English) and `mood` (short bounded string). Backward-compatible with existing documents.
- **`friendRequests/{from}~{to}`:** Owner-created pending request (`from`, `to`, `status: 'pending' | 'accepted' | 'declined'`, `createdAt`). Recipient can accept or decline; sender can read/delete on account deletion.
- **`matches/{pairId}`:** Unified conversation container. Existing dating matches omit `kind` (default `'dating'`) or set `kind: 'dating'`. Accepting a friend request creates `matches/{pairId}` with `kind: 'friend'`. Both share `matches/{pairId}/messages/{messageId}` and safety/block/unmatch semantics.
- **`calls/{callId}` + `calls/{callId}/candidates/{cid}`:** 1-on-1 WebRTC signaling restricted to the two active, unblocked members of an active `matchId`.
- **Free launch:** Remove the `paid(request.auth.uid)` requirement from `interactions`, `matches`, and `messages` rules while keeping `entitlements` server-only so the app works end-to-end without billing enabled.

---

## 3. Calling & AI Coach Backends

- **WebRTC (`src/calls/`):** Port Makezy's lazy-loaded `react-native-webrtc` adapter, STUN/optional TURN relay loader, signaling, peer connection lifecycle, incoming call banner, and call screen into `MakeIn/src/calls/` and `MakeIn/src/screens/Call.tsx`. Add `@config-plugins/react-native-webrtc` and camera/microphone usage strings to `app.config.ts`.
- **Learn AI (`netlify/functions/learn-chat.mjs`):** Authenticated Netlify Function calling Gemini `gemini-2.5-flash` with an 18+ respectful dating/flirting coach system prompt, bounded message history (last 12 turns, max 1000 chars per prompt), and graceful 503 handling if `GEMINI_API_KEY` is unset. Client (`src/lib/learn-ai.ts`) uses the live endpoint for signed-in users and a local demo coach fallback when in Demo mode.

---

## 4. Verification Plan

- Unit tests (`npm test`): existing 75 tests + new tests for Friends recommendation/filtering, unified Chats filtering, Learn guides & AI client/fallback, WebRTC call signaling/lifecycle, and updated i18n coverage across all 9 languages.
- TypeScript (`npm run typecheck`) and Expo lint (`npm run lint`).
- Native bundle export check (`npx expo export --platform all`).
- Full 8-point launch-readiness harness (UI, SEO, Security, T&C, Payments, Widgets, Screens, Logo) recorded in `MakeIn/docs/2026-11-19-launch-harness-report.md`.
