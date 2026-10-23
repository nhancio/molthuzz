import { useTranslation } from "react-i18next";
import { Text } from "../components/LocalizedText";
/* Effects synchronize external Firebase sessions and reset their loading UI. */
/* eslint-disable react-hooks/set-state-in-effect */
import React, {
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter } from "expo-router";
import { Image } from "expo-image";
import { entryGate, tabPath, type AppTab } from "./native-navigation";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, shared } from "../theme";
import { BrandMark } from "../components/brand-mark";
import {
  Badge,
  Button,
  Empty,
  Field,
  Icon,
  Notice,
  Sheet,
} from "../components/UI";
import Welcome from "./Welcome";
import Onboarding from "./Onboarding";
import Discovery from "./Discovery";
import { deleteAccountSafely } from "./accountDeletion";
import { Chat, Conversations, Likes } from "./Connections";
import { AccountScreen, Legal, MembershipScreen } from "./Account";
import type {
  AuthUser,
  Card,
  Filters,
  Match,
  Membership,
  Message,
  Profile,
  ProfileInput,
} from "../lib/contracts";
import {
  deleteAuthUser,
  reauthenticateGoogle,
  signInGoogle,
  signOutUser,
  watchAuth,
} from "../lib/auth";
import {
  blockUser,
  deleteAccountData,
  discover,
  endMatch,
  getIncomingInterests,
  loadAccount,
  loadProfile,
  recordInterest,
  reportUser,
  saveProfile,
  sendMessage,
  watchMatches,
  watchMembership,
  watchMessages,
} from "../lib/data";
import { demoCards, demoProfile, demoProfileInput } from "../lib/demo";
import {
  ageFromBirthDate,
  emptyProfileInput,
  filterCards,
  membershipActive,
} from "../lib/model";
import {
  cancelMembership,
  paymentConfigured,
  startCheckout,
} from "../lib/payments";

type Tab = AppTab;
type MakeInContextValue = {
  ready: boolean;
  settingUp: boolean;
  destination: ReturnType<typeof tabPath>;
  entry: React.ReactNode;
  renderTab: (tab: Tab) => React.ReactNode;
  renderConversation: () => React.ReactNode;
  conversationTitle: string;
  hasConversation: boolean;
  conversationSafety: () => void;
  openMembership: () => void;
  matchCount: number;
  demo: boolean;
};
const MakeInContext = createContext<MakeInContextValue | null>(null);
export function useMakeIn() {
  const context = use(MakeInContext);
  if (!context) throw new Error("MakeInProvider is missing");
  return context;
}
type Dialog =
  | "membership"
  | "filters"
  | "terms"
  | "privacy"
  | "delete"
  | "cancel"
  | "safety"
  | "match"
  | null;
