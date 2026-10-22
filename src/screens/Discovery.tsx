import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import type { Card } from "../lib/contracts";
import { Badge, Button, Empty, Icon } from "../components/UI";
import ProfileCard from "../components/ProfileCard";
import { colors, shared } from "../theme";
export default function Discovery({
  cards,
  demo,
  busy,
  loading,
  onDecision,
  onOpen,
  onFilters,
  onReset,
  onMembership,
  active,
}: {
  cards: Card[];
  demo: boolean;
  busy: boolean;
  loading: boolean;
  onDecision: (v: "like" | "pass") => Promise<void>;
  onOpen: (card: Card) => void;
  onFilters: () => void;
  onReset: () => void;
  onMembership: () => void;
  active: boolean;
}) {
  const [gestureBusy, setGestureBusy] = useState(false);
  const interactionBusy = busy || gestureBusy;
  const wide = useWindowDimensions().width >= 1120;
  const card = cards[0];
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 35 }}>
      <View style={d.header}>
        <View>
          <Text style={shared.label}>A WORLD OF POSSIBILITIES</Text>
          <Text
            accessibilityRole="header"
            style={[shared.heading, { marginTop: 10, fontSize: 46 }]}
          >
            Someone worth{wide ? " a" : "\na"} hello.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Discovery filters"
          onPress={onFilters}
          style={d.filter}
        >
          <Icon name="options-outline" />
        </Pressable>
      </View>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: 34,
          justifyContent: "center",
          alignItems: wide ? "flex-start" : "center",
          marginTop: 28,
        }}
      >
        <View style={{ width: "100%", maxWidth: 405 }}>
          {loading ? (
            <View style={{ minHeight: 450, justifyContent: "center" }}>
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : card ? (
            <>
              <ProfileCard
                key={card.id}
                onGestureStateChange={setGestureBusy}
                card={card}
                onOpen={() => onOpen(card)}
                onDecision={onDecision}
                busy={interactionBusy}
              />
              <View style={d.actions}>
                <Pressable
                  disabled={interactionBusy}
                  onPress={() => onDecision("pass")}
                  accessibilityRole="button"
                  accessibilityLabel="Pass profile"
                  style={[
                    d.action,
                    {
                      backgroundColor: colors.white,
                      borderWidth: 1,
                      borderColor: colors.line,
                      opacity: interactionBusy ? 0.4 : 1,
                    },
                  ]}
                >
                  <Icon name="close" size={28} />
                </Pressable>
                <Pressable
                  onPress={() => onOpen(card)}
                  accessibilityRole="button"
                  accessibilityLabel="View profile"
                  style={[
                    d.action,
                    { width: 45, height: 45, backgroundColor: colors.soft },
                  ]}
                >
                  <Icon name="person-outline" size={21} />
                </Pressable>
                <Pressable
                  disabled={interactionBusy}
                  onPress={() => onDecision("like")}
                  accessibilityRole="button"
                  accessibilityLabel="Like profile"
                  style={[
                    d.action,
                    {
                      backgroundColor: colors.lime,
                      opacity: interactionBusy ? 0.4 : 1,
                    },
                  ]}
                >
                  {interactionBusy ? (
                    <ActivityIndicator color={colors.ink} />
                  ) : (
                    <Icon name="heart" size={27} />
                  )}
                </Pressable>
              </View>
              <Text
                style={[shared.muted, { fontSize: 10, textAlign: "center" }]}
              >
                SWIPE LEFT TO PASS · RIGHT TO LIKE
              </Text>
            </>
          ) : (
            <Empty
              title="A little pause."
              text={
                demo
                  ? "You’ve explored these fictional profiles. Reset the demo or adjust your filters to keep looking."
                  : "No profiles meet your preferences yet. Try broadening your filters or return later."
              }
              action={
                <Button secondary onPress={demo ? onReset : onFilters}>
                  {demo ? "Reset demo cards" : "Adjust filters"}
                </Button>
              }
            />
          )}
        </View>
        {wide && (
          <View style={{ width: 254, gap: 22, paddingTop: 5 }}>
            <View style={d.note}>
              <View style={[shared.row, { justifyContent: "space-between" }]}>
                <Text style={shared.label}>A GENTLE REMINDER</Text>
                <Icon name="sunny-outline" size={24} />
              </View>
              <Text
                style={[
                  shared.heading,
                  { fontSize: 37, lineHeight: 40, marginTop: 31 },
                ]}
              >
                Great connections{"\n"}start with{"\n"}being yourself.
              </Text>
              <View
                style={{
                  height: 1,
                  backgroundColor: "#C9CDBA",
                  marginVertical: 24,
                }}
              />
              <Text style={[shared.muted, { fontSize: 12 }]}>
                Read the bio. Notice the little things. Send a thoughtful hello
                when you match.
              </Text>
            </View>
            <View style={{ paddingHorizontal: 8, gap: 13 }}>
              <Badge dark>
                {demo
                  ? "A SAFE SPACE TO EXPLORE"
                  : active
                    ? "MEMBERSHIP ACTIVE"
                    : "THE FIRST HELLO IS A START"}
              </Badge>
              <Text style={[shared.muted, { fontSize: 12 }]}>
                {demo
                  ? "Every person here is fictional. Likes, matches and practice messages stay in this demo session."
                  : active
                    ? "Take your time. There’s a person on the other side of every profile."
                    : "Set up your profile for free. Membership unlocks real likes and conversations."}
              </Text>
              {!demo && !active && (
                <Button compact secondary onPress={onMembership}>
                  Explore membership
                </Button>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
const d = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filter: {
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.line,
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: 22,
    marginBottom: 17,
  },
  action: {
    width: 65,
    height: 65,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  note: { padding: 25, backgroundColor: "#EDEFE3", borderRadius: 21 },
});
