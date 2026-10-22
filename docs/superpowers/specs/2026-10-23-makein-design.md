# MakeIn dating app

The user authorized converting MoltHuzz into MakeIn and publishing today. Preserve the recovered Git history and legacy web/backend folders; the new root application is Expo SDK 58 for web, Android and iOS. No changes to Engage or its resources.

## Product
MakeIn is for individual adults, 18+. Warm ivory, deep ink and electric lime, expressive serif headlines and clear sans-serif body text; original MakeIn brand. Familiar dating flow: Google sign in, first name/birth date, gender and who to meet, city, relationship intent, interests, bio and photos, then discovery. Swipe right/Like and left/Pass, full profiles, incoming likes, mutual matches, private chat, edit profile, block/report, and account deletion. No age/gender messaging restriction. Demo profiles and chats are visibly labelled and isolated; never imply samples are real people or real likes.

## Membership
₹2 for the first calendar month, then ₹99/month in INR, with clear automatic renewal disclosure and cancellation control. Real swipes/chat require a server-verified active membership. Profile setup and demo are free. Pending, cancelled or failed checkout cannot activate membership. Razorpay integration is prepared pending provider selection and merchant credentials. Never fabricate successful payment. Server-side signature verification, authenticated checkout, idempotent webhook processing, and server-only entitlements are required. Cancellation preserves already paid access until its end, and stops later renewals.

## Data and security
Firebase is a fresh MakeIn project under the exact Google account supplied by the user; do not guess an ambiguous owner address. Google Firebase Auth; public dating profile documents contain age, never birthDate or email. Private account documents hold DOB and owner-only data. Separate server-managed entitlements. Users cannot write memberships, another person's profiles, messages on an unmatched conversation, forged matches, or recipient likes. Firebase rules enforce active profiles, 18+ ages, schema/length limits, reciprocal likes and two-member chat membership. Blocked pairs cannot send new likes/chat. Deletion removes profile, likes, matches and messages with authenticated cleanup. Profile photos use Firebase Storage when available; clearly explain unavailable uploads rather than retaining temporary data URLs.

## Delivery
Publish the static Expo web export, create an Expo project named MakeIn, register com.nhancio.makein native apps and configure Google auth for available platforms. Test domain model and security rules with emulator, typecheck, lint, export all platforms, and browser mobile/desktop flows. Live Google login and payment require actual account/provider authorization and must be reported independently of a demo build. Do not claim store availability from an Expo project or web deployment.
