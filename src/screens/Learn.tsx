import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { Text, TextInput } from "../components/LocalizedText";
import { Badge, Button, CircleButton, Icon, Notice, Sheet } from "../components/UI";
import type { AuthUser, LearnChatMessage } from "../lib/contracts";
import { askLearnCoach } from "../lib/learn-ai";
import { LEARN_CARDS, LEARN_STARTER_PROMPTS, type LearnCard } from "../lib/learn-cards";
import { colors, fonts, radius, shared, spacing, type } from "../theme";

type Mode = "guides" | "chat";

export default function Learn({
  user,
  demo,
}: {
  user: AuthUser | null;
  demo: boolean;
}) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("guides");
  const [selectedGuide, setSelectedGuide] = useState<LearnCard | null>(null);
  const [messages, setMessages] = useState<LearnChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [offlineNote, setOfflineNote] = useState(false);
  const [chatError, setChatError] = useState("");
  const pending = useRef(false);
  const nextMessageId = useRef(1);
  const listRef = useRef<FlatList<LearnChatMessage>>(null);

  async function sendPrompt(raw: string) {
    const clean = raw.trim();
    if (!clean || pending.current) return;
    pending.current = true;
    setSending(true);
    setChatError("");
    const userMsg: LearnChatMessage = {
      id: `u-${nextMessageId.current++}`,
      role: "user",
      text: clean,
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setDraft("");
    try {
      const { reply, offline } = await askLearnCoach({
        prompt: clean,
        history: messages,
        user,
        demo,
      });
      setOfflineNote(offline);
      setMessages((current) => [
        ...current,
        { id: `a-${nextMessageId.current++}`, role: "assistant", text: reply },
      ]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (e) {
      setChatError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      pending.current = false;
      setSending(false);
    }
  }

  function practiceGuide(guide: LearnCard) {
    setSelectedGuide(null);
    setMode("chat");
    void sendPrompt(guide.practicePrompt);
  }

  return (
    <View style={{ flex: 1, minHeight: 0 }}>
      <View style={l.switcher}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === "guides" }}
          onPress={() => setMode("guides")}
          style={[l.segment, mode === "guides" && l.segmentActive]}
        >
          <Icon
            name="book-outline"
            size={16}
            color={mode === "guides" ? colors.white : colors.ink}
          />
          <Text style={[l.segmentText, mode === "guides" && l.segmentTextActive]}>
            {t("Guides")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === "chat" }}
          onPress={() => setMode("chat")}
          style={[l.segment, mode === "chat" && l.segmentActive]}
        >
          <Icon
            name="sparkles"
            size={16}
            color={mode === "chat" ? colors.lime : colors.ink}
          />
          <Text style={[l.segmentText, mode === "chat" && l.segmentTextActive]}>
            {t("Coach")}
          </Text>
        </Pressable>
      </View>

      {mode === "guides" ? (
        <FlatList
          data={LEARN_CARDS}
          keyExtractor={(item) => item.id}
          style={{ flex: 1 }}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={{ paddingTop: spacing.md, paddingBottom: 36, gap: 16 }}
          ListHeaderComponent={
            <View style={{ gap: 6, paddingBottom: 4 }}>
              <Text style={shared.muted}>
                {t("Read short, practical conversation guides, or switch to Coach to draft warm openers and replies.")}
              </Text>
            </View>
          }
          renderItem={({ item: card }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={card.title}
              onPress={() => setSelectedGuide(card)}
              style={({ pressed }) => [l.guideCard, { opacity: pressed ? 0.85 : 1 }]}
            >
              <Image
                source={{ uri: card.image }}
                style={l.guideImage}
                contentFit="cover"
              />
              <View style={l.guideBody}>
                <View style={[shared.row, { justifyContent: "space-between", gap: 8 }]}>
                  <Badge>{card.category}</Badge>
                  <Text style={type.caption}>
                    {t("{{minutes}} min read", { minutes: card.readMinutes })}
                  </Text>
                </View>
                <Text style={type.serifTitle}>{card.title}</Text>
                <Text style={shared.muted}>{card.subtitle}</Text>
              </View>
            </Pressable>
          )}
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1, minHeight: 0 }}
          behavior="padding"
          automaticOffset
        >
          <View style={[shared.row, { justifyContent: "space-between", paddingTop: spacing.sm, paddingBottom: spacing.xs }]}>
            <Text style={type.caption}>
              {demo || offlineNote
                ? t("MakeIn Coach · Instant built-in guidance")
                : t("MakeIn Coach · Draft openers, replies, and date ideas")}
            </Text>
            {messages.length > 0 ? (
              <Button
                inline
                compact
                variant="text"
                onPress={() => {
                  setMessages([]);
                  setChatError("");
                }}
              >
                {t("New chat")}
              </Button>
            ) : null}
          </View>

          {chatError ? (
            <View style={{ marginBottom: spacing.sm }}>
              <Notice error text={chatError} />
            </View>
          ) : null}

          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={{ flexGrow: 1, paddingVertical: spacing.md, gap: 12 }}
            ListEmptyComponent={
              <View style={l.chatEmpty}>
                <View style={l.coachBadge}>
                  <Icon name="sparkles" size={24} color={colors.ink} />
                </View>
                <Text style={[type.serifTitle, { textAlign: "center" }]}>
                  {t("Practice openers and thoughtful replies")}
                </Text>
                <Text style={[shared.muted, { textAlign: "center", maxWidth: 310 }]}>
                  {t("Paste a message you received, test a first message, or plan a calm first date with MakeIn Coach.")}
                </Text>
                <View style={l.prompts}>
                  {LEARN_STARTER_PROMPTS.map((prompt) => (
                    <Pressable
                      key={prompt}
                      accessibilityRole="button"
                      onPress={() => {
                        void sendPrompt(prompt);
                      }}
                      style={({ pressed }) => [
                        l.promptChip,
                        { opacity: pressed ? 0.72 : 1 },
                      ]}
                    >
                      <Text style={l.promptText}>{prompt}</Text>
                      <Icon name="arrow-forward" size={16} color={colors.muted} />
                    </Pressable>
                  ))}
                </View>
              </View>
            }
            ListFooterComponent={
              sending ? (
                <View style={[l.bubble, l.assistantBubble, shared.row, { gap: 10 }]}>
                  <ActivityIndicator size="small" color={colors.ink} />
                  <Text style={shared.muted}>{t("Thinking…")}</Text>
                </View>
              ) : undefined
            }
            renderItem={({ item: msg }) => {
              const mine = msg.role === "user";
              return (
                <View style={[l.bubble, mine ? l.userBubble : l.assistantBubble]}>
                  {!mine ? (
                    <View style={[shared.row, { gap: 6, marginBottom: 4 }]}>
                      <Icon name="sparkles" size={14} color={colors.olive} />
                      <Text style={[type.caption, { fontWeight: "600", color: colors.olive }]}>
                        {t("AI Coach")}
                      </Text>
                    </View>
                  ) : null}
                  <Text selectable style={[shared.body, mine && { color: colors.white }]}>
                    {msg.text}
                  </Text>
                </View>
              );
            }}
          />

          <View style={l.composer}>
            <TextInput
              accessibilityLabel={t("Ask anything or practice flirting…")}
              placeholder={t("Ask anything or practice flirting…")}
              placeholderTextColor={colors.muted}
              value={draft}
              onChangeText={setDraft}
              multiline
              maxLength={1000}
              style={[
                shared.body,
                { flex: 1, paddingVertical: 12, paddingHorizontal: 14, maxHeight: 120 },
              ]}
            />
            <CircleButton
              label={t("Send message")}
              icon="arrow-up"
              size={44}
              tone="lime"
              busy={sending}
              disabled={!draft.trim()}
              onPress={() => {
                void sendPrompt(draft);
              }}
            />
          </View>
        </KeyboardAvoidingView>
      )}

      <Sheet
        title={selectedGuide?.category || t("Guides")}
        visible={!!selectedGuide}
        onClose={() => setSelectedGuide(null)}
      >
        {selectedGuide ? (
          <View style={{ gap: spacing.lg }}>
            <Image
              source={{ uri: selectedGuide.image }}
              style={l.readerImage}
              contentFit="cover"
            />
            <View style={{ gap: 6 }}>
              <Text style={type.serifTitle}>{selectedGuide.title}</Text>
              <Text style={shared.muted}>{selectedGuide.subtitle}</Text>
            </View>
            <View style={{ gap: 10 }}>
              <Text style={shared.label}>{t("Key ideas")}</Text>
              {selectedGuide.tips.map((tip, index) => (
                <View key={index} style={[shared.row, { alignItems: "flex-start", gap: 10 }]}>
                  <View style={l.tipNumber}>
                    <Text style={[type.caption, { fontWeight: "700", color: colors.ink }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[shared.body, { flex: 1 }]}>{tip}</Text>
                </View>
              ))}
            </View>
            <View style={l.tryBox}>
              <Text style={[shared.label, { color: colors.ink }]}>{t("Try this")}</Text>
              <Text selectable style={shared.body}>{selectedGuide.tryThis}</Text>
            </View>
            <View style={l.skipBox}>
              <Text style={shared.label}>{t("Skip this")}</Text>
              <Text selectable style={shared.muted}>{selectedGuide.skipThis}</Text>
            </View>
            <Button icon="sparkles" onPress={() => practiceGuide(selectedGuide)}>
              {t("Practice with AI")}
            </Button>
          </View>
        ) : null}
      </Sheet>
    </View>
  );
}

