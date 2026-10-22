import { useTranslation } from "react-i18next";
import { Text } from "./LocalizedText";
import React, { useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  PanResponder,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import type { Card } from "../lib/contracts";
import { swipeDirection } from "../lib/model";
import { Badge, Icon } from "./UI";
import { colors, fonts, shared } from "../theme";
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
  onDecision: (decision: "like" | "pass") => Promise<void>;
  busy: boolean;
  onGestureStateChange: (busy: boolean) => void;
}) {
  const { t } = useTranslation();
  const [position] = useState(() => new Animated.ValueXY());
  const locked = useRef(false);
  const [photo, setPhoto] = useState(0);
  const responder = useMemo(
    () =>
      // PanResponder calls these ref-reading callbacks only during touch events.
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          !busy &&
          !locked.current &&
          Math.abs(g.dx) > 12 &&
          Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderMove: (_, g) => {
          if (!locked.current) position.setValue({ x: g.dx, y: g.dy * 0.2 });
        },
        onPanResponderRelease: (_, g) => {
          const direction = swipeDirection(g.dx, g.vx);
          if (direction && !locked.current) {
            locked.current = true;
            onGestureStateChange(true);
            Animated.timing(position, {
              toValue: { x: direction === "like" ? 600 : -600, y: 30 },
              duration: 220,
              useNativeDriver: true,
            }).start(() => {
              onDecision(direction).finally(() => {
                position.setValue({ x: 0, y: 0 });
                locked.current = false;
                onGestureStateChange(false);
              });
            });
          } else
            Animated.spring(position, {
              toValue: { x: 0, y: 0 },
              useNativeDriver: true,
            }).start();
        },
        onPanResponderTerminate: () =>
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
          }).start(),
      }),
    [busy, onDecision, position, onGestureStateChange],
  );
  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        c.card,
        {
          height,
          transform: [
            { translateX: position.x },
            { translateY: position.y },
            {
              rotate: position.x.interpolate({
                inputRange: [-300, 0, 300],
                outputRange: ["-12deg", "0deg", "12deg"],
              }),
            },
          ],
        },
      ]}
    >
      <Image
        source={{ uri: card.photos[photo] }}
        resizeMode="cover"
        style={StyleSheet.absoluteFill}
      />
      <View style={c.shade} />
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
          onPress={onOpen}
          style={c.info}
        >
          <Icon name="arrow-up-right-box" color={colors.white} size={20} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("View {{name}}’s full profile", {
          name: card.name,
        })}
        onPress={onOpen}
        style={c.caption}
      >
        <View style={[shared.row, { gap: 9 }]}>
          <Text style={c.name}>
            {card.name}, {card.age}
          </Text>
          <View style={c.spark}>
            <Icon name="sparkles" size={14} />
          </View>
        </View>
        <View style={[shared.row, { gap: 5, marginTop: 8 }]}>
          <Icon name="location-outline" size={14} color={colors.white} />
          <Text style={c.location}>{card.location}</Text>
        </View>
        <View style={[shared.row, { flexWrap: "wrap", gap: 7, marginTop: 19 }]}>
          {card.interests.slice(0, 3).map((i) => (
            <View key={i} style={c.pill}>
              <Text style={c.interest}>{t(i)}</Text>
            </View>
          ))}
        </View>
      </Pressable>
      {card.photos.length > 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("Next profile photo")}
          onPress={() => setPhoto((i) => (i + 1) % card.photos.length)}
          style={c.nextPhoto}
        >
          <Icon name="chevron-forward" color={colors.white} />
        </Pressable>
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          c.stamp,
          {
            right: 20,
            borderColor: colors.lime,
            opacity: position.x.interpolate({
              inputRange: [0, 75],
              outputRange: [0, 1],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <Text style={[c.stampText, { color: colors.lime }]}>{t("LIKE")}</Text>
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          c.stamp,
          {
            left: 20,
            borderColor: colors.white,
            opacity: position.x.interpolate({
              inputRange: [-75, 0],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
          },
        ]}
      >
        <Text style={[c.stampText, { color: colors.white }]}>{t("PASS")}</Text>
      </Animated.View>
    </Animated.View>
  );
}
const c = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 25,
    overflow: "hidden",
    backgroundColor: "#B9BBAE",
    boxShadow: "0 16px 40px #20241F15",
  },
  shade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "39%",
    backgroundColor: "#17201BB8",
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
    top: 28,
    left: 21,
    right: 21,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  info: {
    backgroundColor: "#FFFFFF25",
    width: 44,
    height: 44,
    borderWidth: 1,
    borderColor: "#FFFFFF50",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  caption: { position: "absolute", bottom: 27, left: 25, right: 20 },
  name: {
    flexShrink: 1,
    fontFamily: fonts.serif,
    fontSize: 43,
    lineHeight: 47,
    color: colors.white,
  },
  spark: {
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: colors.lime,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  location: { fontFamily: fonts.regular, fontSize: 13, color: colors.white },
  pill: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FFFFFF70",
    backgroundColor: "#FFFFFF12",
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  interest: { fontFamily: fonts.medium, fontSize: 10, color: colors.white },
  nextPhoto: { position: "absolute", right: 13, top: "45%", padding: 10 },
  stamp: {
    position: "absolute",
    top: 130,
    borderWidth: 3,
    borderRadius: 8,
    padding: 12,
    transform: [{ rotate: "-12deg" }],
  },
  stampText: { fontFamily: fonts.bold, fontSize: 32 },
});
