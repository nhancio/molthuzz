# MakeIn: native apps and a landing page

The user clarified the delivery: MakeIn is an Android and iOS mobile app, plus a public marketing landing page. The existing browser dating interface must stop being the public product. This clarification overrides the earlier universal web-product scope.

## Native application
- Keep the Expo React Native implementation and Firebase services, package/bundle com.nhancio.makein.
- Ship Android APK preview and prepare iOS testing via available Apple credentials or an explicitly labelled simulator build. No App Store/TestFlight availability claim without actual submission.
- Native navigation is bottom tabs and mobile sheets/flows. Remove the desktop sidebar from the application; it should never become a desktop dashboard on a large device.
- Discovery must fit its profile card and Like/Pass controls within a typical phone's usable viewport. On unusually small screens or large accessibility text, allow scrolling rather than clipping controls. Preserve labelled demos and accessible gestures/buttons.
- Membership integration stays deferred and disabled as the user requested.

## Landing website
- A separate static landing/ source and landing-dist/ artifact, not the Expo app exported to web. Hosting builds only that landing page.
- Brand: warm ivory, ink and lime, Instrument Serif + DM Sans. Original MakeIn design, with illustrative phone previews and clearly fictional imagery.
- Explain dating for adults, profile/onboarding, swipe/likes, mutual matches/chat and safety controls. Show Android and iOS availability honestly.
- No browser login, swiping, demo chat, account signup or artificial app-store links. Download links point to actual available artifacts or exact Expo build status; pending iOS links are labelled pending.
- Planned launch pricing: ₹2 first calendar month, then ₹99/month; payments not active yet. No fabricated users, reviews, store ratings or promises of a live trial.
- Responsive and accessible marketing content, FAQ and accurate privacy/terms text. No nonfunctional email collection form.

## Verification and publication
Typecheck/lint/native exports, existing domain/security tests remain green. Verify landing desktop/mobile and that deployed HTML contains no old browser application bundle or login/demo flow. Build iOS/Android as permitted by available credentials, report exact status and any required owner action. Update the existing PR and live Netlify site; preserve the original repository history and deferred payment work.
