import { useTranslation } from "react-i18next";
import { Text, TextInput } from "../components/LocalizedText";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { Card, Match, Message } from "../lib/contracts";
import { Badge, Button, Empty, Icon } from "../components/UI";
import { colors, fonts, shared } from "../theme";
export function Likes({
  cards,
  demo,
  loading,
  onOpen,
  onRefresh,
}: {
  cards: Card[];
  demo: boolean;
  loading: boolean;
  onOpen: (c: Card) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={shared.label}>{t("A LITTLE MUTUAL CURIOSITY")}</Text>
      <Text
        accessibilityRole="header"
        style={[shared.heading, { marginTop: 10 }]}
      >
        {t("You caught their eye.")}
      </Text>
      <Text style={[shared.muted, { marginTop: 12, marginBottom: 30 }]}>
        {demo
          ? t(
              "Sample incoming likes from fictional profiles. Try liking one to practice matching.",
            )
          : t(
              "People who liked your profile. Like someone back to start a conversation.",
            )}
      </Text>
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : cards.length ? (
        <View style={{ flexDirection: "row", gap: 18, flexWrap: "wrap" }}>
          {cards.map((c) => (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityLabel={t("View {{name}}, {{age}}", {
                name: c.name,
                age: c.age,
              })}
              onPress={() => onOpen(c)}
              style={n.like}
            >
              <Image
                source={{ uri: c.photos[0] }}
                style={StyleSheet.absoluteFill}
              />
              <View style={n.likeCaption}>
                <Text
                  style={{
                    fontFamily: fonts.serif,
                    color: colors.white,
                    fontSize: 29,
                  }}
                >
                  {c.name}, {c.age}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.regular,
                    fontSize: 11,
                    color: colors.white,
                  }}
                >
                  {c.location}
                </Text>
              </View>
              {demo && (
                <View style={{ position: "absolute", top: 12, left: 12 }}>
                  <Badge>{t("DEMO")}</Badge>
                </View>
              )}
              <View style={n.littleHeart}>
                <Icon name="heart" size={15} />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <Empty
          icon="heart-outline"
          title={t("Good things take time.")}
          text={t(
            "Your incoming likes will appear here. A thoughtful bio helps someone find a reason to say hello.",
          )}
          action={
            <Button secondary onPress={onRefresh}>
              {t("Refresh likes")}
            </Button>
          }
        />
      )}
    </ScrollView>
  );
}
export function Conversations({
  matches,
  uid,
  demo,
  onOpen,
}: {
  matches: Match[];
  uid: string;
  demo: boolean;
  onOpen: (m: Match) => void;
}) {
  const { t } = useTranslation();
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 35 }}>
      <Text style={shared.label}>{t("THE START OF SOMETHING")}</Text>
      <Text
        accessibilityRole="header"
        style={[shared.heading, { marginTop: 10 }]}
      >
        {t("Hello looks good on you.")}
      </Text>
      <Text style={[shared.muted, { marginVertical: 15 }]}>
        {demo
          ? t(
              "Your demo matches. Practice a first message — no one else receives it.",
            )
          : t("When the feeling is mutual, the conversation starts here.")}
      </Text>
      {matches.length ? (
        <View style={{ marginTop: 17, gap: 12 }}>
          {matches.map((match) => {
            const other = match.members.find((x) => x !== uid) || "";
            return (
              <Pressable
                key={match.id}
                accessibilityRole="button"
                accessibilityLabel={t("Open conversation with {{name}}", {
                  name: match.names[other] || t("your match"),
                })}
                onPress={() => onOpen(match)}
                style={n.match}
              >
                <Image source={{ uri: match.photos[other] }} style={n.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.semi, fontSize: 17 }}>
                    {match.names[other] || t("Your match")}
                  </Text>
                  <Text style={[shared.muted, { fontSize: 12, marginTop: 4 }]}>
                    {demo
                      ? t("Demo match · Say your first hello")
                      : t("You matched · Say your first hello")}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={18} />
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Empty
          icon="chatbubble-ellipses-outline"
          title={t("A hello is on its way.")}
          text={t(
            "Like someone in Discover. When they like you back, you’ll find your match here.",
          )}
        />
      )}
    </ScrollView>
  );
}
export function Chat({
  match,
  uid,
  messages,
  demo,
  busy,
  onSend,
  onBack,
  onSafety,
  loading,
}: {
  match: Match;
  uid: string;
  messages: Message[];
  demo: boolean;
  busy: boolean;
  onSend: (text: string) => Promise<void>;
  onBack: () => void;
  onSafety: () => void;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const other = match.members.find((x) => x !== uid) || "";
  async function send() {
    if (busy || !text.trim()) return;
    try {
      await onSend(text.trim());
      setText("");
    } catch {
      /* Parent displays service errors without dropping the draft. */
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, minHeight: 0 }}
      behavior={process.env.EXPO_OS === "ios" ? "padding" : undefined}
    >
      <View
        style={[
          shared.row,
          {
            gap: 14,
            paddingBottom: 20,
            borderBottomWidth: 1,
            borderColor: colors.line,
          },
        ]}
      >
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t("Back to matches")}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="arrow-back" />
        </Pressable>
        <Image
          source={{ uri: match.photos[other] }}
          style={[n.avatar, { width: 43, height: 43 }]}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.semi, fontSize: 17 }}>
            {match.names[other]}
          </Text>
          <Text style={[shared.muted, { fontSize: 11 }]}>
            {demo
              ? t("Demo conversation · practice only")
              : t("Your connection")}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Conversation safety options")}
          style={{
            minWidth: 44,
            minHeight: 44,
            alignItems: "center",
            justifyContent: "center",
          }}
          onPress={onSafety}
        >
          <Icon name="ellipsis-horizontal" />
        </Pressable>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: messages.length ? "flex-start" : "center",
          paddingVertical: 25,
          gap: 12,
        }}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <ActivityIndicator />
        ) : !messages.length ? (
          <Empty
            title={t("Every story starts somewhere.")}
            text={
              demo
                ? t(
                    "Write a practice hello. It stays in this session and isn’t sent to anyone.",
                  )
                : t(
                    "Skip the perfect opening line. Ask about something that caught your eye.",
                  )
            }
            icon="chatbubbles-outline"
          />
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[
                n.message,
                {
                  alignSelf: m.sender === uid ? "flex-end" : "flex-start",
                  backgroundColor:
                    m.sender === uid ? colors.lime : colors.white,
                },
              ]}
            >
              <Text style={shared.body}>{m.text}</Text>
              {demo && (
                <Text style={[shared.muted, { fontSize: 9, marginTop: 5 }]}>
                  {t("PRACTICE MESSAGE")}
                </Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
      <View style={n.composer}>
        <TextInput
          accessibilityLabel={t("Message")}
          placeholder={t("A thoughtful hello…")}
          placeholderTextColor={colors.muted}
          style={[
            shared.body,
            {
              flex: 1,
              paddingVertical: 12,
              paddingHorizontal: 17,
              maxHeight: 120,
            },
          ]}
          multiline
          maxLength={2000}
          value={text}
          onChangeText={setText}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Send message")}
          disabled={busy || !text.trim()}
          onPress={send}
          style={[n.send, { opacity: busy || !text.trim() ? 0.4 : 1 }]}
        >
          {busy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Icon name="arrow-up" size={22} />
          )}
        </Pressable>
      </View>
      <Text
        style={[
          shared.muted,
          { fontSize: 10, textAlign: "center", marginTop: 11 },
        ]}
      >
        {demo
          ? t("Demo only. No real messages are sent.")
          : t(
              "Stay curious. Be kind. Keep personal details private until you feel comfortable.",
            )}
      </Text>
    </KeyboardAvoidingView>
  );
}
const n = StyleSheet.create({
  like: {
    width: 196,
    height: 265,
    backgroundColor: colors.soft,
    borderRadius: 20,
    overflow: "hidden",
  },
  likeCaption: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: "#20241F88",
    padding: 16,
  },
  littleHeart: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 29,
    height: 29,
    borderRadius: 15,
    backgroundColor: colors.lime,
    justifyContent: "center",
    alignItems: "center",
  },
  match: {
    flexDirection: "row",
    alignItems: "center",
    gap: 17,
    padding: 19,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 30,
    backgroundColor: colors.soft,
  },
  message: {
    maxWidth: "82%",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  composer: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 5,
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 22,
    backgroundColor: colors.lime,
    justifyContent: "center",
    alignItems: "center",
  },
});
