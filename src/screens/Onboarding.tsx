import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Keyboard,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  type KeyboardAwareScrollViewRef,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "../components/LocalizedText";
import { LanguagePicker } from "../components/LanguagePicker";
import { BrandMark } from "../components/brand-mark";
import {
  Badge,
  Button,
  Chips,
  Field,
  IconButton,
  Notice,
} from "../components/UI";
import { colors, fonts, shared } from "../theme";
import { uploadPhoto } from "../lib/data";
import type { ProfileInput, Gender, Intent } from "../lib/contracts";
import { setupBackAction } from "./setup-back";
import {
  makeMainPhoto,
  profileFormError,
  type ProfileField,
  type ProfileFormError,
} from "./profile-form";
import {
  remainingPhotoSlots,
  uploadSelectedPhotos,
  type SelectedPhoto,
} from "./photo-batch";

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
const uploadFailure =
  "We couldn’t upload this photo. Check your connection and try again.";
const prepareFailure = "We couldn’t prepare this photo. Choose another image.";
const batchFailure =
  "Some photos could not be uploaded. Your uploaded photos are kept. Try the remaining photos again.";

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
  const scroll = useRef<KeyboardAwareScrollViewRef>(null);
  const positions = useRef<Partial<Record<ProfileField, number>>>({});
  const operation = useRef<"save" | "photos" | null>(null);
  const nextPhotoId = useRef(0);
  const [value, setValue] = useState<ProfileInput>(() => ({
    ...initial,
    interests: [...initial.interests],
    photos: [...initial.photos],
    prompts: initial.prompts.map((prompt) => ({ ...prompt })),
  }));
  const valueRef = useRef(value);
  const [gallery, setGallery] = useState<SelectedPhoto[]>(() =>
    initial.photos.map((url, index) => ({
      id: `stored-${index}`,
      uri: url,
      url,
    })),
  );
  const galleryRef = useRef(gallery);
  const [error, setError] = useState<ProfileFormError | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [footerHeight, setFooterHeight] = useState(88);
  const [url, setUrl] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateDraft, setDateDraft] = useState(() => {
    const date = new Date(`${initial.birthDate}T00:00:00`);
    return Number.isFinite(date.getTime()) ? date : new Date(2000, 0, 1);
  });
  const working = busy || uploading || saving;
  const unresolved = gallery.filter((photo) => !photo.url);
  const availableSlots = remainingPhotoSlots(
    value.photos.length,
    unresolved.length,
  );
  const mainPhotoId = gallery.find((photo) => photo.url)?.id;

  const goBack = useCallback(() => {
    switch (
      setupBackAction({
        busy: busy || operation.current === "save",
        uploading: uploading || operation.current === "photos",
        datePickerOpen: showDatePicker,
      })
    ) {
      case "stay":
        break;
      case "dismiss-date":
        setShowDatePicker(false);
        break;
      case "exit":
        onExit();
        break;
    }
    return true;
  }, [busy, uploading, showDatePicker, onExit]);
  useEffect(() => {
    if (process.env.EXPO_OS !== "android") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      goBack,
    );
    return () => subscription.remove();
  }, [goBack]);

  function writeValue(update: (current: ProfileInput) => ProfileInput) {
    const next = update(valueRef.current);
    valueRef.current = next;
    setValue(next);
    setError(null);
    setSaveError("");
  }
  function change<K extends keyof ProfileInput>(key: K, next: ProfileInput[K]) {
    if (busy || operation.current === "save") return;
    writeValue((current) => ({ ...current, [key]: next }));
  }
  function changeGallery(
    update: (current: SelectedPhoto[]) => SelectedPhoto[],
  ) {
    const next = update(galleryRef.current);
    galleryRef.current = next;
    setGallery(next);
    writeValue((current) => ({
      ...current,
      photos: next.flatMap((photo) => (photo.url ? [photo.url] : [])),
    }));
  }
  function locate(field: ProfileField) {
    Keyboard.dismiss();
    scroll.current?.scrollTo({
      y: Math.max(0, (positions.current[field] ?? 0) - 16),
      animated: false,
    });
  }
  function recordSectionLayout(field: ProfileField, event: LayoutChangeEvent) {
    positions.current[field] = event.nativeEvent.layout.y;
  }
  function inlineError(field: ProfileField) {
    return error?.field === field ? (
      <Notice error text={error.message} />
    ) : null;
  }
  const today = new Date();
  const latestBirthDate = new Date(
    today.getFullYear() - 18,
    today.getMonth(),
    today.getDate(),
  );
  const earliestBirthDate = new Date(
    today.getFullYear() - 101,
    today.getMonth(),
    today.getDate() + 1,
  );
  function openBirthDate() {
    if (working || operation.current) return;
    Keyboard.dismiss();
    const parsed = new Date(`${valueRef.current.birthDate}T00:00:00`);
    setDateDraft(
      Number.isFinite(parsed.getTime()) &&
        parsed >= earliestBirthDate &&
        parsed <= latestBirthDate
        ? parsed
        : new Date(2000, 0, 1),
    );
    setShowDatePicker(true);
  }
  function acceptBirthDate(date: Date) {
    setDateDraft(date);
    change(
      "birthDate",
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
    );
    setShowDatePicker(false);
  }
  async function processPhotos(photos: SelectedPhoto[]) {
    await uploadSelectedPhotos(photos, {
      upload: (photo) => uploadPhoto(uid!, photo.uri),
      onProgress: (current, total) => setUploadProgress({ current, total }),
      onUploaded: (photo, uploadedUrl) =>
        changeGallery((current) =>
          current.map((entry) =>
            entry.id === photo.id
              ? { ...entry, url: uploadedUrl, error: undefined }
              : entry,
          ),
        ),
      onFailed: (photo, failure) => {
        const message =
          failure instanceof Error && failure.message === prepareFailure
            ? prepareFailure
            : uploadFailure;
        changeGallery((current) =>
          current.map((entry) =>
            entry.id === photo.id ? { ...entry, error: message } : entry,
          ),
        );
      },
    });
    setPhotoError(
      galleryRef.current.some((photo) => !photo.url) ? batchFailure : "",
    );
  }
  async function pick() {
    if (operation.current || busy || demo || !uid) return;
    const slots = remainingPhotoSlots(
      valueRef.current.photos.length,
      galleryRef.current.filter((photo) => !photo.url).length,
    );
    if (!slots) return;
    operation.current = "photos";
    setUploading(true);
    setPhotoError("");
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setPhotoError("Allow photo access in Settings to add your photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        allowsEditing: false,
        orderedSelection: true,
        selectionLimit: slots,
        quality: 1,
      });
      if (result.canceled) return;
      const selections = result.assets.slice(0, slots).map((asset) => ({
        id: `selected-${nextPhotoId.current++}`,
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
      }));
      changeGallery((current) => [...current, ...selections]);
      await processPhotos(selections);
    } catch {
      setPhotoError(uploadFailure);
    } finally {
      setUploadProgress(null);
      setUploading(false);
      operation.current = null;
    }
  }
  async function retryPhotos() {
    if (operation.current || busy || !uid) return;
    const remaining = galleryRef.current.filter((photo) => !photo.url);
    if (!remaining.length) return;
    operation.current = "photos";
    setUploading(true);
    setPhotoError("");
    try {
      await processPhotos(remaining);
    } finally {
      setUploadProgress(null);
      setUploading(false);
      operation.current = null;
    }
  }
  function removePhoto(id: string) {
    if (operation.current || busy) return;
    changeGallery((current) => current.filter((photo) => photo.id !== id));
    if (!galleryRef.current.some((photo) => !photo.url)) setPhotoError("");
  }
  function chooseMain(index: number) {
    if (operation.current || busy) return;
    changeGallery((current) => makeMainPhoto(current, index));
  }
  function addDemoUrl() {
    if (!demo || operation.current || busy) return;
    try {
      const parsed = new URL(url.trim());
      if (
        parsed.protocol !== "https:" ||
        !availableSlots ||
        parsed.username ||
        parsed.password
      )
        throw Error();
      changeGallery((current) => [
        ...current,
        {
          id: `demo-${nextPhotoId.current++}`,
          uri: parsed.href,
          url: parsed.href,
        },
      ]);
      setUrl("");
    } catch {
      setPhotoError("Enter a complete, publicly accessible HTTPS image URL.");
    }
  }
  function changePrompt(
    index: number,
    key: "question" | "answer",
    text: string,
  ) {
    const prompts = valueRef.current.prompts.map((prompt) => ({ ...prompt }));
    while (prompts.length <= index) prompts.push({ question: "", answer: "" });
    prompts[index][key] = text;
    change("prompts", prompts);
  }
  async function save() {
    if (operation.current || busy || showDatePicker) return;
    operation.current = "save";
    const normalized: ProfileInput = {
      ...valueRef.current,
      prompts: valueRef.current.prompts
        .filter((prompt) => prompt.question.trim() || prompt.answer.trim())
        .map((prompt) => ({
          question:
            prompt.question.trim() || t("My perfect Sunday looks like…"),
          answer: prompt.answer.trim(),
        })),
    };
    const invalid = profileFormError(
      normalized,
      galleryRef.current.filter((photo) => !photo.url).length,
    );
    if (invalid) {
      setError(invalid);
      locate(invalid.field);
      operation.current = null;
      return;
    }
    setSaving(true);
    setError(null);
    setSaveError("");
    try {
      await onSave(normalized);
    } catch (failure) {
      setSaveError(
        failure instanceof Error
          ? failure.message
          : "Could not save. Please try again.",
      );
    } finally {
      setSaving(false);
      operation.current = null;
    }
  }

  const section = { gap: 12, paddingTop: 4, paddingBottom: 6 };
  const sectionTitle = {
    fontFamily: fonts.semi,
    fontWeight: "600" as const,
    fontSize: 17,
    lineHeight: 25,
    color: colors.ink,
  };
  return (
    <View style={shared.page}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 6,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <IconButton
          onPress={goBack}
          disabled={working}
          label={t("Exit profile setup")}
          icon="close"
          size={22}
        />
        <BrandMark size={28} />
        <LanguagePicker compact />
      </View>
      <KeyboardAwareScrollView
        ref={scroll}
        onContentSizeChange={() => {
          if (error) locate(error.field);
        }}
        style={{ flex: 1 }}
        bottomOffset={footerHeight + 12}
        extraKeyboardSpace={footerHeight}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          width: "100%",
          maxWidth: 540,
          alignSelf: "center",
          paddingHorizontal: 22,
          paddingTop: 12,
          paddingBottom: footerHeight + 28,
          gap: 22,
        }}
      >
        <View style={{ gap: 10 }}>
          <Badge>{demo ? t("DEMO PROFILE") : t("YOUR PROFILE")}</Badge>
          <Text
            accessibilityRole="header"
            style={{
              fontFamily: fonts.semi,
              fontWeight: "600",
              fontSize: 26,
              lineHeight: 34,
              color: colors.ink,
            }}
          >
            {editing ? t("Edit profile") : t("Create your profile")}
          </Text>
          <Text style={shared.muted}>{t("First names. Fresh starts.")}</Text>
        </View>
        <View
          onLayout={(event) => recordSectionLayout("name", event)}
          style={section}
        >
          <Field
            label={t("First name")}
            value={value.name}
            onChangeText={(text) => change("name", text)}
            placeholder={t("Your first name")}
            maxLength={40}
            autoCapitalize="words"
            editable={!busy && !saving}
          />
          {inlineError("name")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("birthDate", event)}
          style={section}
        >
          <Text style={sectionTitle}>{t("Date of birth")}</Text>
          {process.env.EXPO_OS === "android" && (
            <Button secondary onPress={openBirthDate} disabled={working}>
              {value.birthDate || t("Date of birth")}
            </Button>
          )}
          {(process.env.EXPO_OS === "ios" || showDatePicker) && (
            <View style={{ gap: 12 }}>
              <DateTimePicker
                value={dateDraft}
                disabled={working}
                mode="date"
                themeVariant="light"
                display={process.env.EXPO_OS === "ios" ? "spinner" : "default"}
                minimumDate={earliestBirthDate}
                maximumDate={latestBirthDate}
                locale={i18n.resolvedLanguage}
                positiveButton={{ label: t("Done") }}
                negativeButton={{ label: t("Back") }}
                onDismiss={() => setShowDatePicker(false)}
                onValueChange={(_, date) => acceptBirthDate(date)}
              />
              {process.env.EXPO_OS === "ios" && !value.birthDate && (
                <Button
                  compact
                  secondary
                  disabled={working}
                  onPress={() => acceptBirthDate(dateDraft)}
                >
                  {t("Done")}
                </Button>
              )}
            </View>
          )}
          <Text style={shared.muted}>
            {t(
              "Your birth date stays private. Only your age appears on your profile.",
            )}
          </Text>
          {inlineError("birthDate")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("gender", event)}
          style={section}
        >
          <Text style={sectionTitle}>{t("Gender")}</Text>
          <Chips
            disabled={busy || saving}
            values={genders}
            selected={[value.gender]}
            onChange={(selection) => change("gender", selection[0] as Gender)}
          />
          {inlineError("gender")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("interestedIn", event)}
          style={section}
        >
          <Text style={sectionTitle}>{t("Interested in")}</Text>
          <Text style={shared.muted}>{t("You can select more than one.")}</Text>
          <Chips
            disabled={busy || saving}
            values={genders}
            selected={value.interestedIn}
            onChange={(selection) =>
              change("interestedIn", selection as Gender[])
            }
            multiple
          />
          {inlineError("interestedIn")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("location", event)}
          style={section}
        >
          <Field
            label={t("City")}
            value={value.location}
            onChangeText={(text) => change("location", text)}
            placeholder={t("e.g. Bengaluru")}
            maxLength={80}
            editable={!busy && !saving}
          />
          <Text style={shared.muted}>
            {t("A city is enough. Never share your exact address.")}
          </Text>
          {inlineError("location")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("bio", event)}
          style={section}
        >
          <Field
            label={t("Your bio")}
            value={value.bio}
            onChangeText={(text) => change("bio", text)}
            placeholder={t(
              "Usually planning a weekend escape or hunting for the city’s best dosa…",
            )}
            multiline
            maxLength={500}
            editable={!busy && !saving}
          />
          <Text style={shared.muted}>{value.bio.length}/500</Text>
          {inlineError("bio")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("photos", event)}
          style={section}
        >
          <Text style={sectionTitle}>{t("Add photos")}</Text>
          <Text style={shared.muted}>
            {t("Choose up to 6 photos. We’ll optimize any image size for you.")}
          </Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {gallery.map((photo, index) => (
              <View
                key={photo.id}
                style={{
                  flexBasis: "46%",
                  flexGrow: 1,
                  maxWidth: 230,
                  minWidth: 120,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    borderRadius: 18,
                    borderCurve: "continuous",
                    overflow: "hidden",
                    backgroundColor: colors.soft,
                  }}
                >
                  <Image
                    source={photo.url || photo.uri}
                    contentFit="cover"
                    style={{ width: "100%", aspectRatio: 0.82 }}
                  />
                  <View style={{ position: "absolute", top: 6, right: 6, backgroundColor: colors.paper, borderRadius: 24 }}>
                    <IconButton
                      label={t(
                        photo.url
                          ? "Remove photo {{number}}"
                          : "Remove selected photo {{number}}",
                        { number: index + 1 },
                      )}
                      disabled={working}
                      onPress={() => removePhoto(photo.id)}
                      icon="close"
                      size={22}
                    />
                  </View>
                </View>
                {photo.id === mainPhotoId && <Badge>{t("Main photo")}</Badge>}
                {photo.url && photo.id !== mainPhotoId && (
                  <Button
                    secondary
                    compact
                    disabled={working}
                    onPress={() => chooseMain(index)}
                  >
                    {t("Make main photo")}
                  </Button>
                )}
                {photo.error && (
                  <Text
                    style={[shared.muted, { color: colors.red, fontSize: 13 }]}
                  >
                    {t(photo.error)}
                  </Text>
                )}
              </View>
            ))}
          </View>
          {!demo && availableSlots > 0 && (
            <Button
              secondary
              icon="image-outline"
              onPress={pick}
              busy={uploading}
              disabled={busy || saving || showDatePicker || !uid}
            >
              {t("Add photos")}
            </Button>
          )}
          {uploadProgress && (
            <Text accessibilityLiveRegion="polite" style={shared.muted}>
              {t("Uploading photos · {{current}} / {{total}}", uploadProgress)}
            </Text>
          )}
          {photoError ? <Notice error text={photoError} /> : null}
          {unresolved.length > 0 && !uploading && (
            <Button
              secondary
              onPress={retryPhotos}
              disabled={busy || saving || showDatePicker || !uid}
            >
              {t("Retry photos")}
            </Button>
          )}
          {demo && availableSlots > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={shared.muted}>
                {t(
                  "Demo mode does not upload personal photos. Add a persistent HTTPS image URL to try a different photo.",
                )}
              </Text>
              <Field
                label={t("HTTPS photo URL")}
                placeholder="https://…"
                value={url}
                autoCapitalize="none"
                onChangeText={setUrl}
                editable={!busy && !saving}
              />
              <Button
                secondary
                compact
                onPress={addDemoUrl}
                disabled={!url.trim() || working}
              >
                {t("Add photo URL")}
              </Button>
            </View>
          )}
          {inlineError("photos")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("interests", event)}
          style={section}
        >
          <Text style={sectionTitle}>{t("Interests")}</Text>
          <Text style={shared.muted}>
            {t("Pick a few things that make you, you.")}
          </Text>
          <Chips
            disabled={busy || saving}
            maxSelected={8}
            values={interests}
            selected={value.interests}
            onChange={(selection) => change("interests", selection.slice(0, 8))}
            multiple
          />
          {inlineError("interests")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("intent", event)}
          style={section}
        >
          <Text style={sectionTitle}>{t("What are you looking for?")}</Text>
          <Chips
            disabled={busy || saving}
            values={intents}
            selected={[value.intent]}
            onChange={(selection) => change("intent", selection[0] as Intent)}
          />
          {inlineError("intent")}
        </View>
        <View
          onLayout={(event) => recordSectionLayout("prompts", event)}
          style={section}
        >
          <Text style={sectionTitle}>{t("Leave a conversation starter.")}</Text>
          <Text style={shared.muted}>
            {t("Optional. A good story beats a perfect answer.")}
          </Text>
          {Array.from(
            { length: Math.max(1, value.prompts.length) },
            (_, index) => (
              <View key={index} style={{ gap: 12 }}>
                <Field
                  label={t("Prompt")}
                  value={value.prompts[index]?.question || ""}
                  onChangeText={(text) => changePrompt(index, "question", text)}
                  placeholder={t("My perfect Sunday looks like…")}
                  maxLength={100}
                  editable={!busy && !saving}
                />
                <Field
                  label={t("Your answer")}
                  value={value.prompts[index]?.answer || ""}
                  onChangeText={(text) => changePrompt(index, "answer", text)}
                  placeholder={t(
                    "Slow coffee, a bookstore, and absolutely no alarms.",
                  )}
                  multiline
                  maxLength={200}
                  editable={!busy && !saving}
                />
              </View>
            ),
          )}
          {inlineError("prompts")}
        </View>
      </KeyboardAwareScrollView>
      <KeyboardStickyView
        onLayout={({ nativeEvent }) =>
          setFooterHeight(nativeEvent.layout.height)
        }
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          borderTopWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.paper,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 14),
        }}
      >
        <View
          style={{ width: "100%", maxWidth: 540, alignSelf: "center", gap: 12 }}
        >
          {saveError ? <Notice error text={saveError} /> : null}
          <Button
            onPress={save}
            busy={busy || saving}
            disabled={uploading || showDatePicker}
            icon="checkmark"
          >
            {t("Save profile")}
          </Button>
        </View>
      </KeyboardStickyView>
    </View>
  );
}
