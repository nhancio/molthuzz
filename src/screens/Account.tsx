import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import React from "react";
import { useWindowDimensions, View } from "react-native";
import { Image } from "expo-image";
import { Host, ListItem, RNHostView, Text as NativeText } from "@expo/ui";
import { AccountForm, AccountSection, AccountFooter } from "../components/account-settings";
import type { Membership, Profile } from "../lib/contracts";
import { Badge, Button, Icon, Notice } from "../components/UI";
import { colors, fonts, shared, radius } from "../theme";

export function AccountScreen({ profile, demo, active, onEdit, onMembership, onTerms, onPrivacy, onDelete, onSignOut }: {
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
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  // Compose uses sp; SwiftUI explicit point sizes need the accessibility scale.
  const scaled = (size: number) => size * (process.env.EXPO_OS === "ios" ? fontScale : 1);
  const [failedPhoto, setFailedPhoto] = React.useState<string | null>(null);
  const photo = profile.photos[0];
  const accessory = (content: React.ReactElement) => process.env.EXPO_OS === "android" ? <RNHostView matchContents>{content}</RNHostView> : content;
  const icon = (name: React.ComponentProps<typeof Icon>["name"], destructive = false) => accessory(<Icon name={name} size={20} color={destructive ? colors.red : colors.muted} />);
  const row = (label: string, name: React.ComponentProps<typeof Icon>["name"], action: () => void, destructive = false) => (
    <ListItem key={label} onPress={action} leading={icon(name, destructive)} trailing={icon("chevron-forward")} colors={{ containerColor: "transparent", contentColor: colors.ink }}>
      <NativeText textStyle={{ fontSize: scaled(17), color: destructive ? colors.red : colors.ink }}>{t(label)}</NativeText>
    </ListItem>
  );
  return (
    <Host colorScheme="light" seedColor={colors.ink} useViewportSizeMeasurement style={{ flex: 1 }}>
      <AccountForm>
        <AccountSection>
          <ListItem
            onPress={onEdit}
            leading={accessory(
              <View style={{ width: 76, height: 90, backgroundColor: colors.soft, borderRadius: radius.lg, borderCurve: "continuous", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                {photo && failedPhoto !== photo ? <Image source={photo} accessibilityLabel={profile.name} contentFit="cover" onError={() => setFailedPhoto(photo)} style={{ width: "100%", height: "100%" }} /> : <Icon name="person-outline" size={32} color={colors.muted} />}
              </View>
            )}
            supportingText={profile.location}
            trailing={icon("chevron-forward")}
            colors={{ containerColor: "transparent", contentColor: colors.ink }}
          >
            <NativeText textStyle={{ fontSize: scaled(22), fontWeight: "600", color: colors.ink }}>{`${profile.name}, ${profile.age}`}</NativeText>
          </ListItem>
          {row("Edit profile", "create-outline", onEdit)}
          {demo ? <AccountFooter><NativeText textStyle={{ fontSize: scaled(13), color: colors.muted }}>{t("DEMO PROFILE")}</NativeText></AccountFooter> : null}
        </AccountSection>
        <AccountSection>
          <ListItem onPress={onMembership} leading={icon("sparkles-outline")} trailing={icon("chevron-forward")} supportingText={t(demo ? "Explore membership pricing. Demo mode is always free." : active ? "View your membership and renewal details." : "MEMBERSHIP · SOON")} colors={{ containerColor: "transparent", contentColor: colors.ink }}>
            <NativeText textStyle={{ fontSize: scaled(17), fontWeight: "600", color: colors.ink }}>{t("Membership")}</NativeText>
          </ListItem>
        </AccountSection>
        <AccountSection>
          {row("Privacy policy", "lock-closed-outline", onPrivacy)}
          {row("Terms of use", "document-text-outline", onTerms)}
        </AccountSection>
        <AccountSection>
          {row(demo ? "Leave demo" : "Sign out", "log-out-outline", onSignOut)}
          {!demo ? row("Delete account", "trash-outline", onDelete, true) : null}
          {demo ? <AccountFooter><NativeText textStyle={{ fontSize: scaled(13), color: colors.muted }}>{t("This profile, your likes and practice conversations are local to this demo session. They are not published or sent to other people.")}</NativeText></AccountFooter> : null}
        </AccountSection>
      </AccountForm>
    </Host>
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
  const { t, i18n } = useTranslation();
  return (
    <View style={{ gap: 23 }}>
      <Badge dark>{t("MAKEIN MEMBERSHIP")}</Badge>
      <Text
        accessibilityRole="header"
        style={[shared.heading, { fontSize: 33, lineHeight: 40 }]}
      >
        {t("More possibilities. One simple plan.")}
      </Text>
      <View
        style={{
          padding: 25,
          backgroundColor: colors.lime,
          borderRadius: 22,
          borderCurve: "continuous",
        }}
      >
        <View style={[shared.row, { alignItems: "baseline", gap: 5 }]}>
          <Text
            style={{ fontFamily: fonts.serif, fontSize: 64, color: "#20251F" }}
          >
            ₹2
          </Text>
          <Text
            style={{
              fontFamily: fonts.medium,
              fontSize: 15,
              lineHeight: 23,
              flex: 1,
              flexShrink: 1,
              color: "#20251F",
            }}
          >
            {t("first calendar month")}
          </Text>
        </View>
        <Text style={[shared.body, { marginTop: 4, color: "#20251F" }]}>
          {t("Then ₹99/month · INR")}
        </Text>
      </View>
      <View style={{ gap: 15 }}>
        {[
          "Discover people who share your intentions",
          "Send likes and see mutual matches",
          "Start conversations with your matches",
        ].map((benefit) => (
          <View key={benefit} style={[shared.row, { gap: 11 }]}>
            <Icon name="checkmark-circle-outline" size={20} />
            <Text style={[shared.body, { flex: 1, fontSize: 14 }]}>
              {t(benefit)}
            </Text>
          </View>
        ))}
      </View>
      <Text style={shared.muted}>
        {t(
          "Automatically renews at ₹99 per month after your first calendar month, until cancelled. A calendar month runs from your start date to the same date next month (or that month’s last day). Cancel in your membership settings to stop future renewals. Paid access continues until the end of your current period.",
        )}
      </Text>
      {demo ? (
        <Notice
          text={t(
            "You’re exploring the free demo. No real payment is started, and no paid membership is created.",
          )}
        />
      ) : active ? (
        <>
          <Notice
            text={
              membership?.status === "cancelled"
                ? t("Renewal cancelled. Access continues until {{date}}.", {
                    date: new Date(
                      membership.currentPeriodEnd,
                    ).toLocaleDateString(i18n.resolvedLanguage),
                  })
                : membership?.renewalAt
                  ? t(
                      "Membership active. Current access ends {{date}}. Next renewal: {{renewalDate}}.",
                      {
                        date: new Date(
                          membership!.currentPeriodEnd,
                        ).toLocaleDateString(i18n.resolvedLanguage),
                        renewalDate: new Date(
                          membership.renewalAt,
                        ).toLocaleDateString(i18n.resolvedLanguage),
                      },
                    )
                  : t("Membership active. Current access ends {{date}}.", {
                      date: new Date(
                        membership!.currentPeriodEnd,
                      ).toLocaleDateString(i18n.resolvedLanguage),
                    })
            }
          />
          {membership?.status !== "cancelled" && (
            <Button secondary onPress={onCancel} busy={busy}>
              {t("Cancel automatic renewal")}
            </Button>
          )}
        </>
      ) : (
        <>
          <Button onPress={onCheckout} busy={busy} icon="arrow-forward">
            {configured
              ? t("Continue to secure checkout")
              : t("Check payment availability")}
          </Button>
          {!configured && (
            <Notice
              text={t(
                "Payments are not available in this build yet. Your profile setup is free. No charge or membership activation occurs here.",
              )}
            />
          )}
        </>
      )}
      <Text style={[shared.muted, { fontSize: 12, lineHeight: 19 }]}>
        {t(
          "Membership supports access to features. It does not guarantee likes, matches or replies.",
        )}
      </Text>
    </View>
  );
}
export function Legal({ kind }: { kind: "terms" | "privacy" }) {
  const { t } = useTranslation();
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
      <Text style={shared.muted}>
        {t("MakeIn · Effective 23 October 2026")}
      </Text>
      {sections.map(([title, text]) => (
        <View key={title} style={{ gap: 7 }}>
          <Text
            style={{
              fontFamily: fonts.semi,
              fontWeight: "600",
              fontSize: 16,
              color: colors.ink,
            }}
          >
            {t(title)}
          </Text>
          <Text style={shared.muted}>{t(text)}</Text>
        </View>
      ))}
    </View>
  );
}
