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
import { Button, Empty, Icon } from "../components/UI";
import ProfileCard from "../components/ProfileCard";
import { colors, shared } from "../theme";
import {
  DISCOVERY_BOTTOM_PADDING,
  DISCOVERY_CARD_GAP,
  discoveryLayout,
} from "./discovery-layout";

export default function Discovery({
  cards,
  demo,
  busy,
  loading,
  onDecision,
  onOpen,
  onFilters,
  onReset,
}: {
  cards: Card[];
  demo: boolean;
  busy: boolean;
  loading: boolean;
  onDecision: (v: "like" | "pass") => Promise<void>;
  onOpen: (card: Card) => void;
  onFilters: () => void;
  onReset: () => void;
}) {
  const { fontScale } = useWindowDimensions();
  const [bounds, setBounds] = useState({ height: 570, width: 354 });
  const [headerHeight, setHeaderHeight] = useState(57);
  const [controlsHeight, setControlsHeight] = useState(100);
  const [gestureBusy, setGestureBusy] = useState(false);
  const interactionBusy = busy || gestureBusy;
  const card = cards[0];
  const layout = discoveryLayout({
    availableHeight: bounds.height,
    cardWidth: bounds.width,
    headerHeight,
    controlsHeight,
    fontScale,
  });
  return (
    <View
      style={{ flex: 1, minHeight: 0 }}
      onLayout={(event) => {
        const { height, width } = event.nativeEvent.layout;
        setBounds((previous) =>
          previous.height === height && previous.width === width
            ? previous
            : { height, width },
        );
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={layout.needsScroll}
        contentContainerStyle={{ paddingBottom: DISCOVERY_BOTTOM_PADDING }}
      >
        <View
          style={d.header}
          onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
        >
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[shared.label, { fontSize: 9 }]}>
              A WORLD OF POSSIBILITIES
            </Text>
            <Text
              accessibilityRole="header"
              style={[shared.heading, { fontSize: 34, lineHeight: 38 }]}
            >
              Your next hello.
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
        <View style={{ marginTop: DISCOVERY_CARD_GAP }}>
          {loading ? (
            <View
              style={{ height: layout.cardHeight, justifyContent: "center" }}
            >
              <ActivityIndicator color={colors.ink} />
            </View>
          ) : card ? (
            <>
              <ProfileCard
                key={card.id}
                height={layout.cardHeight}
                onGestureStateChange={setGestureBusy}
                card={card}
                onOpen={() => onOpen(card)}
                onDecision={onDecision}
                busy={interactionBusy}
              />
              <View
                style={d.controls}
                onLayout={(event) =>
                  setControlsHeight(event.nativeEvent.layout.height)
                }
              >
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
                    <Icon name="close" size={27} />
                  </Pressable>
                  <Pressable
                    onPress={() => onOpen(card)}
                    accessibilityRole="button"
                    accessibilityLabel="View profile"
                    style={[
                      d.action,
                      { width: 46, height: 46, backgroundColor: colors.soft },
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
                  style={[
                    shared.muted,
                    { fontSize: 9, textAlign: "center", marginTop: 8 },
                  ]}
                >
                  SWIPE LEFT TO PASS · RIGHT TO LIKE
                </Text>
              </View>
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
      </ScrollView>
    </View>
  );
}
const d = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  filter: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.line,
    width: 46,
    height: 46,
    justifyContent: "center",
    alignItems: "center",
  },
  controls: { paddingTop: 12 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
  },
  action: {
    width: 58,
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
});
