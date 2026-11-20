import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  AppState,
  Pressable,
  StyleSheet,
  View,
  type ColorValue,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../components/LocalizedText";
import { Icon, type IconName } from "../components/UI";
import { MemberPhoto } from "./Connections";
import { useMakeIn } from "./MakeIn";
import type { Call } from "../lib/contracts";
import { connect } from "../calls/connection";
import { VideoStream } from "../calls/rtc";
import type { Stream } from "../calls/rtc-types";
import { finishCall, watchCall } from "../calls/signaling";
import { colors, fonts, radius, shared, spacing, type } from "../theme";

function CallControl({
  label,
  icon,
  color = "#2A3128",
  disabled,
  onPress,
}: {
  label: string;
  icon: IconName;
  color?: ColorValue;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: "center",
        gap: 8,
        opacity: disabled ? 0.35 : pressed ? 0.65 : 1,
      })}
    >
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: color,
        }}
      >
        <Icon name={icon} color={colors.white} size={26} />
      </View>
      <Text style={[type.caption, { color: "#E7ECE2" }]}>{label}</Text>
    </Pressable>
  );
}

export default function CallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { uid, lookupPerson } = useMakeIn();
  const insets = useSafeAreaInsets();
  const [call, setCall] = useState<Call | null>(null);
  const [ready, setReady] = useState(false);
  const [joined, setJoined] = useState(false);
  const [status, setStatus] = useState("ringing");
  const [error, setError] = useState("");
  const [local, setLocal] = useState<Stream | null>(null);
  const [remote, setRemote] = useState<Stream | null>(null);
  const [muted, setMuted] = useState(false);
  const [camera, setCamera] = useState(true);
  const permissionPending = useRef(false);
  const stopConnection = useRef<(() => void) | null>(null);

  const callId = typeof id === "string" ? id : "";
  const other = call?.callerId === uid ? call?.calleeId : call?.callerId;
  const ended =
    call?.status === "ended" ||
    call?.status === "declined" ||
    status === "ended" ||
    status === "declined";

  useEffect(() => {
    if (!uid || !callId) return;
    return watchCall(
      callId,
      (value) => {
        setCall(value);
        setReady(true);
        if (!value) setError("This call is unavailable.");
      },
      (cause) => {
        setError(cause.message);
        setReady(true);
      },
    );
  }, [callId, uid]);

  const shouldConnect = !!uid && !!call && !ended && (call.callerId === uid || joined);
  useEffect(() => {
    if (!shouldConnect || !uid || !callId) return;
    let active = true;
    const stop = connect(callId, uid, {
      local: setLocal,
      remote: setRemote,
      status: setStatus,
      error: (cause) => setError(cause.message),
      permissionRequest: (pending) => {
        if (active) permissionPending.current = pending;
      },
    });
    stopConnection.current = stop;
    return () => {
      active = false;
      permissionPending.current = false;
      stopConnection.current = null;
      stop();
    };
  }, [callId, uid, shouldConnect]);

  const callCreatedAt = call?.createdAt;
  const callStatus = call?.status;
  useEffect(() => {
    if (!callId || !callCreatedAt || ended || status === "connected") return;
    const deadline = setTimeout(() => {
      setError("The call timed out. Please try again.");
      void finishCall(callId).catch(() => {});
    }, Math.max(0, callCreatedAt + (callStatus === "ringing" ? 60000 : 120000) - Date.now()));
    return () => clearTimeout(deadline);
  }, [callId, callCreatedAt, callStatus, status, ended]);

  useEffect(() => {
    if (!callId) return;
    const subscription = AppState.addEventListener("change", (value) => {
      if (value === "background" && !permissionPending.current) {
        stopConnection.current?.();
        void finishCall(callId).catch(() => {});
        setStatus("ended");
      }
    });
    return () => {
      subscription.remove();
      if (uid) void finishCall(callId).catch(() => {});
    };
  }, [callId, uid]);

  const person = other ? lookupPerson(other) : null;
  const incoming = call?.calleeId === uid;
  const statusText = ended
    ? call?.status === "declined"
      ? "Call declined"
      : "Call ended"
    : status === "connected"
      ? "Connected"
      : incoming && !joined
        ? call?.mode === "video"
          ? "Incoming video call"
          : "Incoming audio call"
        : call?.status === "ringing"
          ? "Calling…"
          : "Connecting…";

  const end = (declined = false) => {
    if (!callId) return;
    void finishCall(callId, declined ? "declined" : "ended").catch((cause) =>
      setError(cause instanceof Error ? cause.message : "Could not end call."),
    );
  };

  if (!uid) return null;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + spacing.lg,
          paddingBottom: Math.max(insets.bottom, spacing.lg),
        },
      ]}
    >
      <StatusBar style="light" />
      {!ready ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.lime} />
          <Text style={styles.muted}>{t("Connecting…")}</Text>
        </View>
      ) : (
        <View style={{ flex: 1, justifyContent: "space-between", gap: spacing.lg }}>
          <View style={{ alignItems: "center", gap: 6 }}>
            <Text accessibilityLiveRegion="polite" style={styles.status}>
              {t(statusText)}
            </Text>
            <Text style={styles.name}>{person?.name || t("Your connection")}</Text>
          </View>

          <View style={styles.center}>
            {call?.mode === "video" && !ended ? (
              <View style={styles.videoFrame}>
                {remote ? (
                  <VideoStream stream={remote} />
                ) : (
                  <View style={styles.center}>
                    <MemberPhoto uri={person?.photo} style={styles.avatar} />
                    <Text style={styles.muted}>{t("Waiting for video")}</Text>
                  </View>
                )}
                {local ? (
                  <View style={styles.pip}>
                    <VideoStream stream={local} local />
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.center}>
                <MemberPhoto uri={person?.photo} style={styles.avatarLarge} />
                {error ? (
                  <Text selectable accessibilityRole="alert" style={styles.error}>
                    {error}
                  </Text>
                ) : null}
              </View>
            )}
          </View>

          <View style={{ alignItems: "center", gap: spacing.lg }}>
            {!ended && incoming && !joined ? (
              <View style={[shared.row, { gap: 36 }]}>
                <CallControl
                  label={t("Decline")}
                  icon="call-end"
                  color={colors.red}
                  onPress={() => end(true)}
                />
                <CallControl
                  label={t("Accept")}
                  icon="call-outline"
                  color="#2D7A4D"
                  onPress={() => setJoined(true)}
                />
              </View>
            ) : !ended && call ? (
              <View style={[shared.row, { justifyContent: "center", gap: 24 }]}>
                <CallControl
                  label={t(muted ? "Unmute" : "Mute")}
                  icon={muted ? "mic-off-outline" : "mic-outline"}
                  disabled={!local}
                  onPress={() => {
                    local?.getAudioTracks().forEach((track) => {
                      track.enabled = muted;
                    });
                    setMuted(!muted);
                  }}
                />
                {call.mode === "video" ? (
                  <CallControl
                    label={t(camera ? "Camera off" : "Camera on")}
                    icon={camera ? "videocam-outline" : "videocam-off-outline"}
                    disabled={!local}
                    onPress={() => {
                      local?.getVideoTracks().forEach((track) => {
                        track.enabled = !camera;
                      });
                      setCamera(!camera);
                    }}
                  />
                ) : null}
                <CallControl
                  label={t("End")}
                  icon="call-end"
                  color={colors.red}
                  onPress={() => end()}
                />
              </View>
            ) : (
              <CallControl
                label={t("Close")}
                icon="close"
                onPress={() => {
                  if (router.canGoBack()) router.back();
                  else router.replace("/(tabs)/connections");
                }}
              />
            )}
            <Text style={[styles.muted, { fontSize: 12, textAlign: "center" }]}>
              {t("Leave whenever you want. MakeIn does not record calls.")}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#141814",
    paddingHorizontal: spacing.inset,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.lime,
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 32,
    lineHeight: 36,
    color: colors.white,
  },
  muted: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#B6BEB2",
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#F8B4AE",
    textAlign: "center",
  },
  videoFrame: {
    width: "100%",
    maxWidth: 700,
    flex: 1,
    maxHeight: 580,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "#0B0E0B",
  },
  pip: {
    position: "absolute",
    bottom: 14,
    right: 14,
    width: 96,
    height: 132,
    borderRadius: radius.md,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "#1F261F",
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarLarge: {
    width: 132,
    height: 132,
    borderRadius: 66,
  },
});
