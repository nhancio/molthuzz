import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text, TextInput } from "../components/LocalizedText";
import type { Card, Match, Message } from "../lib/contracts";
import { Badge, Button, Empty, Icon } from "../components/UI";
import { colors, fonts, shared } from "../theme";

function MemberPhoto({
  uri,
  style,
}: {
  uri?: string;
  style: React.ComponentProps<typeof View>["style"];
}) {
  const [failedUri, setFailedUri] = useState<string>();
  return (
    <View
      style={[
        style,
        {
          overflow: "hidden",
          backgroundColor: colors.soft,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Icon name="person-outline" size={26} color={colors.muted} />
      {!!uri && failedUri !== uri && (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          onError={() => setFailedUri(uri)}
        />
      )}
    </View>
  );
}

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
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 340 || fontScale >= 1.5 ? 1 : 2;
  return (
    <FlatList
      key={columns}
      data={loading ? [] : cards}
      numColumns={columns}
      keyExtractor={(card) => card.id}
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
      columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      refreshing={loading}
      onRefresh={onRefresh}
      ListHeaderComponent={
        <Text style={[shared.muted, { paddingTop: 8, paddingBottom: 12 }]}>
          {demo
            ? t(
                "Sample incoming likes from fictional profiles. Try liking one to practice matching.",
              )
            : t(
                "People who liked your profile. Like someone back to start a conversation.",
              )}
        </Text>
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={colors.ink} style={{ padding: 32 }} />
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
        )
      }
      renderItem={({ item: card }) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("View {{name}}, {{age}}", {
            name: card.name,
            age: card.age,
          })}
          onPress={() => onOpen(card)}
          android_ripple={{ color: "#FFFFFF25" }}
          style={({ pressed }) => [
            n.like,
            {
              maxWidth: columns > 1 ? "48.5%" : "100%",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <MemberPhoto uri={card.photos[0]} style={StyleSheet.absoluteFill} />
          <LinearGradient
            pointerEvents="none"
            colors={["#10181000", "#101810E8"]}
            style={n.likeGradient}
          />
          <View style={n.likeCaption}>
            <Text
              style={{
                fontFamily: fonts.semi,
                color: colors.white,
                fontSize: 22,
                lineHeight: 30,
              }}
            >
              {card.name}, {card.age}
            </Text>
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 12,
                lineHeight: 19,
                color: colors.white,
              }}
            >
              {card.location}
            </Text>
          </View>
          {(demo || card.demo) && (
            <View style={{ position: "absolute", top: 12, left: 12 }}>
              <Badge>{t("DEMO")}</Badge>
            </View>
          )}
        </Pressable>
      )}
    />
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
    <FlatList
      data={matches}
      keyExtractor={(match) => match.id}
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 32 }}
      ListHeaderComponent={
        <Text style={[shared.muted, { paddingTop: 8, paddingBottom: 24 }]}>
          {demo
            ? t(
                "Your demo matches. Practice a first message — no one else receives it.",
              )
            : t("When the feeling is mutual, the conversation starts here.")}
        </Text>
      }
      ListEmptyComponent={
        <Empty
          icon="chatbubble-ellipses-outline"
          title={t("A hello is on its way.")}
          text={t(
            "Like someone in Discover. When they like you back, you’ll find your match here.",
          )}
        />
      }
      renderItem={({ item: match }) => {
        const other = match.members.find((member) => member !== uid) || "";
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Open conversation with {{name}}", {
              name: match.names[other] || t("your match"),
            })}
            onPress={() => onOpen(match)}
            android_ripple={{ color: "#20241F0C" }}
            style={({ pressed }) => [
              n.match,
              { backgroundColor: pressed ? colors.soft : colors.paper },
            ]}
          >
            <MemberPhoto uri={match.photos[other]} style={n.avatar} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontFamily: fonts.semi,
                  fontSize: 17,
                  lineHeight: 24,
                  color: colors.ink,
                }}
              >
                {match.names[other] || t("Your match")}
              </Text>
              <Text style={[shared.muted, { fontSize: 13 }]}>
                {demo
                  ? t("Demo match · Say your first hello")
                  : t("You matched · Say your first hello")}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        );
      }}
    />
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
  nativeHeader = false,
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
  nativeHeader?: boolean;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const pending = useRef(false);
  const other = match.members.find((member) => member !== uid) || "";
  const sendBusy = busy || sending;
  async function send() {
    const draft = text;
    if (busy || pending.current || !draft.trim()) return;
    pending.current = true;
    setSending(true);
    try {
      await onSend(draft.trim());
      setText((current) => (current === draft ? "" : current));
    } catch {
      // Parent displays service errors without dropping the draft.
    } finally {
      pending.current = false;
      setSending(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{
        flex: 1,
        minHeight: 0,
        paddingBottom: nativeHeader ? insets.bottom : 0,
      }}
      behavior="padding"
      automaticOffset
    >
      {!nativeHeader && (
        <View
          style={[
            shared.row,
            {
              gap: 12,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderColor: colors.line,
            },
          ]}
        >
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel={t("Back to matches")}
            style={n.headerAction}
          >
            <Icon name="arrow-back" />
          </Pressable>
          <MemberPhoto
            uri={match.photos[other]}
            style={[n.avatar, { width: 43, height: 43 }]}
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{ fontFamily: fonts.semi, fontSize: 17, lineHeight: 24 }}
            >
              {match.names[other] || t("Your match")}
            </Text>
            <Text style={[shared.muted, { fontSize: 12 }]}>
              {demo
                ? t("Demo conversation · practice only")
                : t("Your connection")}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Conversation safety options")}
            style={n.headerAction}
            onPress={onSafety}
          >
            <Icon name="ellipsis-horizontal" />
          </Pressable>
        </View>
      )}
      <FlatList
        data={loading ? [] : messages}
        keyExtractor={(message) => message.id}
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: messages.length ? "flex-start" : "center",
          paddingVertical: 20,
          gap: 10,
        }}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
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
          )
        }
        renderItem={({ item: message }) => (
          <View
            style={[
              n.message,
              {
                alignSelf: message.sender === uid ? "flex-end" : "flex-start",
                backgroundColor:
                  message.sender === uid ? colors.lime : colors.white,
              },
            ]}
          >
            <Text selectable style={shared.body}>
              {message.text}
            </Text>
            {demo && (
              <Text style={[shared.muted, { fontSize: 10, marginTop: 5 }]}>
                {t("PRACTICE MESSAGE")}
              </Text>
            )}
          </View>
        )}
      />
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
              paddingHorizontal: 14,
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
          accessibilityState={{
            disabled: sendBusy || !text.trim(),
            busy: sendBusy,
          }}
          disabled={sendBusy || !text.trim()}
          onPress={send}
          android_ripple={{ color: "#20241F18" }}
          style={({ pressed }) => [
            n.send,
            { opacity: sendBusy || !text.trim() ? 0.4 : pressed ? 0.7 : 1 },
          ]}
        >
          {sendBusy ? (
            <ActivityIndicator color={colors.ink} />
          ) : (
            <Icon name="arrow-up" size={22} />
          )}
        </Pressable>
      </View>
      <Text
        style={[
          shared.muted,
          {
            fontSize: 11,
            textAlign: "center",
            paddingTop: 10,
            paddingBottom: 8,
          },
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
    flex: 1,
    height: 270,
    backgroundColor: colors.soft,
    borderRadius: 22,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  likeGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "65%",
  },
  likeCaption: {
    position: "absolute",
    bottom: 0,
    right: 0,
    left: 0,
    padding: 14,
    gap: 3,
  },
  match: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: "hidden",
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.soft,
  },
  headerAction: {
    minWidth: 48,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    maxWidth: "86%",
    borderRadius: 20,
    borderCurve: "continuous",
    paddingHorizontal: 17,
    paddingVertical: 12,
  },
  composer: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 5,
  },
  send: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lime,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
});
