# MakeIn Indian language support

The native Android and iOS app will offer English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali and Gujarati. Use i18next/react-i18next with bundled offline resources, expo-localization for device language, and the existing AsyncStorage for a per-device preference. English is the fallback. A language picker remains reachable before sign-in, during onboarding and throughout the app. Selecting a language updates mounted screens immediately and survives restart/sign-out. A device-default option follows supported device languages.

Translate owned UI copy, onboarding choices, validation/error messages, filters, accessibility labels, membership, safety and legal screens. Keep canonical stored gender/intent/interest values unchanged; translate their display only. Never translate member names, bios, cities, custom prompts or messages. Preserve DELETE as the exact deletion confirmation token, explaining it in the selected language. Format membership dates using the selected locale. Native permission dialogs remain OS controlled.

Use native system fonts and generous line height for Indian scripts. Buttons, tabs and dialogs must allow translated labels to wrap. No translation API, network request or member-data transmission is needed. The separate marketing landing page remains outside this feature's scope.

Verify complete catalogs and interpolation placeholders; test locale normalization, device fallback, persisted choice, immediate switching and error fallback. Run TypeScript, lint, existing tests and native exports. Physical-device script/keyboard rendering still needs native-device review.
