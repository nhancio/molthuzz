import React from "react";
import { Stack } from "expo-router/stack";
import { DefaultTheme, ThemeProvider } from "expo-router/react-navigation";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  useFonts,
  InstrumentSerif_400Regular,
} from "@expo-google-fonts/instrument-serif";
import { useTranslation } from "react-i18next";
import { LanguageProvider } from "../i18n";
import { MakeInProvider } from "../screens/MakeIn";
import { colors } from "../theme";

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
  useFonts({ InstrumentSerif_400Regular });
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