const l = StyleSheet.create({
  switcher: {
    flexDirection: "row",
    backgroundColor: colors.soft,
    borderRadius: radius.full,
    padding: 4,
    gap: 4,
    marginTop: spacing.xs,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.full,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  segmentActive: {
    backgroundColor: colors.ink,
  },
  segmentText: {
    fontFamily: fonts.semi,
    fontWeight: "600",
    fontSize: 14,
    color: colors.ink,
  },
  segmentTextActive: {
    color: colors.white,
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: "hidden",
  },
  guideImage: {
    width: "100%",
    height: 176,
    backgroundColor: colors.soft,
  },
  guideBody: {
    padding: spacing.md,
    gap: 8,
  },
  readerImage: {
    width: "100%",
    height: 210,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    backgroundColor: colors.soft,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  tryBox: {
    backgroundColor: "#EEF8C6",
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: spacing.md,
    gap: 6,
  },
  skipBox: {
    backgroundColor: colors.soft,
    borderRadius: radius.md,
    borderCurve: "continuous",
    padding: spacing.md,
    gap: 6,
  },
  chatEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: spacing.lg,
  },
  coachBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  prompts: {
    width: "100%",
    gap: 8,
    marginTop: spacing.sm,
  },
  promptChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  promptText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: colors.ink,
  },
  bubble: {
    maxWidth: "84%",
    borderRadius: radius.lg,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.ink,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
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
    marginBottom: spacing.sm,
  },
});