const initialFilters: Filters = { minAge: 18, maxAge: 100, location: "" };
function messageOf(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Something went wrong. Please try again.";
}
function OpeningProgress({ text }: { text: string }) {
  return (
    <View
      style={[
        shared.page,
        {
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 22,
        },
      ]}
    >
      <BrandMark size={38} />
      <ActivityIndicator color={colors.ink} />
      <Text accessibilityLiveRegion="polite" style={shared.muted}>
        {text}
      </Text>
    </View>
  );
}
export function MakeInProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [demo, setDemo] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileOwner, setProfileOwner] = useState<string | null>(null);
  const [input, setInput] = useState<ProfileInput>(emptyProfileInput);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("discover");
  const [cards, setCards] = useState<Card[]>([]);
  const [incoming, setIncoming] = useState<Card[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filterDraft, setFilterDraft] = useState(initialFilters);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selected, setSelected] = useState<Card | null>(null);
  const [chat, setChat] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [demoMessages, setDemoMessages] = useState<Record<string, Message[]>>(
    {},
  );
  const [safety, setSafety] = useState<{ id: string; name: string } | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [newMatch, setNewMatch] = useState<Card | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [profileReload, setProfileReload] = useState(0);
  const uid = demo ? "demo-you" : user?.uid || "";
  const active = demo || membershipActive(membership);
  useEffect(() => {
    if (pathname !== "/conversation") setChat(null);
  }, [pathname]);
  const run = useCallback(async (fn: () => Promise<void>, rethrow = false) => {
    if (mutation.current) return;
    mutation.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(messageOf(e));
      if (rethrow) throw e;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }, []);
  useEffect(
    () =>
      watchAuth((u) => {
        setUser(u);
        setAuthReady(true);
      }),
    [],
  );
  useEffect(() => {
    if (demo) return;
    let current = true;
    setProfile(null);
    setProfileOwner(null);
    setSelected(null);
    setDialog(null);
    setSafety(null);
    setNewMatch(null);
    setCards([]);
    setMatches([]);
    setIncoming([]);
    setMembership(null);
    setChat(null);
    setError("");
    setLoadFailed(false);
    setEditing(false);
    setTab("discover");
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([loadProfile(user.uid), loadAccount(user.uid)])
      .then(([p, a]) => {
        if (!current) return;
        setProfile(p);
        setProfileOwner(user.uid);
        if (p) {
          const { age: _age, status: _status, ...editable } = p;
          setInput({ ...editable, birthDate: a?.birthDate || "" });
        } else
          setInput({
            ...emptyProfileInput,
            name: user.displayName?.split(" ")[0] || "",
          });
      })
      .catch((e) => {
        if (current) {
          setError(messageOf(e));
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [user, demo, profileReload]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    const stopMatches = watchMatches(user.uid, setMatches, (e) =>
      setError(e.message),
    );
    const stopMembership = watchMembership(user.uid, setMembership, (e) =>
      setError(e.message),
    );
    return () => {
      stopMatches();
      stopMembership();
    };
  }, [user, demo, profile]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    let current = true;
    setLoading(true);
    Promise.all([discover(user.uid, profile), getIncomingInterests(user.uid)])
      .then(([c, i]) => {
        if (current) {
          setCards(c);
          setIncoming(i);
        }
      })
      .catch((e) => {
        if (current) setError(messageOf(e));
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [user, demo, profile]);
  useEffect(() => {
    if (!chat) {
      setMessages([]);
      return;
    }
    if (demo) {
      setMessages(demoMessages[chat.id] || []);
      return;
    }
    setChatLoading(true);
    setMessages([]);
    return watchMessages(
      chat.id,
      (m) => {
        setMessages(m);
        setChatLoading(false);
      },
      (e) => {
        setError(e.message);
        setChatLoading(false);
      },
    );
  }, [chat, demo, demoMessages]);
  function enterDemo() {
    setDemo(true);
    setProfile(demoProfile);
    setProfileOwner("demo-you");
    setSelected(null);
    setDialog(null);
    setSafety(null);
    setNewMatch(null);
    setInput(demoProfileInput);
    setCards([...demoCards]);
    setIncoming(demoCards.slice(0, 3));
    setMatches([]);
    setDemoMessages({});
    setChat(null);
    setTab("discover");
    setFilters(initialFilters);
    setError("");
    setLoadFailed(false);
    setLoading(false);
  }
  async function refresh() {
    if (demo) {
      setCards([...demoCards]);
      return;
    }
    if (!user || !profile) return;
    await run(async () => {
      setCards(await discover(user.uid, profile));
      setIncoming(await getIncomingInterests(user.uid));
    });
  }
  function demoMatch(card: Card) {
    if (matches.some((m) => m.members.includes(card.id))) return;
    const match: Match = {
      id: `demo-${card.id}`,
      members: [uid, card.id],
      names: { [uid]: profile!.name, [card.id]: card.name },
      photos: { [uid]: profile!.photos[0], [card.id]: card.photos[0] },
      status: "active",
    };
    setMatches((m) => [...m, match]);
    setNewMatch(card);
    setDialog("match");
  }
  async function decide(decision: "like" | "pass", target?: Card) {
    const card = target || filtered[0];
    if (!card || mutation.current) return;
    if (!active) {
      setSelected(null);
      setDialog("membership");
      return;
    }
    await run(async () => {
      if (demo) {
        if (decision === "like" && incoming.some((x) => x.id === card.id))
          demoMatch(card);
      } else {
        if (!user) throw Error("Sign in to continue.");
        const matched = await recordInterest(user.uid, card, decision);
        if (matched) {
          setNewMatch(card);
          setDialog("match");
        }
      }
      setCards((c) => c.filter((x) => x.id !== card.id));
      setIncoming((c) => c.filter((x) => x.id !== card.id));
      setSelected(null);
    });
  }
  async function save(p: ProfileInput) {
    await run(async () => {
      if (demo) {
        const { birthDate, ...publicFields } = p;
        setProfile({
          ...publicFields,
          age: ageFromBirthDate(birthDate),
          status: "active",
        });
        setInput(p);
      } else {
        if (!user) throw Error("Sign in before saving your profile.");
        setProfile(await saveProfile(user.uid, p));
        setInput(p);
      }
      setProfileOwner(uid);
      setEditing(false);
    }, true);
  }
  async function leave() {
    if (demo) {
      setDemo(false);
      setProfile(null);
      setCards([]);
      setMatches([]);
      setDemoMessages({});
      setChat(null);
      setProfileOwner(null);
      setSelected(null);
      setDialog(null);
      setEditing(false);
      setError("");
    } else await run(signOutUser);
  }
  function openSafety(id: string, name: string) {
    setSelected(null);
    setSafety({ id, name });
    setDialog("safety");
  }
  async function safetyAction(action: "block" | "report" | "unmatch") {
    if (!safety) return;
    await run(async () => {
      if (!demo) {
        if (!user) throw Error("Sign in to continue.");
        if (action === "block") await blockUser(user.uid, safety.id);
        if (action === "report") await reportUser(user.uid, safety.id, reason);
        if (action === "unmatch" && chat) await endMatch(chat.id, user.uid);
      }
      if (action !== "report") {
        setCards((v) => v.filter((c) => c.id !== safety.id));
        setIncoming((v) => v.filter((c) => c.id !== safety.id));
        setMatches((v) => v.filter((m) => !m.members.includes(safety.id)));
        setChat(null);
      }
      setDialog(null);
      setError(
        action === "report"
          ? demo
            ? "Demo report recorded in this session. No real report was submitted."
            : "Your report was submitted."
          : "",
      );
    });
  }
  const filtered = profile ? filterCards(cards, profile, filters) : [];
  const legalSheet = (
    <Sheet
      dismissible={!busy}
      title={
        dialog === "privacy"
          ? t("Your privacy matters.")
          : t("A few things to know.")
      }
      visible={dialog === "terms" || dialog === "privacy"}
      onClose={() =>
        setDialog((current) =>
          current === "terms" || current === "privacy" ? null : current,
        )
      }
    >
      <Legal kind={dialog === "privacy" ? "privacy" : "terms"} />
    </Sheet>
  );
  const gate = entryGate({
    authReady,
    uid,
    profileOwner,
    hasProfile: !!profile,
    editing,
    loadFailed,
  });
  function closeDialog(kind: Dialog, next: Dialog = null) {
    setDialog((current) => (current === kind ? next : current));
  }
  function openConversation(match: Match) {
    setChat(match);
    setError("");
    router.navigate("/conversation");
  }
  function backToMatches() {
    if (router.canGoBack()) router.back();
    else router.replace(tabPath("matches"));
  }
  function conversationSafety() {
    if (!chat) return;
    const other = chat.members.find((member) => member !== uid);
    if (other) openSafety(other, chat.names[other]);
  }
  function renderNotice() {
    return (
      <>
        {error ? (
          <View style={{ marginBottom: 20 }}>
            <Notice
              text={error}
              error={
                ![
                  "Demo report recorded in this session. No real report was submitted.",
                  "Your report was submitted.",
                ].includes(error)
              }
            />
            <Button secondary compact onPress={() => setError("")}>
              {t("Dismiss")}
            </Button>
          </View>
        ) : null}
      </>
    );
  }
  function entryContent() {
    if (gate === "starting")
      return <OpeningProgress text={t("Getting things ready…")} />;
    if (gate === "welcome")
      return (
        <>
          <Welcome
            onGoogle={() => run(signInGoogle)}
            onDemo={enterDemo}
            onLegal={setDialog}
            busy={busy}
            error={error}
          />
        </>
      );
    if (gate === "loading")
      return <OpeningProgress text={t("Loading your profile…")} />;
    if (gate === "error")
      return (
        <View style={shared.page}>
          <Empty
            title={t("Couldn’t load your profile.")}
            text={
              i18n.exists(error, { lng: "en" })
                ? t(error)
                : t("Something went wrong. Please try again.")
            }
            action={
              <View style={{ gap: 12 }}>
                <Button
                  onPress={() => {
                    // Firebase User methods live on its prototype; retry loading without replacing it.
                    setLoading(true);
                    setLoadFailed(false);
                    setProfileReload((version) => version + 1);
                  }}
                >
                  {t("Try again")}
                </Button>
                <Button secondary onPress={leave}>
                  {t("Sign out")}
                </Button>
              </View>
            }
          />
        </View>
      );
    if (gate === "onboarding")
      return (
        <Onboarding
          initial={input}
          uid={user?.uid}
          demo={demo}
          editing={editing}
          onSave={save}
          onExit={editing ? () => setEditing(false) : leave}
          busy={busy}
        />
      );
    return null;
  }
  function renderTab(tab: Tab) {
    if (gate !== "ready" || !profile) return null;
    return (
      <View collapsable={false} style={[shared.page, a.main, tab === "profile" && { paddingHorizontal: 0, paddingTop: 0 }]}>
        {demo && (
          <View style={a.demoBar}>
            <Text style={[shared.muted, { fontSize: 10 }]}>
              {t(
                "DEMO EXPERIENCE · Fictional profiles. Local likes and practice chats.",
              )}
            </Text>
          </View>
        )}
        {renderNotice()}
        {tab === "discover" && (
          <Discovery
            cards={filtered}
            demo={demo}
            busy={busy}
            loading={loading}
            onDecision={decide}
            onOpen={setSelected}
            onFilters={() => {
              setFilterDraft(filters);
              setDialog("filters");
            }}
            onReset={refresh}
          />
        )}
        {tab === "likes" && (
          <Likes
            cards={incoming}
            demo={demo}
            loading={loading}
            onOpen={setSelected}
            onRefresh={refresh}
          />
        )}
        {tab === "matches" && (
          <Conversations
            matches={matches}
            uid={uid}
            demo={demo}
            onOpen={openConversation}
          />
        )}
        {tab === "profile" && (
          <AccountScreen
            profile={profile}
            demo={demo}
            active={active}
            onEdit={() => {
              setTab("profile");
              setEditing(true);
            }}
            onMembership={() => setDialog("membership")}
            onTerms={() => setDialog("terms")}
            onPrivacy={() => setDialog("privacy")}
            onDelete={() => {
              setConfirmDelete("");
              setDialog("delete");
            }}
            onSignOut={leave}
          />
        )}
      </View>
    );
  }
  function renderConversation() {
    if (gate !== "ready" || !chat) return null;
    return (
      <View style={[shared.page, a.main]}>
        {renderNotice()}
        <Chat
          nativeHeader
          match={chat}
          uid={uid}
          messages={messages}
          demo={demo}
          busy={busy}
          loading={chatLoading}
          onBack={backToMatches}
          onSafety={() => {
            const id = chat.members.find((m) => m !== uid)!;
            openSafety(id, chat.names[id]);
          }}
          onSend={(text) =>
            run(async () => {
              if (!active) {
                setDialog("membership");
                throw Error(
                  "An active membership is required to send messages.",
                );
              }
              if (demo)
                setDemoMessages((old) => ({
                  ...old,
                  [chat.id]: [
                    ...(old[chat.id] || []),
                    { id: `practice-${Date.now()}`, sender: uid, text },
                  ],
                }));
              else await sendMessage(chat.id, uid, text);
            }, true)
          }
        />
      </View>
    );
  }
  return (
    <MakeInContext.Provider
      value={{
        ready: gate === "ready",
        settingUp: gate === "onboarding",
        destination: tabPath(tab),
        entry: entryContent(),
        renderTab,
        renderConversation,
        conversationTitle: chat
          ? chat.names[chat.members.find((member) => member !== uid) || ""] ||
            t("Your match")
          : t("Your match"),
        hasConversation: !!chat,
        conversationSafety,
        openMembership: () => setDialog("membership"),
        matchCount: matches.length,
        demo,
      }}
    >
      {children}
      {legalSheet}
      {gate === "ready" && profile && (
        <>
          <Sheet
            dismissible={!busy}
            title={t("Your kind of connection.")}
            visible={dialog === "filters"}
            onClose={() => closeDialog("filters")}
          >
            <Text style={shared.muted}>
              {t(
                "Set your age range and optional city. Your gender preferences are in Edit profile.",
              )}
            </Text>
            <View style={[shared.row, { gap: 20 }]}>
              <View style={{ flex: 1 }}>
                <Field
                  label={t("Minimum age")}
                  keyboardType="number-pad"
                  value={String(filterDraft.minAge)}
                  onChangeText={(v) =>
                    setFilterDraft((f) => ({ ...f, minAge: Number(v) || 0 }))
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label={t("Maximum age")}
                  keyboardType="number-pad"
                  value={String(filterDraft.maxAge)}
                  onChangeText={(v) =>
                    setFilterDraft((f) => ({ ...f, maxAge: Number(v) || 0 }))
                  }
                />
              </View>
            </View>
            <Field
              label={t("City · optional")}
              value={filterDraft.location}
              placeholder={t("Anywhere")}
              onChangeText={(v) =>
                setFilterDraft((f) => ({ ...f, location: v }))
              }
            />
            {error ? <Notice text={error} error /> : null}
            <Button
              onPress={() => {
                if (
                  filterDraft.minAge < 18 ||
                  filterDraft.maxAge > 100 ||
                  filterDraft.minAge > filterDraft.maxAge
                )
                  return setError(
                    "Choose an age range between 18 and 100, with minimum no higher than maximum.",
                  );
                setFilters(filterDraft);
                setDialog(null);
                setError("");
              }}
            >
              {t("Apply preferences")}
            </Button>
            <Button
              secondary
              compact
              onPress={() => setFilterDraft(initialFilters)}
            >
              {t("Reset preferences")}
            </Button>
          </Sheet>
          <Sheet
            dismissible={!busy}
            title={t("A little more possibility.")}
            visible={dialog === "membership"}
            onClose={() => closeDialog("membership")}
          >
            <MembershipScreen
              membership={membership}
              active={active && !demo}
              demo={demo}
              configured={paymentConfigured}
              busy={busy}
              onCheckout={() =>
                run(async () => {
                  if (!user) throw Error("Sign in to start a real membership.");
                  await startCheckout(user);
                })
              }
              onCancel={() => setDialog("cancel")}
            />
            {error && <Notice text={error} error />}
          </Sheet>
          <Sheet
            dismissible={!busy}
            title={t("Stop future renewals?")}
            visible={dialog === "cancel"}
            onClose={() => closeDialog("cancel", "membership")}
          >
            <Text style={shared.body}>
              {t(
                "Your already paid access continues until the current period ends. Cancelling stops future automatic renewal payments.",
              )}
            </Text>
            <Button
              busy={busy}
              onPress={() =>
                run(async () => {
                  if (!user) return;
                  await cancelMembership(user);
                  setDialog("membership");
                })
              }
            >
              {t("Cancel automatic renewal")}
            </Button>
            <Button secondary onPress={() => setDialog("membership")}>
              {t("Keep membership")}
            </Button>
            {error && <Notice text={error} error />}
          </Sheet>
          <Sheet
            dismissible={!busy}
            title={selected ? `${selected.name}, ${selected.age}` : ""}
            visible={!!selected}
            onClose={() => setSelected(null)}
          >
            {selected && (
              <>
                <View style={[shared.row, { gap: 8 }]}>
                  <Badge>
                    {selected.demo
                      ? t("FICTIONAL DEMO PROFILE")
                      : t(selected.intent)}
                  </Badge>
                </View>
                {selected.photos.map((photo, i) => (
                  <Image
                    key={`${photo}-${i}`}
                    source={{ uri: photo }}
                    style={{
                      width: "100%",
                      aspectRatio: 0.87,
                      borderRadius: 19,
                      backgroundColor: colors.soft,
                    }}
                  />
                ))}
                <View style={[shared.row, { gap: 7 }]}>
                  <Icon name="location-outline" size={17} />
                  <Text style={shared.muted}>
                    {selected.location} · {t(selected.gender)}
                  </Text>
                </View>
                <Text style={shared.body}>{selected.bio}</Text>
                <View>
                  <Text style={[shared.label, { marginBottom: 12 }]}>
                    {t("LOOKING FOR")}
                  </Text>
                  <Text style={shared.body}>{t(selected.intent)}</Text>
                </View>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {selected.interests.map((interest) => (
                    <Badge key={interest}>{t(interest)}</Badge>
                  ))}
                </View>
                {selected.prompts.map((p, i) => (
                  <View key={i} style={shared.panel}>
                    <Text style={shared.label}>{p.question.toUpperCase()}</Text>
                    <Text
                      style={[
                        shared.heading,
                        { fontSize: 30, lineHeight: 35, marginTop: 15 },
                      ]}
                    >
                      {p.answer}
                    </Text>
                  </View>
                ))}
                <Button
                  busy={busy}
                  onPress={() => decide("like", selected)}
                  icon="heart"
                >
                  {incoming.some((c) => c.id === selected.id)
                    ? t("Like back")
                    : t("Like profile")}
                </Button>
                <Button
                  secondary
                  onPress={() => openSafety(selected.id, selected.name)}
                >
                  {t("Report or block")}
                </Button>
                {error && <Notice text={error} error />}
              </>
            )}
          </Sheet>
          <Sheet
            dismissible={!busy}
            title={
              safety
                ? t("Your connection with {{name}}", { name: safety.name })
                : t("Safety options")
            }
            visible={dialog === "safety"}
            onClose={() => closeDialog("safety")}
          >
            <Text style={shared.muted}>
              {demo
                ? t(
                    "These actions affect this demo session only. No real report is submitted.",
                  )
                : t(
                    "Blocking removes this connection and stops further likes and messages between you.",
                  )}
            </Text>
            <Field
              label={t("Reason for reporting")}
              placeholder={t("Inappropriate behaviour")}
              value={reason}
              onChangeText={setReason}
              maxLength={500}
              multiline
            />
            <Button
              secondary
              busy={busy}
              disabled={reason.trim().length < 5}
              onPress={() => safetyAction("report")}
              icon="flag-outline"
            >
              {t("Submit report")}
            </Button>
            <Button
              secondary
              busy={busy}
              onPress={() => safetyAction("block")}
              icon="ban-outline"
            >
              {t("Block profile")}
            </Button>
            {chat && (
              <Button
                secondary
                busy={busy}
                onPress={() => safetyAction("unmatch")}
              >
                {t("End this match")}
              </Button>
            )}
            {error && <Notice error text={error} />}
          </Sheet>
          <Sheet
            dismissible={!busy}
            title={t("A mutual little spark.")}
            visible={dialog === "match"}
            onClose={() => closeDialog("match")}
          >
            {newMatch && (
              <>
                <View style={{ alignItems: "center", paddingVertical: 15 }}>
                  <View style={[shared.row, { gap: 12 }]}>
                    <Image
                      source={{ uri: profile.photos[0] }}
                      style={a.matchPhoto}
                    />
                    <View style={a.matchHeart}>
                      <Icon name="heart" size={28} />
                    </View>
                    <Image
                      source={{ uri: newMatch.photos[0] }}
                      style={a.matchPhoto}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    shared.heading,
                    { textAlign: "center", fontSize: 40, lineHeight: 44 },
                  ]}
                >
                  {t("You and {{name}} liked each other.", {
                    name: newMatch.name,
                  })}
                </Text>
                <Text style={[shared.muted, { textAlign: "center" }]}>
                  {demo
                    ? t(
                        "A fictional demo match. Your practice messages aren’t sent to anyone.",
                      )
                    : t(
                        "A shared hello could be the beginning of something good.",
                      )}
                </Text>
                <Button
                  onPress={() => {
                    setDialog(null);
                    setTab("matches");
                    const match = matches.find((m) =>
                      m.members.includes(newMatch.id),
                    );
                    if (match) openConversation(match);
                    else router.navigate(tabPath("matches"));
                  }}
                >
                  {t("Say hello")}
                </Button>
                <Button secondary onPress={() => setDialog(null)}>
                  {t("Keep discovering")}
                </Button>
              </>
            )}
          </Sheet>
          <Sheet
            dismissible={!busy}
            title={t("Delete your account?")}
            visible={dialog === "delete"}
            onClose={() => closeDialog("delete")}
          >
            <Text style={shared.body}>
              {t(
                "This permanently removes your profile, likes, matches, conversation data and sign-in account. You’ll need to sign in with Google again to confirm ownership. When payments are connected, we first ask the provider to cancel any subscription or pending mandate, or confirm none exists. A known subscription also requires this check if payments are currently unavailable. If the provider cannot confirm cancellation, deletion stops.",
              )}
            </Text>
            {membership?.status === "active" && (
              <Notice
                error
                text="Cancel automatic renewal in Membership before deleting your account. Deletion does not itself cancel billing."
              />
            )}
            <Field
              label={t("Type DELETE to confirm")}
              keyboardType="ascii-capable"
              value={confirmDelete}
              onChangeText={setConfirmDelete}
              autoCapitalize="characters"
            />
            <Button
              disabled={
                confirmDelete !== "DELETE" || membership?.status === "active"
              }
              busy={busy}
              onPress={() =>
                run(async () => {
                  if (!user) return;
                  await deleteAccountSafely(
                    user,
                    membership,
                    paymentConfigured,
                    {
                      reauthenticate: reauthenticateGoogle,
                      cancelBilling: cancelMembership,
                      deleteData: deleteAccountData,
                      deleteAuth: deleteAuthUser,
                    },
                  );
                  setDialog(null);
                  setProfile(null);
                })
              }
            >
              {t("Permanently delete account")}
            </Button>
            {error && <Notice error text={error} />}
          </Sheet>
        </>
      )}
    </MakeInContext.Provider>
  );
}
const a = StyleSheet.create({
  demoBar: {
    backgroundColor: "#EAF0D5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 12,
  },
  main: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  matchPhoto: {
    width: 104,
    height: 132,
    borderRadius: 28,
    backgroundColor: colors.soft,
  },
  matchHeart: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lime,
  },
});
