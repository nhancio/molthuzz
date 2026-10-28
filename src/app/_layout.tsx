import React, { useEffect } from "react";
import { Stack } from "expo-router/stack";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import {
  useFonts,
  InstrumentSerif_400Regular,
} from "@expo-google-fonts/instrument-serif";
import { useTranslation } from "react-i18next";
import { LanguageProvider } from "../i18n";
import { MakeInProvider } from "../screens/MakeIn";
import { colors, fonts } from "../theme";

// Keep the native launch screen visible while the bundled brand font loads.
void SplashScreen.preventAutoHideAsync().catch(() => {});

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.ink,
    background: colors.paper,
    card: colors.paper,
    text: colors.ink,
    border: colors.line,
    notification: colors.lime,
  },
};
function Navigation() {
  const { t } = useTranslation();
  return (
    <Stack
      screenOptions={{
        contentStyle: { backgroundColor: colors.paper },
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.serif, fontSize: 24, fontWeight: "400" },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, animation: "none" }}
      />
      <Stack.Screen name="conversation" options={{ title: t("Chats") }} />
    </Stack>
  );
}
export default function Layout() {
  const [fontsLoaded, fontError] = useFonts({
    InstrumentSerif_400Regular,
    ...MaterialIcons.font,
  });
  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);
  // Compose resolves its icon font on first composition, after Expo registers it.
  if (!fontsLoaded && !fontError) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <LanguageProvider>
            <ThemeProvider value={navigationTheme}>
              <StatusBar style="dark" />
              <MakeInProvider>
                <Navigation />
              </MakeInProvider>
            </ThemeProvider>
          </LanguageProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
