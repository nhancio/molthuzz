import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import type { Card, FriendRequest, Match, Message } from "../lib/contracts";
import { Badge, Button, CircleButton, CollectionFeedback, Empty, Icon, IconButton } from "../components/UI";
import { colors, fonts, shared, type, spacing, radius } from "../theme";

export function MemberPhoto({
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
  error,
  onOpen,
  onRefresh,
}: {
  cards: Card[];
  demo: boolean;
  loading: boolean;
  error: string;
  onOpen: (c: Card) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 340 || fontScale >= 1.5 ? 1 : 2;
  return (
    <FlatList
      key={columns}
      data={cards}
      numColumns={columns}
      keyExtractor={(card) => card.id}
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
      columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined}
      refreshing={loading && cards.length > 0}
      onRefresh={onRefresh}
      ListHeaderComponent={<>
        <Text style={[shared.muted, { paddingTop: spacing.sm, paddingBottom: spacing.row }]}>
          {demo ? t("Sample incoming likes from fictional profiles. Try liking one to practice matching.") : t("People who liked your profile. Like someone back to start a conversation.")}
        </Text>
        <CollectionFeedback kind="likes" columns={columns} loading={loading && cards.length === 0} error={error} hasContent={cards.length > 0} onRetry={onRefresh} />
      </>}
      ListEmptyComponent={!loading && !error ? <Empty icon="heart-outline" title={t("No likes yet")} text={t("Your incoming likes will appear here. A thoughtful bio helps someone find a reason to say hello.")} /> : undefined}
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
            <Text numberOfLines={2} style={[type.serifTitle, { color: colors.white }]}>
              {card.name}, {card.age}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.regular,
                fontSize: 13,
                lineHeight: 18,
                color: "#FFFFFFD9",
              }}
            >
              {card.location}
            </Text>
          </View>
          {(demo || card.demo) && (
            <View style={{ position: "absolute", top: 12, left: 12 }}>
              <Badge dark>{t("DEMO")}</Badge>
            </View>
          )}
        </Pressable>
      )}
    />
  );
}

