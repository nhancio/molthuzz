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
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=700&auto=format&fit=crop&q=85",
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
  const wide = width >= 900;
  return (
    <ScrollView
      style={shared.page}
      contentContainerStyle={{ minHeight: "100%" }}
    >
      <View style={[w.nav, { paddingHorizontal: wide ? 70 : 25 }]}>
        <Text style={w.logo}>
          makein<Text style={{ color: "#9BB329" }}>✳</Text>
        </Text>
        <View style={[shared.row, { gap: 23 }]}>
          {wide && (
            <Text style={shared.muted}>A little spark. A real connection.</Text>
          )}
          <Badge>18+ ONLY</Badge>
        </View>
      </View>
      <View
        style={[
          w.hero,
          wide
            ? { flexDirection: "row", paddingHorizontal: 70, paddingTop: 50 }
            : { paddingHorizontal: 25, paddingTop: 28 },
        ]}
      >
        <View
          style={{
            width: wide ? "48%" : "100%",
            paddingTop: wide ? 38 : 0,
            zIndex: 2,
          }}
        >
          <View style={[shared.row, { gap: 10, marginBottom: 25 }]}>
            <View style={w.dot} />
            <Text style={shared.label}>GOOD THINGS START WITH HELLO</Text>
          </View>
          <Text
            style={[
              w.title,
              { fontSize: wide ? 105 : 71, lineHeight: wide ? 104 : 73 },
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
                fontSize: 17,
                lineHeight: 27,
                maxWidth: 355,
                marginTop: 25,
              },
            ]}
          >
            Meet someone who makes the everyday feel a little less ordinary.
          </Text>
          <View style={{ marginTop: 35, maxWidth: 337, gap: 12 }}>
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
                  paddingHorizontal: 8,
                },
              ]}
            >
              By continuing, you confirm you’re 18+ and agree to our{" "}
              <Text onPress={() => onLegal("terms")} style={w.link}>
                Terms
              </Text>{" "}
              and{" "}
              <Text onPress={() => onLegal("privacy")} style={w.link}>
                Privacy Policy
              </Text>
              .
            </Text>
          </View>
          <View style={[shared.row, { gap: 10, marginTop: 34 }]}>
            <Icon name="heart-outline" size={17} />
            <Text style={[shared.muted, { fontSize: 12 }]}>
              Made for connection. Open to possibility.
            </Text>
          </View>
        </View>
        <View
          style={[
            w.collage,
            {
              width: wide ? "52%" : "100%",
              height: wide ? 620 : 490,
              marginTop: wide ? 0 : 35,
            },
          ]}
        >
          <View
            style={[
              w.circle,
              {
                width: wide ? 460 : 320,
                height: wide ? 460 : 320,
                top: 60,
                right: -10,
              },
            ]}
          />
          <View
            style={[
              w.photo,
              {
                top: 35,
                left: wide ? 7 : 3,
                width: wide ? "56%" : "57%",
                height: wide ? 400 : 332,
                transform: [{ rotate: "-8deg" }],
              },
            ]}
          >
            <Image
              source={{ uri: photos[0] }}
              style={StyleSheet.absoluteFill}
            />
            <View style={w.photoCaption}>
              <Text style={w.name}>The good kind{"\n"}of butterflies.</Text>
              <Text style={w.photoLabel}>FIND YOUR KIND OF PERSON</Text>
            </View>
          </View>
          <View
            style={[
              w.photo,
              {
                top: wide ? 155 : 130,
                right: 0,
                width: "46%",
                height: wide ? 350 : 292,
                transform: [{ rotate: "8deg" }],
              },
            ]}
          >
            <Image
              source={{ uri: photos[1] }}
              style={StyleSheet.absoluteFill}
            />
            <View style={w.photoCaption}>
              <Text style={[w.name, { fontSize: 27 }]}>
                Something{"\n"}real.
              </Text>
            </View>
          </View>
          <View style={[w.hello, { top: wide ? 39 : 7, right: 0 }]}>
            <Text
              style={{
                fontFamily: fonts.serif,
                fontStyle: "italic",
                fontSize: 34,
              }}
            >
              oh, hello.
            </Text>
            <Icon name="sparkles-outline" size={25} />
          </View>
          <View
            style={[
              w.floating,
              { bottom: wide ? 76 : 20, left: wide ? 16 : 10 },
            ]}
          >
            <View style={w.heart}>
              <Icon name="heart" size={22} />
            </View>
            <View>
              <Text style={{ fontFamily: fonts.semi, fontSize: 13 }}>
                Your next chapter starts here.
              </Text>
              <Text style={[shared.muted, { fontSize: 11 }]}>
                A hello can change everything.
              </Text>
            </View>
          </View>
          <Text style={[w.example, { bottom: wide ? 36 : 0 }]}>
            ILLUSTRATIVE PHOTOGRAPHY · NOT MEMBER PROFILES
          </Text>
        </View>
      </View>
      <View style={[w.footer, { marginHorizontal: wide ? 70 : 25 }]}>
        <Text style={shared.label}>REAL INTENTIONS. FRESH BEGINNINGS.</Text>
        <Text style={[shared.muted, { fontSize: 11 }]}>
          ₹2 first calendar month. Then ₹99/month. Auto-renews; cancel anytime.
        </Text>
      </View>
    </ScrollView>
  );
}
const w = StyleSheet.create({
  nav: {
    height: 106,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: {
    fontFamily: fonts.serif,
    fontSize: 43,
    letterSpacing: -2,
    color: colors.ink,
  },
  hero: { maxWidth: 1510, alignSelf: "center", width: "100%" },
  title: { fontFamily: fonts.serif, letterSpacing: -3, color: colors.ink },
  dot: { width: 7, height: 7, borderRadius: 5, backgroundColor: "#6E831D" },
  link: { color: colors.ink, textDecorationLine: "underline" },
  collage: { position: "relative" },
  circle: {
    position: "absolute",
    borderRadius: 300,
    backgroundColor: "#E8EDDA",
  },
  photo: {
    position: "absolute",
    borderRadius: 19,
    overflow: "hidden",
    borderWidth: 6,
    borderColor: colors.white,
    boxShadow: "0 18px 45px #20241F1A",
  },
  photoCaption: {
    position: "absolute",
    bottom: 0,
    padding: 20,
    left: 0,
    right: 0,
    backgroundColor: "#20241F55",
  },
  name: {
    fontFamily: fonts.serif,
    fontSize: 35,
    lineHeight: 35,
    color: colors.white,
  },
  photoLabel: {
    fontFamily: fonts.bold,
    letterSpacing: 1.6,
    color: colors.white,
    fontSize: 7,
    marginTop: 12,
  },
  hello: {
    position: "absolute",
    backgroundColor: colors.lime,
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    transform: [{ rotate: "7deg" }],
  },
  floating: {
    position: "absolute",
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 8px 40px #20241F12",
  },
  heart: {
    backgroundColor: colors.lime,
    width: 44,
    height: 44,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  example: {
    position: "absolute",
    right: 0,
    fontFamily: fonts.medium,
    fontSize: 8,
    letterSpacing: 1,
    color: colors.muted,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: colors.line,
    paddingVertical: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 10,
  },
});
