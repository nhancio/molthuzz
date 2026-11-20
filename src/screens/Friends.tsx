import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text, TextInput } from "../components/LocalizedText";
import {
  Badge,
  Button,
  CollectionFeedback,
  Empty,
  Icon,
  IconButton,
} from "../components/UI";
import { MemberPhoto } from "./Connections";
import type { Card, FriendRequest, Match, Profile } from "../lib/contracts";
import { FRIEND_LANGUAGES, FRIEND_MOODS, recommendFriends } from "../lib/model";
import { colors, controlSize, fonts, radius, shared, spacing, type } from "../theme";

export default function Friends({
  profile,
  people,
  matches,
  requests,
  uid,
  demo,
  busy,
  loading,
  error,
  onRetry,
  onMoodChange,
  onSayHello,
  onRespond,
  onOpenChat,
  onStartCall,
  onOpenProfile,
}: {
  profile: Profile;
  people: Card[];
  matches: Match[];
  requests: FriendRequest[];
  uid: string;
  demo: boolean;
  busy: boolean;
  loading: boolean;
  error: string;
  onRetry: () => void;
  onMoodChange: (mood: string) => Promise<void>;
  onSayHello: (person: Card) => Promise<void>;
  onRespond: (request: FriendRequest, accept: boolean) => Promise<void>;
  onOpenChat: (match: Match) => void;
  onStartCall: (match: Match, mode: "audio" | "video") => void;
  onOpenProfile: (person: Card) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("All languages");

  const filtered = useMemo(
    () => recommendFriends(profile, people, { query, language }),
    [profile, people, query, language],
  );

  const languageOptions = ["All languages", ...FRIEND_LANGUAGES];

  return (
    <FlatList
      data={filtered}
      keyExtractor={(person) => person.id}
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 36, gap: 14 }}
      refreshing={loading && people.length > 0}
      onRefresh={onRetry}
      ListHeaderComponent={
        <View style={{ gap: spacing.md, paddingTop: spacing.xs, paddingBottom: spacing.sm }}>
          <View style={{ gap: spacing.sm }}>
            <Text style={shared.label}>{t("How are you feeling?")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {FRIEND_MOODS.map((mood) => {
                const active = profile.mood === mood;
                return (
                  <Pressable
                    key={mood}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active, disabled: busy }}
                    disabled={busy}
                    onPress={() => {
                      void onMoodChange(mood);
                    }}
                    style={({ pressed }) => [
                      f.pill,
                      active && f.pillActive,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text
                      style={[
                        f.pillText,
                        active && { color: colors.white, fontWeight: "600" },
                      ]}
                    >
                      {t(mood)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={f.searchWrap}>
            <Icon name="search-outline" size={18} color={colors.muted} />
            <TextInput
              accessibilityLabel={t("Search name, city or interest")}
              placeholder={t("Search name, city or interest")}
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              style={f.searchInput}
            />
            {query ? (
              <IconButton
                icon="close"
                size={16}
                label={t("Clear search")}
                onPress={() => setQuery("")}
              />
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {languageOptions.map((item) => {
              const active = language === item;
              return (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setLanguage(item)}
                  style={({ pressed }) => [
                    f.langChip,
                    active && f.langChipActive,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Text
                    style={[
                      f.langText,
                      active && { fontWeight: "600", color: colors.ink },
                    ]}
                  >
                    {t(item)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={[shared.row, { justifyContent: "space-between" }]}>
            <Text style={type.headline}>{t("People nearby")}</Text>
            <Text style={type.caption}>
              {t("{{count}} people", { count: filtered.length })}
            </Text>
          </View>

          <CollectionFeedback
            loading={loading && people.length === 0}
            error={error}
            hasContent={people.length > 0}
            onRetry={onRetry}
          />
        </View>
      }
      ListEmptyComponent={
        !loading && !error ? (
          <Empty
            icon="people-outline"
            title={t("No friends found yet")}
            text={
              query || language !== "All languages"
                ? t("Try another language or clear your search to see more people.")
                : t("As more people join MakeIn, you can connect and make friends here.")
            }
            action={
              query || language !== "All languages" ? (
                <Button
                  secondary
                  compact
                  onPress={() => {
                    setQuery("");
                    setLanguage("All languages");
                  }}
                >
                  {t("Clear filters")}
                </Button>
              ) : undefined
            }
          />
        ) : undefined
      }
      renderItem={({ item: person }) => {
        const connection = matches.find((m) => m.members.includes(person.id));
        const incoming = requests.find(
          (r) => r.from === person.id && r.to === uid && r.status === "pending",
        );
        const outgoing = requests.find(
          (r) => r.from === uid && r.to === person.id && r.status === "pending",
        );
        const sharedInterests = person.interests.filter((i) =>
          profile.interests.includes(i),
        );

        return (
          <View style={f.card}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("View {{name}}, {{age}}", {
                name: person.name,
                age: person.age,
              })}
              onPress={() => onOpenProfile(person)}
              style={({ pressed }) => [
                shared.row,
                { gap: 14, alignItems: "flex-start", opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <MemberPhoto uri={person.photos[0]} style={f.avatar} />
              <View style={{ flex: 1, gap: 3 }}>
                <View style={[shared.row, { gap: 8, flexWrap: "wrap" }]}>
                  <Text numberOfLines={1} style={[type.headline, { flexShrink: 1 }]}>
                    {person.name}, {person.age}
                  </Text>
                  {(demo || person.demo) && <Badge dark>{t("DEMO")}</Badge>}
                </View>
                <Text numberOfLines={1} style={shared.muted}>
                  {person.location}
                </Text>
                {person.languages && person.languages.length > 0 ? (
                  <Text
                    numberOfLines={1}
                    style={[type.caption, { color: colors.olive, fontWeight: "600" }]}
                  >
                    {person.languages.map((lang) => t(lang)).join(" · ")}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-forward" size={18} color={colors.muted} />
            </Pressable>

            <Text numberOfLines={2} style={shared.body}>
              {person.bio}
            </Text>

            <View style={f.tags}>
              {person.interests.slice(0, 3).map((item) => {
                const isShared = sharedInterests.includes(item);
                return (
                  <View
                    key={item}
                    style={[f.tag, isShared && { backgroundColor: colors.lime }]}
                  >
                    <Text
                      style={[
                        type.caption,
                        { color: colors.ink, fontWeight: isShared ? "600" : "400" },
                      ]}
                    >
                      {t(item)}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={[shared.row, { justifyContent: "space-between", gap: 10, flexWrap: "wrap" }]}>
              <Text style={[type.caption, { flexShrink: 1 }]}>
                {person.mood ? t(person.mood) : t(person.intent)}
              </Text>
              {connection ? (
                <View style={[shared.row, { gap: 4 }]}>
                  <IconButton
                    icon="call-outline"
                    label={t("Audio call")}
                    disabled={busy}
                    onPress={() => onStartCall(connection, "audio")}
                  />
                  <IconButton
                    icon="videocam-outline"
                    label={t("Video call")}
                    disabled={busy}
                    onPress={() => onStartCall(connection, "video")}
                  />
                  <Button
                    inline
                    compact
                    onPress={() => onOpenChat(connection)}
                  >
                    {t("Chat")}
                  </Button>
                </View>
              ) : incoming ? (
                <View style={[shared.row, { gap: 8 }]}>
                  <Button
                    inline
                    compact
                    secondary
                    disabled={busy}
                    onPress={() => {
                      void onRespond(incoming, false);
                    }}
                  >
                    {t("Decline")}
                  </Button>
                  <Button
                    inline
                    compact
                    disabled={busy}
                    onPress={() => {
                      void onRespond(incoming, true);
                    }}
                  >
                    {t("Accept")}
                  </Button>
                </View>
              ) : outgoing ? (
                <Badge>{t("Request sent")}</Badge>
              ) : (
                <Button
                  inline
                  compact
                  disabled={busy}
                  onPress={() => {
                    void onSayHello(person);
                  }}
                >
                  {t("Say hello")}
                </Button>
              )}
            </View>
          </View>
        );
      }}
    />
  );
}

const f = StyleSheet.create({
  pill: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    justifyContent: "center",
  },
  pillActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pillText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.ink,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    borderCurve: "continuous",
    paddingHorizontal: 12,
    minHeight: controlSize,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 10,
  },
  langChip: {
    minHeight: 34,
    paddingHorizontal: 12,
    borderRadius: radius.full,
    backgroundColor: colors.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  langChipActive: {
    backgroundColor: colors.lime,
  },
  langText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: spacing.md,
    gap: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    backgroundColor: colors.soft,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
});
