import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./LocalizedText";
import { Button } from "./UI";
import { MemberPhoto } from "../screens/Connections";
import type { Call } from "../lib/contracts";
import { finishCall, watchIncoming } from "../calls/signaling";
import { colors, radius, shared, spacing, type } from "../theme";

export function IncomingCallBanner({
  uid,
  enabled,
  lookupPerson,
}: {
  uid: string;
  enabled: boolean;
  lookupPerson: (id: string) => { name: string; photo?: string } | null;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [calls, setCalls] = useState<Call[]>([]);

  useEffect(() => {
    if (!uid || !enabled) return;
    return watchIncoming(
      uid,
      (values) => setCalls(values.filter((c) => Date.now() - c.createdAt < 60000)),
      () => {},
    );
  }, [uid, enabled]);

  useEffect(() => {
    const timers = calls.map((call) =>
      setTimeout(
        () => setCalls((current) => current.filter((item) => item.id !== call.id)),
        Math.max(0, call.createdAt + 60000 - Date.now()),
      ),
    );
    return () => timers.forEach(clearTimeout);
  }, [calls]);

  const call = enabled ? calls.find((c) => c.calleeId === uid) : null;
  if (!call || pathname.startsWith("/call/")) return null;
  const caller = lookupPerson(call.callerId);

  return (
    <View style={[styles.banner, { top: insets.top + spacing.sm }]}>
      <View style={[shared.row, { gap: 12 }]}>
        <MemberPhoto uri={caller?.photo} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={type.headline}>
            {caller?.name || t("Your connection")}
          </Text>
          <Text style={shared.muted}>
            {t(call.mode === "video" ? "Incoming video call" : "Incoming audio call")}
          </Text>
        </View>
      </View>
      <View style={[shared.row, { justifyContent: "flex-end", gap: 8 }]}>
        <Button
          inline
          compact
          variant="destructive"
          onPress={() => {
            void finishCall(call.id, "declined").catch(() => {});
          }}
        >
          {t("Decline")}
        </Button>
        <Button
          inline
          compact
          icon="call-outline"
          onPress={() =>
            router.push({ pathname: "/call/[id]", params: { id: call.id } })
          }
        >
          {t("Open call")}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    maxWidth: 640,
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    gap: 12,
    boxShadow: "0 8px 24px #20251F24",
    zIndex: 50,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
});
