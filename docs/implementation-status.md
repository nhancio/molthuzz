# MakeIn delivery status — 23 October 2026

## App and source
- Native Expo 58 / React Native 0.88 app for Android and iOS; package com.nhancio.makein. Source: /Users/nithi/Desktop/Claude-Projects/Nhancio-Projects/MakeIn.
- Existing branch feat/makein-dating and draft PR https://github.com/nhancio/molthuzz/pull/1. Verified app revision be1a02e.
- Separate landing page https://makein-nhancio.netlify.app; no dating browser UI.
- Adult onboarding, Google sign-in, private DOB, public profiles/photos/preferences, discovery/swipes/likes, mutual matches/chat, editing, report/block/unmatch and retryable account deletion. Fictional demo interactions remain local and separate from members.
- Nine offline interface languages: English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali and Gujarati; 357 keys each. Persistent/device language choice, fallback, Indian-script typography and locale-aware dates. Member-authored content remains unchanged.

## Latest photo fix and native design
- Firebase multipart Uint8Array parts were incompatible with React Native Blob, failing before networking. Native uploads now read the prepared local JPEG through XHR responseType=blob, then use unchanged Firebase uploadBytes/getDownloadURL with existing authentication. Native resources close on success and failure; safe auth and permission errors remain distinguishable.
- No arbitrary source-file byte-size rejection: native bounded decode/resizing/JPEG encoding precedes final 8MiB MIME/size/owner rules. Up to six photos can be selected together, previewed, made main, removed and retried after partial failure.
- One continuous keyboard-aware profile form; native navigation Back/Done and bottom Save, first-invalid-field scrolling, grouped fields, three-column photo gallery, compact iOS date picker and Android system date dialog. Unresolved uploads block save without dropping selections.
- Bounded portraits, system typography, native Google action, demo text action and small wrapping legal links replace the large opening spacer and duplicated filled buttons.
- Account uses SwiftUI Form sections on iOS and single Material ListItems grouped in Compose themed surfaces on Android. Avatar fallback, edit/membership/legal/sign-out/deletion actions retained; oversized marketing panel removed.
- Native tabs/buttons/menus/switches/checkboxes, safe areas, OS typography, reduced motion, haptics and keyboard-aware forms/chat retained. Failed saves/sends preserve drafts.

## Native verification
- 70 automated tests, TypeScript, uncached Expo lint and Android/iOS Hermes exports pass. Includes real Firebase multipart regression under React Native Blob restrictions and native XHR/error/resource checks.
- Actual Android 16/API 36 emulator selected three PNGs together. The production native adapter processed each to 83,684-byte JPEG, uploaded/downloaded matching byte counts through Firebase Auth/Storage emulators, denied foreign-UID writes and removed QA objects. Production Storage rules were copied unchanged. No production member data used; temporary QA route removed from release source.
- Native welcome/account/form inspected at normal and 160% text size. Hindi selection switched immediately and rendered correctly.
- Independent final review found no remaining critical/important source issue. Earlier Firestore/Storage rules checks passed; backend contracts/rules were not changed by this revision.
- Physical iOS interaction, physical Google sign-in and production Storage upload success remain unverified. Local iOS Simulator unavailable; EAS Simulator unavailable on this account.

## Infrastructure and billing
- Expo https://expo.dev/accounts/nithindidigam/projects/makein; project efbb0e70-ee9f-4747-ba4f-67d3a9472e8d.
- Firebase makein-nhancio-20261023, owner nithindidigam@nhancio.com; Firestore asia-south1. Auth/provider/native OAuth and deployed rules/indexes configured.
- User-approved Blaze linked to existing One-Billing-Account; bucket makein-nhancio-20261023.firebasestorage.app in ASIA-SOUTH1, owner/MIME/size rules deployed. Unauthenticated production write returns403.
- Existing ignored Android signing keystore; SHA-1 registered with Firebase. iOS signing Nhancio team76G23XAVL3, ASC6825923575.
- Razorpay/UPI connection deferred by user; payments disabled. Planned ₹2 first calendar month then ₹99/month. No charge, mandate or membership activation was created.

## Updated builds
- Android AAB build4: https://expo.dev/accounts/nithindidigam/projects/makein/builds/0e9d0303-1764-4384-948b-c2a1731ac9d5
- iOS build8: https://expo.dev/accounts/nithindidigam/projects/makein/builds/52ad8514-01b1-46aa-aa88-036ded607869
- TestFlight submission: https://expo.dev/accounts/nithindidigam/projects/makein/submissions/e5121992-8996-4fe7-a805-dcb89d0eacbd
- Status at request: Android build4, iOS build8 and TestFlight upload finished. Apple processing and tester availability are separate. Build pages report current status. Old APK/build5 predate the photo fix. Cancelled Android3/iOS7 are not deliverables.
- No public Play/App Store release or public TestFlight access claimed.

## Remaining limits
- Physical-device checks above and Razorpay merchant connection/testing before paid launch.
- Discovery scans the first 100 active profiles; pagination needed beyond the initial scope.
- Six photos remain the existing profile/rule limit. HTTPS photo entry exists only in the fictional demo; members use native upload.

## Final Android artifact check
- Signed universal APK generated from the finished build4 AAB using Google bundletool1.18.3 and the existing keystore. V2/V3 signature verification passed; package com.nhancio.makein/version1.0.0/code4.
- APK installed successfully and cold-launched; standalone welcome/demo/discovery/account screens opened without Metro. Activity launch measurement909ms on emulator (not a physical-device startup benchmark).
- APK/AAB/checksums and native screenshots are in /Users/nithi/Documents/Codex/2026-10-22/acr/outputs.
