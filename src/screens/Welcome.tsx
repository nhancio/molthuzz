import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Badge, Button, Icon, Notice } from "../components/UI";
import { colors, fonts, shared } from "../theme";
const photos = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=700&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=85",
];
export default function Welcome({
  onGoogle,
  onDemo,
  onLegal,
  busy,
  error,
}: {
  onGoogle: () => void;
  onDemo: () => void;
  onLegal: (v: "terms" | "privacy") => void;
  busy: boolean;
  error: string;
}) {
  const { width } = useWindowDimensions();
  const headlineSize = Math.min(76, Math.max(48, (width - 48) * 0.19));
  return (
    <ScrollView
      style={shared.page}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={w.content}
    >
      <View style={w.nav}>
        <Text style={w.logo}>
          makein<Text style={{ color: "#9BB329" }}>✳</Text>
        </Text>
        <Badge>18+ ONLY</Badge>
      </View>
      <View style={w.hero}>
        <View style={[shared.row, { gap: 8, marginBottom: 18 }]}>
          <View style={w.dot} />
          <Text style={[shared.label, { fontSize: 8, letterSpacing: 1.6 }]}>
            GOOD THINGS START WITH HELLO
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          style={[
            w.title,
            { fontSize: headlineSize, lineHeight: headlineSize * 1.03 },
          ]}
        >
          Less scrolling.{"\n"}More{" "}
          <Text style={{ fontStyle: "italic" }}>feeling.</Text>
        </Text>
        <Text
          style={[
            shared.body,
            {
              color: colors.muted,
              fontSize: 16,
              lineHeight: 25,
              marginTop: 20,
            },
          ]}
        >
          Meet someone who makes the everyday feel a little less ordinary.
        </Text>
        <View style={{ marginTop: 26, gap: 12 }}>
          <Button onPress={onGoogle} busy={busy} icon="logo-google">
            Continue with Google
          </Button>
          <Button secondary onPress={onDemo} icon="arrow-forward">
            Explore the demo
          </Button>
          {error ? <Notice text={error} error /> : null}
          <Text
            style={[
              shared.muted,
              {
                fontSize: 11,
                lineHeight: 18,
                textAlign: "center",
                paddingHorizontal: 5,
              },
            ]}
          >
            By continuing, you confirm you’re 18+ and agree to our{" "}
            <Text
              accessibilityRole="link"
              onPress={() => onLegal("terms")}
              style={w.link}
            >
              Terms
            </Text>{" "}
            and{" "}
            <Text
              accessibilityRole="link"
              onPress={() => onLegal("privacy")}
              style={w.link}
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
        <View style={w.collage}>
          <View style={w.circle} />
          <View
            style={[
              w.photo,
              {
                top: 22,
                left: 7,
                width: "57%",
                height: 282,
                transform: [{ rotate: "-7deg" }],
              },
            ]}
          >
            <Image
              source={{ uri: photos[0] }}
              style={StyleSheet.absoluteFill}
            />
            <View style={w.caption}>
              <Text style={w.photoTitle}>
                The good kind{"\n"}of butterflies.
              </Text>
            </View>
          </View>
          <View
            style={[
              w.photo,
              {
                top: 78,
                right: 2,
                width: "45%",
                height: 250,
                transform: [{ rotate: "7deg" }],
              },
            ]}
          >
            <Image
              source={{ uri: photos[1] }}
              style={StyleSheet.absoluteFill}
            />
            <View style={w.caption}>
              <Text style={[w.photoTitle, { fontSize: 24 }]}>
                Something{"\n"}real.
              </Text>
            </View>
          </View>
          <View style={w.hello}>
            <Text
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontSize: 28,
              }}
            >
              oh, hello.
            </Text>
            <Icon name="sparkles-outline" size={21} />
          </View>
        </View>
        <Text
          style={[
            shared.muted,
            { textAlign: "center", fontSize: 8, letterSpacing: 0.8 },
          ]}
        >
          ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES
        </Text>
        <View style={w.footer}>
          <View style={[shared.row, { gap: 8 }]}>
            <Icon name="heart-outline" size={16} />
            <Text style={[shared.muted, { fontSize: 12 }]}>
              Made for connection. Open to possibility.
            </Text>
          </View>
          <Text style={[shared.muted, { fontSize: 11, textAlign: "center" }]}>
            Planned membership: ₹2 first calendar month, then ₹99/month.
            Auto-renews; cancel anytime. Payments are not active yet.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
const w = StyleSheet.create({
  content: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  nav: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  logo: {
    fontFamily: fonts.serif,
    fontSize: 39,
    letterSpacing: -2,
    color: colors.ink,
  },
  hero: { paddingTop: 20 },
  title: { fontFamily: fonts.serif, letterSpacing: -1.8, color: colors.ink },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#6E831D" },
  link: { color: colors.ink, textDecorationLine: "underline" },
  collage: { position: "relative", height: 350, marginTop: 27 },
  circle: {
    position: "absolute",
    width: 270,
    height: 270,
    borderRadius: 150,
    backgroundColor: "#E8EDDA",
    top: 40,
    right: 0,
  },
  photo: {
    position: "absolute",
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 5,
    borderColor: colors.white,
    boxShadow: "0 12px 28px #20241F18",
  },
  caption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    backgroundColor: "#20241F66",
  },
  photoTitle: {
    fontFamily: fonts.serif,
    fontSize: 28,
    lineHeight: 29,
    color: colors.white,
  },
  hello: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: colors.lime,
    paddingHorizontal: 19,
    paddingVertical: 10,
    borderRadius: 35,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    transform: [{ rotate: "6deg" }],
  },
  footer: {
    marginTop: 26,
    paddingTop: 22,
    borderTopWidth: 1,
    borderColor: colors.line,
    alignItems: "center",
    gap: 15,
  },
});
