import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
import React, { useRef, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Image } from "expo-image";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LanguagePicker } from "../components/LanguagePicker";
import * as ImagePicker from "expo-image-picker";
import { Badge, Button, Chips, Field, Icon, Notice } from "../components/UI";
import { colors, fonts, shared } from "../theme";
import { ageFromBirthDate, validateProfile } from "../lib/model";
import { uploadPhoto } from "../lib/data";
import type { ProfileInput, Gender, Intent } from "../lib/contracts";
const genders: Gender[] = ["Woman", "Man", "Non-binary"];
const intents: Intent[] = [
  "A relationship",
  "Something casual",
  "Figuring it out",
];
const interests = [
  "Coffee walks",
  "Live music",
  "Travel",
  "Good food",
  "Art & design",
  "Books",
  "Fitness",
  "Cinema",
  "Nature",
  "Cooking",
  "Pets",
  "Photography",
  "Dancing",
  "Gaming",
  "Mindfulness",
];
const steps = [
  ["What should we call you?", "First names. Fresh starts."],
  ["A little about your age.", "MakeIn is for adults aged 18 and over."],
  ["You, in your own words.", "Choose the gender that feels right for you."],
  ["Who catches your eye?", "You can select more than one."],
  [
    "Where’s your everyday?",
    "A city is enough. Never share your exact address.",
  ],
  ["What are you looking for?", "Being on the same page is a lovely start."],
  ["Find your common ground.", "Pick a few things that make you, you."],
  [
    "A little personality, please.",
    "A tiny introduction. A big first impression.",
  ],
  ["Put a face to the hello.", "Add at least one photo of yourself."],
  ["Leave a conversation starter.", "Give someone an easy way to say hello."],
];
export default function Onboarding({
  initial,
  uid,
  demo,
  editing,
  onSave,
  onExit,
  busy,
}: {
  initial: ProfileInput;
  uid?: string;
  demo: boolean;
  editing?: boolean;
  onSave: (p: ProfileInput) => Promise<void>;
  onExit: () => void;
  busy: boolean;
}) {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [value, setValue] = useState<ProfileInput>({
    ...initial,
    interests: [...initial.interests],
    photos: [...initial.photos],
    prompts: [...initial.prompts],
  });
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [url, setUrl] = useState("");
  const [showPhotoUrl, setShowPhotoUrl] = useState(demo);
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateDraft, setDateDraft] = useState(new Date(2000, 0, 1));
  const today = new Date();
  const latestBirthDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const earliestBirthDate = new Date(today.getFullYear() - 101, today.getMonth(), today.getDate() + 1);
  const dateString = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  function openBirthDate() {
    const parsed = new Date(`${value.birthDate}T00:00:00`);
    setDateDraft(Number.isFinite(parsed.getTime()) && parsed >= earliestBirthDate && parsed <= latestBirthDate
      ? parsed
      : new Date(2000, 0, 1));
    setShowDatePicker(true);
  }
  function acceptBirthDate(date: Date) {
    set("birthDate", dateString(date));
    setShowDatePicker(false);
  }
  const set = (key: keyof ProfileInput, v: any) => {
    setValue((p) => ({ ...p, [key]: v }));
    setError("");
  };
  const addUrl = () => {
    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== "https:") throw Error();
      set("photos", [...value.photos, parsed.href].slice(0, 6));
      setUrl("");
    } catch {
      setError("Enter a complete, publicly accessible HTTPS image URL.");
    }
  };
  async function pick() {
    if (uploading || busy) return;
    setUploading(true);
    setError("");
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        throw Error(
          "Allow photo access to select a photo, or add an HTTPS image URL below.",
        );
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.85,
      });
      if (!result.canceled) {
        if (demo)
          throw Error(
            "Demo mode does not upload personal photos. Use an HTTPS image URL to preview a photo.",
          );
        if (!uid) throw Error("Sign in before uploading a photo.");
        const photo = await uploadPhoto(uid, result.assets[0].uri);
        set("photos", [...value.photos, photo].slice(0, 6));
      }
    } catch (e) {
      setShowPhotoUrl(true);
      setError(
        e instanceof Error
          ? e.message
          : "Photo upload is unavailable. You can add an HTTPS image URL below.",
      );
    } finally {
      setUploading(false);
    }
  }
  function stepError() {
    switch (step) {
      case 0:
        return value.name.trim().length < 2
          ? "Enter your first name (at least 2 letters)."
          : "";
      case 1: {
        const age = ageFromBirthDate(value.birthDate);
        return !/^\d{4}-\d{2}-\d{2}$/.test(value.birthDate) ||
          !Number.isFinite(age) ||
          age < 18 ||
          age > 100
          ? "Enter a valid birth date as YYYY-MM-DD. You must be 18–100."
          : "";
      }
      case 2:
        return !value.gender ? "Choose your gender." : "";
      case 3:
        return !value.interestedIn.length
          ? "Select at least one gender you’d like to meet."
          : "";
      case 4:
        return value.location.trim().length < 2 ? "Add your city." : "";
      case 6:
        return !value.interests.length ? "Choose at least one interest." : "";
      case 7:
        return value.bio.trim().length < 10
          ? "Tell us a little more (at least 10 characters)."
          : "";
      case 8:
        return !value.photos.length
          ? "Add at least one HTTPS photo or upload a photo."
          : "";
      default:
        return "";
    }
  }
  async function next() {
    if (busy || uploading) return;
    const err = stepError();
    if (err) return setError(err);
    if (step < steps.length - 1) {
      setStep((x) => x + 1);
      setError("");
      scroll.current?.scrollTo({ y: 0, animated: false });
    } else {
      const normalized: ProfileInput = {
        ...value,
        prompts: value.prompts
          .filter((prompt) => prompt.question.trim() || prompt.answer.trim())
          .map((prompt) => ({
            question: prompt.question.trim() || t("My perfect Sunday looks like…"),
            answer: prompt.answer.trim(),
          })),
      };
      const invalid = validateProfile(normalized);
      if (invalid) return setError(invalid);
      try {
        await onSave(normalized);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not save. Please try again.",
        );
      }
    }
  }
  return (
    <KeyboardAvoidingView style={shared.page} behavior="padding" automaticOffset>
      <View style={{
        paddingHorizontal: 20,
        paddingTop: insets.top + 6,
        paddingBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}>
        <Pressable
          onPress={onExit}
          disabled={busy || uploading}
          accessibilityRole="button"
          accessibilityLabel={t("Exit profile setup")}
          accessibilityState={{ disabled: busy || uploading }}
          style={{ minWidth: 48, minHeight: 48, justifyContent: "center", alignItems: "center", borderRadius: 24, backgroundColor: colors.soft }}
        >
          <Icon name="close" size={21} />
        </Pressable>
        <Text style={{ fontFamily: fonts.serif, fontSize: 30, letterSpacing: -1, color: colors.ink }}>makein✳</Text>
        <LanguagePicker compact />
      </View>
      <ScrollView
        ref={scroll}
        onContentSizeChange={() => {
          if (error) scroll.current?.scrollToEnd({ animated: false });
        }}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ width: "100%", maxWidth: 540, alignSelf: "center", paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24 }}
      >
        <Badge>
          {demo ? t("DEMO PROFILE") : editing ? t("YOUR PROFILE") : t("YOUR NEXT CHAPTER")}
        </Badge>
        <View style={{ flexDirection: "row", gap: 5, marginTop: 22 }} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: 10, now: step + 1 }}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={{ height: 4, borderRadius: 2, flex: 1, backgroundColor: i <= step ? colors.ink : colors.line }}
            />
          ))}
        </View>
        <Text style={[shared.label, { marginTop: 22, marginBottom: 14, letterSpacing: 1 }]}>
          {t("A LITTLE ABOUT YOU · {{step}} / 10", {
            step: String(step + 1).padStart(2, "0"),
          })}
        </Text>
        <Text accessibilityRole="header" style={[shared.heading, { fontSize: 32, lineHeight: 38 }]}>
          {t(steps[step][0])}
        </Text>
        <Text
          style={[
            shared.muted,
            { marginTop: 10, marginBottom: 26, fontSize: 15, lineHeight: 23 },
          ]}
        >
          {t(steps[step][1])}
        </Text>
        <View style={{ gap: 20 }}>
          {step === 0 && (
            <Field
              label={t("First name")}
              value={value.name}
              onChangeText={(v) => set("name", v)}
              placeholder={t("Your first name")}
              maxLength={40}
              autoCapitalize="words"
            />
          )}
          {step === 1 && (
            <>
              <View style={{ gap: 12, padding: 18, borderRadius: 20, borderCurve: "continuous", backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line }}>
                <Text style={shared.muted}>{t("Date of birth · YYYY-MM-DD")}</Text>
                <Button secondary onPress={openBirthDate}>
                  {value.birthDate || t("Date of birth · YYYY-MM-DD")}
                </Button>
                {showDatePicker && (
                  <>
                    <DateTimePicker
                      value={dateDraft}
                      mode="date"
                      themeVariant="light"
                      display={process.env.EXPO_OS === "ios" ? "spinner" : "default"}
                      minimumDate={earliestBirthDate}
                      maximumDate={latestBirthDate}
                      locale={i18n.resolvedLanguage}
                      positiveButton={{ label: t("Done") }}
                      negativeButton={{ label: t("Back") }}
                      onDismiss={() => setShowDatePicker(false)}
                      onValueChange={(_, date) => {
                        if (process.env.EXPO_OS === "android") acceptBirthDate(date);
                        else setDateDraft(date);
                      }}
                    />
                    {process.env.EXPO_OS !== "android" && (
                      <Button compact onPress={() => acceptBirthDate(dateDraft)}>{t("Done")}</Button>
                    )}
                  </>
                )}
              </View>
              <Notice
                text={t(
                  "Your birth date stays private. Only your age appears on your profile.",
                )}
              />
            </>
          )}
          {step === 2 && (
            <Chips
              values={genders}
              selected={[value.gender]}
              onChange={(v) => set("gender", v[0])}
            />
          )}
          {step === 3 && (
            <Chips
              values={genders}
              selected={value.interestedIn}
              onChange={(v) => set("interestedIn", v)}
              multiple
            />
          )}
          {step === 4 && (
            <Field
              label={t("City")}
              value={value.location}
              onChangeText={(v) => set("location", v)}
              placeholder={t("e.g. Bengaluru")}
              maxLength={80}
            />
          )}
          {step === 5 && (
            <Chips
              values={intents}
              selected={[value.intent]}
              onChange={(v) => set("intent", v[0])}
            />
          )}
          {step === 6 && (
            <Chips
              values={interests}
              selected={value.interests}
              onChange={(v) => set("interests", v.slice(0, 8))}
              multiple
            />
          )}
          {step === 7 && (
            <>
              <Field
                label={t("Your bio")}
                value={value.bio}
                onChangeText={(v) => set("bio", v)}
                placeholder={t(
                  "Usually planning a weekend escape or hunting for the city’s best dosa…",
                )}
                multiline
                maxLength={500}
              />
              <Text style={shared.muted}>{value.bio.length}/500</Text>
            </>
          )}
          {step === 8 && (
            <>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {value.photos.map((photo, i) => (
                  <View key={`${photo}-${i}`}>
                    <Image
                      source={{ uri: photo }}
                      contentFit="cover"
                      style={{
                        width: 96,
                        height: 124,
                        borderRadius: 14,
                        backgroundColor: colors.soft,
                      }}
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t("Remove photo {{number}}", {
                        number: i + 1,
                      })}
                      onPress={() =>
                        set(
                          "photos",
                          value.photos.filter((_, n) => n !== i),
                        )
                      }
                      disabled={uploading || busy}
                      style={{ position: "absolute", top: 4, right: 4, backgroundColor: colors.paper, width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" }}
                    >
                      <Icon name="close" size={19} />
                    </Pressable>
                  </View>
                ))}
              </View>
              {value.photos.length < 6 && (
                <>
                  {!demo && (
                    <Button
                      secondary
                      icon="image-outline"
                      onPress={pick}
                      busy={uploading}
                    >
                      {t("Choose a photo")}
                    </Button>
                  )}
                  {!showPhotoUrl && (
                    <Button secondary compact onPress={() => setShowPhotoUrl(true)}>{t("HTTPS photo URL")}</Button>
                  )}
                  {showPhotoUrl && (
                    <View style={{ gap: 16 }}>
                  <Text style={shared.muted}>
                    {demo
                      ? t(
                          "Demo mode does not upload personal photos. Add a persistent HTTPS image URL to try a different photo.",
                        )
                      : t(
                          "Photo uploads need Firebase Storage. If uploads are unavailable, add a persistent HTTPS image URL below. Your selected photo is saved only after a successful upload.",
                        )}
                  </Text>
                  <Field
                    label={t("HTTPS photo URL")}
                    placeholder="https://…"
                    value={url}
                    autoCapitalize="none"
                    onChangeText={setUrl}
                  />
                  <Button
                    secondary
                    compact
                    onPress={addUrl}
                    disabled={!url.trim() || uploading || busy}
                  >
                    {t("Add photo URL")}
                  </Button>
                    </View>
                  )}
                </>
              )}
            </>
          )}
          {step === 9 && (
            <>
              <Field
                label={t("Prompt")}
                value={value.prompts[0]?.question || ""}
                onChangeText={(v) =>
                  set("prompts", [
                    { question: v, answer: value.prompts[0]?.answer || "" },
                  ])
                }
                placeholder={t("My perfect Sunday looks like…")}
                maxLength={100}
              />
              <Field
                label={t("Your answer")}
                value={value.prompts[0]?.answer || ""}
                onChangeText={(v) =>
                  set("prompts", [
                    {
                      question: value.prompts[0]?.question || "",
                      answer: v,
                    },
                  ])
                }
                placeholder={t(
                  "Slow coffee, a bookstore, and absolutely no alarms.",
                )}
                multiline
                maxLength={200}
              />
              <Text style={shared.muted}>
                {t("Optional. A good story beats a perfect answer.")}
              </Text>
            </>
          )}
        </View>
        {error ? (
          <View style={{ marginTop: 20 }}>
            <Notice error text={error} />
          </View>
        ) : null}
      </ScrollView>
      <View style={{ borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.paper, paddingHorizontal: 20, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 14) }}>
        <View style={[shared.row, { width: "100%", maxWidth: 540, alignSelf: "center", gap: 12 }]}>
          {step > 0 && (
            <Button
              secondary
              compact
              disabled={busy || uploading}
              onPress={() => {
                setStep((x) => x - 1);
                setError("");
                setShowDatePicker(false);
                scroll.current?.scrollTo({ y: 0, animated: false });
              }}
            >
              {t("Back")}
            </Button>
          )}
          <View style={{ flex: 1 }}>
            <Button
              onPress={next}
              busy={busy}
              disabled={uploading || showDatePicker}
              icon={step === 9 ? "checkmark" : "arrow-forward"}
            >
              {step === 9
                ? editing
                  ? t("Save profile")
                  : t("Let’s make a connection")
                : t("Continue")}
            </Button>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
