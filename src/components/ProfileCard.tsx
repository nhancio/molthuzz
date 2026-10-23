import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  interpolate,
  Extrapolation,
  ReduceMotion,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { Card } from "../lib/contracts";
import {
  commitSwipeTransaction,
  gestureSwipeDirection,
  type SwipeDecision,
} from "../lib/swipe-gesture";
import { Text } from "./LocalizedText";
import { Badge, Icon } from "./UI";
import { colors, fonts, shared } from "../theme";

const spring = {
  duration: 400,
  dampingRatio: 0.8,
  reduceMotion: ReduceMotion.System,
};

export default function ProfileCard({
  card,
  height,
  onOpen,
  onDecision,
  busy,
  onGestureStateChange,
}: {
  card: Card;
  height: number;
  onOpen: () => void;
  onDecision: (decision: SwipeDecision) => Promise<void>;
  busy: boolean;
  onGestureStateChange: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const locked = useSharedValue(false);
  const transaction = useRef({ locked: false });
  const [photo, setPhoto] = useState(0);
  const [failedUri, setFailedUri] = useState<string>();
  const photoUri = card.photos[photo];

  const commit = useCallback(
    (decision: SwipeDecision) => {
      void commitSwipeTransaction(
        transaction.current,
        decision,
        onDecision,
        () => {
          onGestureStateChange(true);
        },
        () => {
          x.set(withSpring(0, spring));
          y.set(withSpring(0, spring));
          locked.set(false);
          onGestureStateChange(false);
        },
      ).catch(() => {
        // The parent renders service errors; the same card is ready to retry.
      });
    },
    [locked, onDecision, onGestureStateChange, x, y],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!busy)
        .activeOffsetX([-12, 12])
        .failOffsetY([-14, 14])
        .onStart(() => {
          if (locked.get()) return;
          cancelAnimation(x);
          cancelAnimation(y);
          originX.set(x.get());
          originY.set(y.get());
        })
        .onUpdate((event) => {
          if (locked.get()) return;
          x.set(originX.get() + event.translationX);
          y.set(originY.get() + event.translationY * 0.15);
        })
        // Gesture Handler invokes this callback after render; scheduleOnRN does not read the RN ref here.
        // eslint-disable-next-line react-hooks/refs
        .onEnd((event) => {
          if (locked.get()) return;
          const direction = gestureSwipeDirection(x.get(), event.velocityX);
          if (!direction) {
            x.set(withSpring(0, { ...spring, velocity: event.velocityX }));
            y.set(
              withSpring(0, { ...spring, velocity: event.velocityY * 0.15 }),
            );
            return;
          }
          locked.set(true);
          x.set(
            withSpring((direction === "like" ? 1 : -1) * (width + 120), {
              ...spring,
              velocity: event.velocityX,
              overshootClamping: true,
            }),
          );
          y.set(
            withSpring(24, { ...spring, velocity: event.velocityY * 0.15 }),
          );
          scheduleOnRN(commit, direction);
        })
        .onFinalize((_event, success) => {
          if (!success && !locked.get()) {
            x.set(withSpring(0, spring));
            y.set(withSpring(0, spring));
          }
        }),
    [busy, commit, locked, originX, originY, width, x, y],
  );

  const motion = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.get() },
      { translateY: y.get() },
      { rotate: `${reducedMotion ? 0 : x.get() / 35}deg` },
    ],
  }));
  const likeStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [0, 90], [0, 1], Extrapolation.CLAMP),
  }));
  const passStamp = useAnimatedStyle(() => ({
    opacity: interpolate(x.get(), [-90, 0], [1, 0], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[c.card, { height }, motion]}>
        <View style={c.placeholder}>
          <Icon name="person-outline" size={60} color={colors.muted} />
        </View>
        {!!photoUri && failedUri !== photoUri && (
          <Image
            source={{ uri: photoUri }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
            onError={() => setFailedUri(photoUri)}
          />
        )}
        <LinearGradient
          pointerEvents="none"
          colors={["#00000038", "#00000000", "#10181033", "#101810EE"]}
          locations={[0, 0.3, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={c.photoSteps}>
          {card.photos.map((_, i) => (
            <View
              key={i}
              style={[c.photoStep, { opacity: i === photo ? 1 : 0.35 }]}
            />
          ))}
        </View>
        <View style={c.top}>
          <Badge dark>{card.demo ? t("DEMO PROFILE") : t(card.intent)}</Badge>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Open full profile")}
            disabled={busy}
            onPress={onOpen}
            android_ripple={{ color: "#FFFFFF30" }}
            style={({ pressed }) => [c.info, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Icon name="arrow-up-right-box" color={colors.white} size={20} />
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("View {{name}}’s full profile", {
            name: card.name,
          })}
          disabled={busy}
          onPress={onOpen}
          style={({ pressed }) => [c.caption, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text numberOfLines={2} style={c.name}>
            {card.name}, {card.age}
          </Text>
          <View style={[shared.row, { gap: 5, marginTop: 8 }]}>
            <Icon name="location-outline" size={15} color={colors.white} />
            <Text numberOfLines={2} style={c.location}>
              {card.location}
            </Text>
          </View>
          <View
            style={[shared.row, { flexWrap: "wrap", gap: 7, marginTop: 16 }]}
          >
            {card.interests.slice(0, 3).map((interest) => (
              <View key={interest} style={c.pill}>
                <Text style={c.interest}>{t(interest)}</Text>
              </View>
            ))}
          </View>
        </Pressable>
        {card.photos.length > 1 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("Next profile photo")}
            disabled={busy}
            onPress={() => setPhoto((i) => (i + 1) % card.photos.length)}
            style={({ pressed }) => [
              c.nextPhoto,
              { backgroundColor: pressed ? "#00000055" : "#00000022" },
            ]}
          >
            <Icon name="chevron-forward" color={colors.white} />
          </Pressable>
        )}
        <Animated.View
          pointerEvents="none"
          style={[c.stamp, { right: 20, borderColor: colors.lime }, likeStamp]}
        >
          <Text style={[c.stampText, { color: colors.lime }]}>{t("LIKE")}</Text>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[c.stamp, { left: 20, borderColor: colors.white }, passStamp]}
        >
          <Text style={[c.stampText, { color: colors.white }]}>
            {t("PASS")}
          </Text>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
const c = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 26,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: colors.soft,
    boxShadow: "0 8px 24px #20241F12",
  },
  placeholder: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  photoSteps: {
    position: "absolute",
    top: 12,
    left: 18,
    right: 18,
    flexDirection: "row",
    gap: 4,
  },
  photoStep: {
    height: 3,
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 2,
  },
  top: {
    position: "absolute",
    top: 24,
    left: 18,
    right: 14,
    flexDirection: "row",
    gap: 12,
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    backgroundColor: "#00000030",
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  caption: { position: "absolute", bottom: 24, left: 22, right: 22 },
  name: {
    fontFamily: fonts.semi,
    fontWeight: "600",
    fontSize: 34,
    lineHeight: 43,
    color: colors.white,
  },
  location: {
    flexShrink: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.white,
  },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF50",
    backgroundColor: "#FFFFFF18",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  interest: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.white,
  },
  nextPhoto: {
    position: "absolute",
    right: 10,
    top: "43%",
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  stamp: {
    position: "absolute",
    top: 105,
    borderWidth: 2,
    borderRadius: 9,
    padding: 10,
    transform: [{ rotate: "-10deg" }],
  },
  stampText: { fontFamily: fonts.bold, fontSize: 26 },
});
