import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import React, { useCallback, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import type { Card } from "../lib/contracts";
import { Button, Empty, IconButton } from "../components/UI";
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
  const { t } = useTranslation();
  const { fontScale } = useWindowDimensions();
  const [bounds, setBounds] = useState({ height: 570, width: 354 });
  const [headerHeight, setHeaderHeight] = useState(48);
  const [controlsHeight, setControlsHeight] = useState(100);
  const [gestureBusy, setGestureBusy] = useState(false);
  const decisionPending = useRef(false);
  const decide = useCallback(
    async (decision: "like" | "pass") => {
      if (decisionPending.current) return;
      decisionPending.current = true;
      setGestureBusy(true);
      if (process.env.EXPO_OS === "ios")
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
          () => {},
        );
      try {
        await onDecision(decision);
      } finally {
        decisionPending.current = false;
        setGestureBusy(false);
      }
    },
    [onDecision],
  );
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
            <Text style={[shared.muted, { fontSize: 14 }]}>
              {t("Your next hello.")}
            </Text>
          </View>
          <IconButton
            label={t("Discovery filters")}
            icon="options-outline"
            onPress={onFilters}
          />
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
                onDecision={decide}
                busy={interactionBusy}
              />
              <View
                style={d.controls}
                onLayout={(event) =>
                  setControlsHeight(event.nativeEvent.layout.height)
                }
              >
                <View style={d.actions}>
                  <IconButton
                    label={t("Pass profile")}
                    icon="close"
                    size={27}
                    disabled={interactionBusy}
                    onPress={() => {
                      void decide("pass").catch(() => {});
                    }}
                  />
                  <IconButton
                    label={t("View profile")}
                    icon="person-outline"
                    size={22}
                    disabled={interactionBusy}
                    onPress={() => onOpen(card)}
                  />
                  <IconButton
                    label={t("Like profile")}
                    icon="heart"
                    size={27}
                    disabled={interactionBusy}
                    busy={interactionBusy}
                    onPress={() => {
                      void decide("like").catch(() => {});
                    }}
                  />
                </View>
                <Text
                  style={[
                    shared.muted,
                    { fontSize: 11, textAlign: "center", marginTop: 10 },
                  ]}
                >
                  {t("SWIPE LEFT TO PASS · RIGHT TO LIKE")}
                </Text>
              </View>
            </>
          ) : (
            <Empty
              title={t("A little pause.")}
              text={
                demo
                  ? t(
                      "You’ve explored these fictional profiles. Reset the demo or adjust your filters to keep looking.",
                    )
                  : t(
                      "No profiles meet your preferences yet. Try broadening your filters or return later.",
                    )
              }
              action={
                <Button secondary onPress={demo ? onReset : onFilters}>
                  {demo ? t("Reset demo cards") : t("Adjust filters")}
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

  controls: { paddingTop: 12 },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 26,
  },
});
