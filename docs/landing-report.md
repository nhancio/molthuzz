# MakeIn landing page

## Implementation plan and outcome

The approved mobile app + marketing site spec is `docs/superpowers/specs/2026-10-23-native-app-and-landing.md`. The landing page is a separate static site, built with native HTML/CSS and Node's standard library. No added dependencies, client JavaScript, browser dating interface or collection form.

- [x] Read actual app features and limits; use the frontend-design skill for an original editorial ivory/ink/lime page.
- [x] Create responsive hero with an illustrative native phone, three-step explanation, safety controls, planned pricing, FAQ and honest preview links.
- [x] Add accessible native disclosure FAQ, keyboard focus styles, reduced-motion support, skip links, privacy/terms and 404 pages.
- [x] Bundle existing Instrument Serif and DM Sans fonts with licenses and the existing app icon/favicon.
- [x] Write build tests, observe failure before builder existed, implement and verify source links and release URL substitution.

## Build contract

Run `node scripts/build-landing.mjs` to create `landing-dist/` from controlled files in `landing/`. The builder reads sources before replacing only the fixed repo-local `landing-dist` directory. It does not copy tests or legacy application bundles.

`MAKEIN_ANDROID_URL` optionally replaces the Android preview link. The default is the actual Expo build status URL from the README. `MAKEIN_IOS_URL` optionally publishes an available iOS preview access link and updates the matching status text. Both must be public HTTPS URLs, and HTML attributes are escaped. Without an iOS URL, the CTA points to the availability section and says “iOS preview in preparation”. Supplying a URL asserts availability; set it only for an actual artifact.

## Content and limitations

The hero profile and all feature screens are illustrations. The hero portrait is delivered by Unsplash and labelled fictional; fonts and other assets are local. No fabricated reviews, member counts, ratings, live payment claims or store availability claims appear. ₹2 first calendar month / ₹99 monthly pricing is labelled planned, with payments disabled and real paid interactions still locked.

Privacy and terms describe the actual preview, providers, private/public fields, deletion retry, fictional demo and unavailable payments. They explicitly acknowledge that an external support/privacy contact and fixed provider-retention schedule are not yet published. The owner should complete those operational details before a public store launch.

## Verification

Run `node --test landing/build.test.mjs`. The checks cover standalone output, resolvable local links/anchors, unique IDs, unavailable iOS copy, valid URL overrides, escaping, invalid-scheme rejection and absence of an Expo bundle or form. Source inspection covers mobile layout at 620/850/1150px breakpoints and reduced motion. Parent task owns actual desktop/mobile browser review and deployment; this worker has not claimed a visual browser test.

Fresh verification: both build tests pass (2/2), `node --check scripts/build-landing.mjs` passes, and `git diff --check` reports no whitespace errors in owned files. The final test restores the default actual Android build-status link and pending iOS state in the generated output. Unknown routes use the dedicated 404 page with absolute asset/home URLs so nested paths work.
