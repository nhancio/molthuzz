import React from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import type { Membership, Profile } from "../lib/contracts";
import { Badge, Button, Icon, Notice } from "../components/UI";
import { colors, fonts, shared } from "../theme";
export function AccountScreen({
  profile,
  demo,
  active,
  onEdit,
  onMembership,
  onTerms,
  onPrivacy,
  onDelete,
  onSignOut,
}: {
  profile: Profile;
  demo: boolean;
  active: boolean;
  onEdit: () => void;
  onMembership: () => void;
  onTerms: () => void;
  onPrivacy: () => void;
  onDelete: () => void;
  onSignOut: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 35, gap: 24 }}>
      <View>
        <Text style={shared.label}>YOUR LITTLE CORNER</Text>
        <Text
          accessibilityRole="header"
          style={[shared.heading, { marginTop: 10 }]}
        >
          A good place to be you.
        </Text>
      </View>
      <View style={[shared.panel, shared.row, { gap: 22, flexWrap: "wrap" }]}>
        <Image
          source={{ uri: profile.photos[0] }}
          style={{
            width: 90,
            height: 110,
            borderRadius: 17,
            backgroundColor: colors.soft,
          }}
        />
        <View style={{ flex: 1, minWidth: 150, gap: 8 }}>
          <Text
            accessibilityRole="header"
            style={[shared.heading, { fontSize: 33, lineHeight: 36 }]}
          >
            {profile.name}, {profile.age}
          </Text>
          <Text style={shared.muted}>{profile.location}</Text>
          <Badge>{demo ? "DEMO PROFILE" : "YOUR PROFILE"}</Badge>
        </View>
        <Button secondary compact onPress={onEdit} icon="create-outline">
          Edit profile
        </Button>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onMembership}
        style={[
          shared.panel,
          { backgroundColor: colors.lime, borderColor: colors.lime, gap: 13 },
        ]}
      >
        <View style={[shared.row, { justifyContent: "space-between" }]}>
          <Icon name="sparkles-outline" size={27} />
          <Icon name="arrow-forward" />
        </View>
        <Text
          accessibilityRole="header"
          style={[shared.heading, { fontSize: 35, lineHeight: 38 }]}
        >
          {active
            ? "Make room for connection."
            : "A small step. More possibility."}
        </Text>
        <Text style={shared.body}>
          {demo
            ? "Explore membership pricing. Demo mode is always free."
            : active
              ? "View your membership and renewal details."
              : "₹2 for your first calendar month. Then ₹99/month."}
        </Text>
      </Pressable>
      <View style={[shared.panel, { paddingVertical: 6 }]}>
        {[
          {
            name: "Privacy policy",
            icon: "lock-closed-outline" as const,
            fn: onPrivacy,
          },
          {
            name: "Terms of use",
            icon: "document-text-outline" as const,
            fn: onTerms,
          },
          {
            name: demo ? "Leave demo" : "Sign out",
            icon: "log-out-outline" as const,
            fn: onSignOut,
          },
          ...(!demo
            ? [
                {
                  name: "Delete account",
                  icon: "trash-outline" as const,
                  fn: onDelete,
                },
              ]
            : []),
        ].map((item, i) => (
          <Pressable
            key={item.name}
            accessibilityRole="button"
            onPress={item.fn}
            style={[
              shared.row,
              {
                gap: 15,
                paddingVertical: 21,
                borderTopWidth: i ? 1 : 0,
                borderColor: colors.line,
              },
            ]}
          >
            <Icon name={item.icon} size={20} />
            <Text style={[shared.body, { flex: 1 }]}>{item.name}</Text>
            <Icon name="chevron-forward" size={15} />
          </Pressable>
        ))}
      </View>
      {demo && (
        <Notice text="This profile, your likes and practice conversations are local to this demo session. They are not published or sent to other people." />
      )}
    </ScrollView>
  );
}
export function MembershipScreen({
  membership,
  active,
  demo,
  configured,
  busy,
  onCheckout,
  onCancel,
}: {
  membership: Membership | null;
  active: boolean;
  demo: boolean;
  configured: boolean;
  busy: boolean;
  onCheckout: () => void;
  onCancel: () => void;
}) {
  return (
    <View style={{ gap: 23 }}>
      <Badge dark>MAKEIN MEMBERSHIP</Badge>
      <Text
        accessibilityRole="header"
        style={[shared.heading, { fontSize: 47, lineHeight: 49 }]}
      >
        More possibilities.{"\n"}One simple plan.
      </Text>
      <View
        style={{ padding: 25, backgroundColor: colors.lime, borderRadius: 20 }}
      >
        <View style={[shared.row, { alignItems: "baseline", gap: 5 }]}>
          <Text
            style={{ fontFamily: fonts.serif, fontSize: 72, color: colors.ink }}
          >
            ₹2
          </Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14 }}>
            first calendar month
          </Text>
        </View>
        <Text style={[shared.body, { marginTop: 4 }]}>
          Then ₹99/month · INR
        </Text>
      </View>
      <View style={{ gap: 15 }}>
        {[
          "Discover people who share your intentions",
          "Send likes and see mutual matches",
          "Start conversations with your matches",
        ].map((t) => (
          <View key={t} style={[shared.row, { gap: 11 }]}>
            <Icon name="checkmark-circle-outline" size={20} />
            <Text style={[shared.body, { flex: 1, fontSize: 14 }]}>{t}</Text>
          </View>
        ))}
      </View>
      <Text style={shared.muted}>
        Automatically renews at ₹99 per month after your first calendar month,
        until cancelled. A calendar month runs from your start date to the same
        date next month (or that month’s last day). Cancel in your membership
        settings to stop future renewals. Paid access continues until the end of
        your current period.
      </Text>
      {demo ? (
        <Notice text="You’re exploring the free demo. No real payment is started, and no paid membership is created." />
      ) : active ? (
        <>
          <Notice
            text={`${membership?.status === "cancelled" ? "Renewal cancelled. Access continues until" : "Membership active. Current access ends"} ${new Date(membership!.currentPeriodEnd).toLocaleDateString()}.${membership?.renewalAt && membership.status !== "cancelled" ? ` Next renewal: ${new Date(membership.renewalAt).toLocaleDateString()}.` : ""}`}
          />
          {membership?.status !== "cancelled" && (
            <Button secondary onPress={onCancel} busy={busy}>
              Cancel automatic renewal
            </Button>
          )}
        </>
      ) : (
        <>
          <Button onPress={onCheckout} busy={busy} icon="arrow-forward">
            {configured
              ? "Continue to secure checkout"
              : "Check payment availability"}
          </Button>
          {!configured && (
            <Notice text="Payments are not available in this build yet. Your profile setup is free. No charge or membership activation occurs here." />
          )}
        </>
      )}
      <Text style={[shared.muted, { fontSize: 11 }]}>
        Membership supports access to features. It does not guarantee likes,
        matches or replies.
      </Text>
    </View>
  );
}
export function Legal({ kind }: { kind: "terms" | "privacy" }) {
  const sections =
    kind === "terms"
      ? [
          [
            "Who can use MakeIn",
            "MakeIn is a dating service for individuals aged 18 and over. Provide accurate information and use photos you have permission to share.",
          ],
          [
            "Treat people with care",
            "Respect consent. Harassment, threats, impersonation, fraud, sexual exploitation and illegal content are prohibited. You can report or block a profile from its profile or conversation options.",
          ],
          [
            "Membership",
            "Profile setup and the demo are free. Real likes and chat require an active, server-verified membership. The first calendar month costs ₹2, followed by ₹99 per month in INR. Membership automatically renews until you cancel. Cancelling stops future renewals; current paid access remains until its period ends. Checkout must display its final terms before you authorize payment.",
          ],
          [
            "Your account and safety",
            "You can edit your profile, sign out, block/report people and request account deletion in the app. Do not send money or sensitive information to someone you meet. Use your judgment before meeting in person. We do not guarantee matches, replies, or another member’s identity or conduct.",
          ],
          [
            "Availability",
            "Some features depend on configured sign-in, storage and payment services. Demo profiles are fictional and practice messages are not delivered to real members.",
          ],
        ]
      : [
          [
            "What you share",
            "Your dating profile includes your first name, age, gender, preferences, city, photos, bio, interests and prompts. These details are shown to other members for discovery. Your date of birth is stored separately from your public profile. Avoid posting your precise address or sensitive information.",
          ],
          [
            "Sign-in and activity",
            "Google provides your account identity to sign you in. MakeIn uses Firebase authentication, database and, when configured, photo storage. Likes, matches, messages, blocks and reports support the matching and safety features. Chat is accessible through matched accounts and service access controls; do not assume end-to-end encryption.",
          ],
          [
            "Payments",
            "A configured payment provider processes checkout. MakeIn uses server-verified payment status to grant membership. Do not enter card or banking information in your bio or conversations.",
          ],
          [
            "Your choices",
            "Edit your profile from the Profile tab. Block or report a profile from its options. Delete your account from Profile to remove its application data and sign-in account through the deletion workflow. Subscription cancellation is separate: cancel automatic renewal before deleting an account with an active subscription.",
          ],
          [
            "Demo mode",
            "Demo profiles and interactions are fictional and kept separately from real member data. Leaving or reloading the demo clears this session’s practice interactions.",
          ],
        ];
  return (
    <View style={{ gap: 23 }}>
      <Text style={shared.muted}>MakeIn · Effective 23 October 2026</Text>
      {sections.map(([title, text]) => (
        <View key={title} style={{ gap: 7 }}>
          <Text
            style={{ fontFamily: fonts.semi, fontSize: 16, color: colors.ink }}
          >
            {title}
          </Text>
          <Text style={shared.muted}>{text}</Text>
        </View>
      ))}
    </View>
  );
}