export function Conversations({
  matches,
  requests = [],
  lookupPerson,
  loading,
  error,
  busy = false,
  onRetry,
  onRespondRequest,
  uid,
  demo,
  onOpen,
}: {
  matches: Match[];
  requests?: FriendRequest[];
  lookupPerson?: (id: string) => { name: string; photo?: string } | null;
  loading: boolean;
  error: string;
  busy?: boolean;
  onRetry: () => void;
  onRespondRequest?: (request: FriendRequest, accept: boolean) => Promise<void>;
  uid: string;
  demo: boolean;
  onOpen: (m: Match) => void;
}) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<"all" | "dating" | "friend">("all");
  const incomingRequests = requests.filter(
    (r) => r.to === uid && r.status === "pending",
  );
  const visibleMatches = matches.filter((m) => {
    const kind = m.kind || "dating";
    return filter === "all" || kind === filter;
  });
  return (
    <FlatList
      data={visibleMatches}
      keyExtractor={(match) => match.id}
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshing={loading && matches.length > 0}
      onRefresh={onRetry}
      ListHeaderComponent={
        <View style={{ gap: spacing.row, paddingTop: spacing.xs, paddingBottom: spacing.sm }}>
          {demo ? (
            <Text style={shared.muted}>
              {t("Your demo matches. Practice a first message — no one else receives it.")}
            </Text>
          ) : null}

          <View style={[shared.row, { gap: 8 }]}>
            {(
              [
                ["all", "All"],
                ["dating", "Dating"],
                ["friend", "Friends"],
              ] as const
            ).map(([value, label]) => {
              const active = filter === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setFilter(value)}
                  style={[n.filterPill, active && n.filterPillActive]}
                >
                  <Text
                    style={[
                      n.filterText,
                      active && { color: colors.white, fontWeight: "600" },
                    ]}
                  >
                    {t(label)}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {incomingRequests.length > 0 && onRespondRequest ? (
            <View style={{ gap: 10 }}>
              <Text style={shared.label}>{t("Friend requests")}</Text>
              {incomingRequests.map((req) => {
                const sender = lookupPerson?.(req.from);
                return (
                  <View key={req.id} style={n.requestCard}>
                    <View style={[shared.row, { gap: 12 }]}>
                      <MemberPhoto uri={sender?.photo} style={n.requestAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={type.headline}>
                          {sender?.name || t("New friend")}
                        </Text>
                        <Text style={shared.muted}>
                          {t("Wants to connect as friends")}
                        </Text>
                      </View>
                    </View>
                    <View style={[shared.row, { gap: 8 }]}>
                      <View style={{ flex: 1 }}>
                        <Button
                          secondary
                          compact
                          disabled={busy}
                          onPress={() => {
                            void onRespondRequest(req, false);
                          }}
                        >
                          {t("Decline")}
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          compact
                          disabled={busy}
                          onPress={() => {
                            void onRespondRequest(req, true);
                          }}
                        >
                          {t("Accept")}
                        </Button>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}

          <CollectionFeedback
            loading={loading && matches.length === 0}
            error={error}
            hasContent={matches.length > 0}
            onRetry={onRetry}
          />
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <Empty
            icon="chatbubble-ellipses-outline"
            title={t("No conversations yet")}
            text={t("Like someone in Home or say hello in Friends. Your dating matches and friend chats appear here.")}
          />
        ) : undefined
      }
      renderItem={({ item: match }) => {
        const other = match.members.find((member) => member !== uid) || "";
        const isFriend = match.kind === "friend";
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
            <View style={n.ring}>
              <MemberPhoto uri={match.photos[other]} style={n.ringPhoto} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={[shared.row, { gap: 8 }]}>
                <Text numberOfLines={1} style={[type.headline, { flexShrink: 1 }]}>
                  {match.names[other] || t("Your match")}
                </Text>
                <Badge>{isFriend ? t("Friend") : t("Dating")}</Badge>
                {demo && <Badge dark>{t("DEMO")}</Badge>}
              </View>
              <Text style={[shared.muted, { fontSize: 14, lineHeight: 20, fontFamily: fonts.semi, fontWeight: "600", color: colors.ink }]}>
                {isFriend ? t("Friend chat") : t("Your connection")}
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
  error,
  onRetry,
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
  error: string;
  onRetry: () => void;
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
          <IconButton
            label={t("Back to matches")}
            icon="arrow-back"
            onPress={onBack}
          />
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
          <IconButton
            label={t("Conversation safety options")}
            icon="ellipsis-horizontal"
            onPress={onSafety}
          />
        </View>
      )}
      <FlatList
        data={messages}
        keyExtractor={(message) => message.id}
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={{
          flexGrow: 1,
          paddingVertical: 20,
          gap: 8,
        }}
        ListHeaderComponent={<CollectionFeedback kind="messages" loading={loading} error={error} hasContent={messages.length > 0} onRetry={onRetry} />}
        ListEmptyComponent={!loading && !error ? <Empty
          title={t("No messages yet")}
          text={demo ? t("Write a practice hello. It stays in this session and isn’t sent to anyone.") : t("Skip the perfect opening line. Ask about something that caught your eye.")}
          icon="chatbubbles-outline"
        /> : undefined}
        renderItem={({ item: message }) => {
          const mine = message.sender === uid;
          return (
            <View style={[n.message, mine ? n.mine : n.theirs]}>
              <Text selectable style={[shared.body, mine && { color: colors.white }]}>
                {message.text}
              </Text>
            </View>
          );
        }}
      />
      <View style={n.composer}>
        <TextInput
          accessibilityLabel={t("Message")}
          placeholder={t("Message")}
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
        <CircleButton
          label={t("Send message")}
          icon="arrow-up"
          size={44}
          tone="lime"
          busy={sendBusy}
          disabled={!text.trim()}
          onPress={send}
        />
      </View>
      <Text
        style={[
          shared.muted,
          {
            fontSize: 13,
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
    height: 250,
    backgroundColor: colors.soft,
    borderRadius: radius.xl,
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
    paddingVertical: 14,
    paddingHorizontal: 4,
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

  // A neutral frame avoids implying that every match is unread.
  ring: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    backgroundColor: colors.soft,
  },
  ringPhoto: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: colors.paper,
  },
  message: {
    maxWidth: "78%",
    borderRadius: radius.lg,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: spacing.row,
  },
  mine: {
    alignSelf: "flex-end",
    backgroundColor: colors.ink,
    borderBottomRightRadius: 6,
  },
  theirs: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderBottomLeftRadius: 6,
  },
  composer: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
    minHeight: 56,
    padding: 6,
    paddingLeft: 8,
  },
  filterPill: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  filterPillActive: {
    backgroundColor: colors.ink,
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  requestCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 12,
  },
  requestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
