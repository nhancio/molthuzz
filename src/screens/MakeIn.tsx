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
  useReducer,
  useState,
} from "react";
import { usePathname, useRouter } from "expo-router";
import { Image } from "expo-image";
import { entryGate, tabPath, type AppTab } from "./native-navigation";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, shared, spacing, radius, type } from "../theme";
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
import Friends from "./Friends";
import Learn from "./Learn";
import { IncomingCallBanner } from "../components/IncomingCallBanner";
import { deleteAccountSafely } from "./accountDeletion";
import { Chat, Conversations, Likes, MemberPhoto } from "./Connections";
import { AccountScreen, Legal, MembershipScreen } from "./Account";
import { startCall } from "../calls/signaling";
import type {
  AuthUser,
  Card,
  Filters,
  FriendRequest,
  Match,
  Membership,
  Message,
  Profile,
  ProfileInput,
} from "../lib/contracts";
import {
  deleteAuthUser,
  reauthenticateGoogle,
  signInApple,
  signInGoogle,
  signOutUser,
  watchAuth,
} from "../lib/auth";
import {
  blockUser,
  deleteAccountData,
  discover,
  discoverFriends,
  endMatch,
  getIncomingInterests,
  loadAccount,
  loadProfile,
  recordInterest,
  reportUser,
  respondFriendRequest,
  saveProfile,
  sendFriendRequest,
  sendMessage,
  updateProfileMood,
  watchFriendRequests,
  watchMatches,
  watchMembership,
  watchMessages,
} from "../lib/data";
import { userErrorMessage } from "../lib/user-error";
import { collectionReducer, initialCollection } from "../lib/collection-state";
import { demoCards, demoFriendRequests, demoProfile, demoProfileInput } from "../lib/demo";
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
  uid: string;
  destination: ReturnType<typeof tabPath>;
  entry: React.ReactNode;
  renderTab: (tab: Tab) => React.ReactNode;
  renderLikes: () => React.ReactNode;
  renderConversation: () => React.ReactNode;
  conversationTitle: string;
  hasConversation: boolean;
  conversationSafety: () => void;
  conversationCall: (mode: "audio" | "video") => void;
  lookupPerson: (id: string) => { name: string; photo?: string } | null;
  openMembership: () => void;
  incomingCount: number;
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
const messageOf = userErrorMessage;
function OpeningProgress({ text }: { text: string }) {
  return (
    <View
      style={[
        shared.page,
        {
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: spacing.inset,
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
// The reducer preserves loaded content during refresh and isolates each resource's failure.
function useCollection<T>() {
  const [state, dispatch] = useReducer(collectionReducer<T>, initialCollection<T>());
  const setData = useCallback((value: React.SetStateAction<T[]>) => {
    dispatch({ type: "update", update: data => typeof value === "function" ? value(data) : value });
  }, []);
  return [state, dispatch, setData] as const;
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
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("home");
  const [cardState, updateCards, setCards] = useCollection<Card>();
  const [friendState, updateFriends, setFriends] = useCollection<Card>();
  const [incomingState, updateIncoming, setIncoming] = useCollection<Card>();
  const [matchState, updateMatches, setMatches] = useCollection<Match>();
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const cards = cardState.data;
  const friends = friendState.data;
  const incoming = incomingState.data;
  const matches = matchState.data;
  const [cardRetry, retryCards] = useReducer(n => n + 1, 0);
  const [friendRetry, retryFriends] = useReducer(n => n + 1, 0);
  const [incomingRetry, retryIncoming] = useReducer(n => n + 1, 0);
  const [matchRetry, retryMatches] = useReducer(n => n + 1, 0);
  const [messageRetry, retryMessages] = useReducer(n => n + 1, 0);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [filterDraft, setFilterDraft] = useState(initialFilters);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [selected, setSelected] = useState<Card | null>(null);
  const [chat, setChat] = useState<Match | null>(null);
  const [messageState, updateMessages] = useCollection<Message>();
  const messages = messageState.data;
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
  const active = !paymentConfigured || demo || membershipActive(membership);
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
    updateCards({ type: "reset" });
    updateFriends({ type: "reset" });
    updateMatches({ type: "reset" });
    updateIncoming({ type: "reset" });
    updateMessages({ type: "reset" });
    setFriendRequests([]);
    setMembership(null);
    setChat(null);
    setError("");
    setLoadFailed(false);
    setEditing(false);
    setTab("home");
    if (!user) {
      return;
    }
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
      });
    return () => {
      current = false;
    };
  }, [user, demo, profileReload, updateCards, updateFriends, updateIncoming, updateMatches, updateMessages]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    let current = true;
    updateFriends({ type: "start" });
    discoverFriends(user.uid).then(data => {
      if (current) updateFriends({ type: "success", data });
    }).catch((cause) => {
      if (!current) return;
      console.warn("MakeIn: friends load failed", cause);
      if (current) updateFriends({ type: "failure", error: "Couldn’t load profiles. Check your connection and try again." });
    });
    return () => { current = false; };
  }, [user, demo, profile, friendRetry, updateFriends]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    let current = true;
    const stop = watchFriendRequests(user.uid, data => {
      if (current) setFriendRequests(data);
    }, (cause) => {
      console.warn("MakeIn: friend requests load failed", cause);
    });
    return () => { current = false; stop(); };
  }, [user, demo, profile]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    let current = true;
    updateMatches({ type: "start" });
    const stop = watchMatches(user.uid, data => {
      if (current) updateMatches({ type: "success", data });
    }, (cause) => {
      if (!current) return;
      console.warn("MakeIn: chats load failed", cause);
      if (current) updateMatches({ type: "failure", error: "Couldn’t load chats. Check your connection and try again." });
    });
    return () => { current = false; stop(); };
  }, [user, demo, profile, matchRetry, updateMatches]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    return watchMembership(user.uid, setMembership, e => setError(messageOf(e)));
  }, [user, demo, profile]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    let current = true;
    updateCards({ type: "start" });
    discover(user.uid, profile).then(data => {
      if (current) updateCards({ type: "success", data });
    }).catch((cause) => {
      if (!current) return;
      console.warn("MakeIn: profiles load failed", cause);
      if (current) updateCards({ type: "failure", error: "Couldn’t load profiles. Check your connection and try again." });
    });
    return () => { current = false; };
  }, [user, demo, profile, cardRetry, updateCards]);
  useEffect(() => {
    if (demo || !user || !profile) return;
    let current = true;
    updateIncoming({ type: "start" });
    getIncomingInterests(user.uid).then(data => {
      if (current) updateIncoming({ type: "success", data });
    }).catch((cause) => {
      if (!current) return;
      console.warn("MakeIn: likes load failed", cause);
      if (current) updateIncoming({ type: "failure", error: "Couldn’t load likes. Check your connection and try again." });
    });
    return () => { current = false; };
  }, [user, demo, profile, incomingRetry, updateIncoming]);
  useEffect(() => {
    if (!chat) {
      updateMessages({ type: "reset" });
      return;
    }
    if (demo) {
      updateMessages({ type: "success", data: demoMessages[chat.id] || [] });
      return;
    }
    let current = true;
    updateMessages({ type: "start" });
    const stop = watchMessages(chat.id, data => {
      if (current) updateMessages({ type: "success", data });
    }, (cause) => {
      if (!current) return;
      console.warn("MakeIn: messages load failed", cause);
      if (current) updateMessages({ type: "failure", error: "Couldn’t load messages. Check your connection and try again." });
    });
    return () => { current = false; stop(); };
  }, [chat, demo, demoMessages, messageRetry, updateMessages]);
  function enterDemo() {
    setDemo(true);
    setProfile(demoProfile);
    setProfileOwner("demo-you");
    setSelected(null);
    setDialog(null);
    setSafety(null);
    setNewMatch(null);
    setInput(demoProfileInput);
    updateCards({ type: "success", data: [...demoCards] });
    updateFriends({ type: "success", data: [...demoCards] });
    updateIncoming({ type: "success", data: demoCards.slice(0, 3) });
    updateMatches({ type: "success", data: [] });
    setFriendRequests([...demoFriendRequests]);
    setDemoMessages({});
    setChat(null);
    setTab("home");
    setFilters(initialFilters);
    setError("");
    setLoadFailed(false);
  }
  function refresh(kind: "discover" | "likes" | "friends" = "discover") {
    if (demo) {
      if (kind === "likes") return;
      if (kind === "friends") updateFriends({ type: "success", data: [...demoCards] });
      else updateCards({ type: "success", data: [...demoCards] });
      return;
    }
    if (kind === "likes") retryIncoming();
    else if (kind === "friends") retryFriends();
    else retryCards();
  }
  const lookupPerson = useCallback(
    (id: string): { name: string; photo?: string } | null => {
      const fromCard =
        friends.find((c) => c.id === id) ||
        cards.find((c) => c.id === id) ||
        incoming.find((c) => c.id === id);
      if (fromCard) return { name: fromCard.name, photo: fromCard.photos[0] };
      const fromMatch = matches.find((m) => m.members.includes(id));
      if (fromMatch) return { name: fromMatch.names[id] || "", photo: fromMatch.photos[id] };
      return null;
    },
    [friends, cards, incoming, matches],
  );
  async function handleMoodChange(mood: string) {
    await run(async () => {
      if (!profile) return;
      if (!demo) {
        if (!user) throw Error("Sign in to continue.");
        await updateProfileMood(user.uid, mood);
      }
      setProfile({ ...profile, mood });
      setInput((prev) => ({ ...prev, mood }));
    });
  }
  async function handleSayHello(person: Card) {
    await run(async () => {
      if (demo) {
        setFriendRequests((prev) =>
          prev.some((r) => r.from === uid && r.to === person.id && r.status === "pending")
            ? prev
            : [...prev, { id: `${uid}~${person.id}`, from: uid, to: person.id, status: "pending" }],
        );
      } else {
        if (!user) throw Error("Sign in to continue.");
        await sendFriendRequest(user.uid, person.id);
      }
    });
  }
  async function handleRespondRequest(request: FriendRequest, accept: boolean) {
    await run(async () => {
      if (demo) {
        setFriendRequests((prev) => prev.filter((r) => r.id !== request.id));
        if (accept && profile) {
          const sender = lookupPerson(request.from);
          const friendMatch: Match = {
            id: `demo-friend-${request.from}`,
            members: [uid, request.from],
            names: { [uid]: profile.name, [request.from]: sender?.name || "Friend" },
            photos: { [uid]: profile.photos[0], [request.from]: sender?.photo || "" },
            kind: "friend",
            status: "active",
          };
          setMatches((prev) =>
            prev.some((m) => m.members.includes(request.from)) ? prev : [friendMatch, ...prev],
          );
        }
      } else {
        if (!user) throw Error("Sign in to continue.");
        await respondFriendRequest(user.uid, request, accept);
      }
    });
  }
  function startConversationCall(targetMatch: Match, mode: "audio" | "video") {
    if (demo) {
      setError("Audio and video calls are available after signing in with your MakeIn account.");
      return;
    }
    const other = targetMatch.members.find((m) => m !== uid);
    if (!user || !other) return;
    void run(async () => {
      const callId = await startCall(targetMatch.id, user.uid, other, mode);
      router.push({ pathname: "/call/[id]", params: { id: callId } });
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
        setFriends((v) => v.filter((c) => c.id !== safety.id));
        setIncoming((v) => v.filter((c) => c.id !== safety.id));
        setMatches((v) => v.filter((m) => !m.members.includes(safety.id)));
        setFriendRequests((v) => v.filter((r) => r.from !== safety.id && r.to !== safety.id));
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
          ? t("Privacy policy")
          : t("Terms of use")
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
    if (!next) setError("");
    setDialog((current) => (current === kind ? next : current));
  }
  function openConversation(match: Match) {
    updateMessages({ type: "reset" });
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
  function renderNotice(surfaceTab?: Tab) {
    if (dialog || selected || (surfaceTab && surfaceTab !== tab)) return null;
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
            onApple={() => run(signInApple)}
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
  function renderLikes() {
    if (gate !== "ready" || !profile) return null;
    return (
      <View collapsable={false} style={[shared.page, a.main]}>
        {renderNotice()}
        <Likes
          cards={incoming}
          demo={demo}
          loading={incomingState.loading}
          error={incomingState.error}
          onOpen={setSelected}
          onRefresh={() => refresh("likes")}
        />
      </View>
    );
  }
  function renderTab(tab: Tab) {
    if (gate !== "ready" || !profile) return null;
    return (
      <View collapsable={false} style={[shared.page, a.main, tab === "profile" && { paddingHorizontal: 0, paddingTop: 0 }]}>
        {demo && (
          <View style={[a.demoBar, tab === "profile" && { marginHorizontal: 16, marginTop: 8 }]}>
            <Text style={type.caption}>
              {t(
                "DEMO EXPERIENCE · Fictional profiles. Local likes and practice chats.",
              )}
            </Text>
          </View>
        )}
        {renderNotice(tab)}
        {tab === "home" && (
          <Discovery
            cards={filtered}
            demo={demo}
            busy={busy}
            loading={cardState.loading}
            error={cardState.error}
            onRetry={() => refresh()}
            onDecision={decide}
            onOpen={setSelected}
            onFilters={() => {
              setFilterDraft(filters);
              setDialog("filters");
            }}
            onReset={refresh}
          />
        )}
        {tab === "friends" && (
          <Friends
            profile={profile}
            people={friends}
            matches={matches}
            requests={friendRequests}
            uid={uid}
            demo={demo}
            busy={busy}
            loading={friendState.loading}
            error={friendState.error}
            onRetry={() => refresh("friends")}
            onMoodChange={handleMoodChange}
            onSayHello={handleSayHello}
            onRespond={handleRespondRequest}
            onOpenChat={openConversation}
            onStartCall={startConversationCall}
            onOpenProfile={setSelected}
          />
        )}
        {tab === "matches" && (
          <Conversations
            matches={matches}
            requests={friendRequests}
            lookupPerson={lookupPerson}
            loading={matchState.loading}
            error={matchState.error}
            busy={busy}
            onRetry={retryMatches}
            onRespondRequest={handleRespondRequest}
            uid={uid}
            demo={demo}
            onOpen={openConversation}
          />
        )}
        {tab === "learn" && <Learn user={user} demo={demo} />}
        {tab === "profile" && (
          <AccountScreen
            profile={profile}
            demo={demo}
            active={active}
            showMembership={paymentConfigured}
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
          loading={messageState.loading}
          error={messageState.error}
          onRetry={retryMessages}
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
              else {
                try { await sendMessage(chat.id, uid, text); }
                catch { throw Error("Message could not be sent. Your draft is saved. Try again."); }
              }
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
        uid,
        destination: tabPath(tab),
        entry: entryContent(),
        renderTab,
        renderLikes,
        renderConversation,
        conversationTitle: chat
          ? chat.names[chat.members.find((member) => member !== uid) || ""] ||
            t("Your match")
          : t("Your match"),
        hasConversation: !!chat,
        conversationSafety,
        conversationCall: (mode) => {
          if (chat) startConversationCall(chat, mode);
        },
        lookupPerson,
        openMembership: () => setDialog("membership"),
        incomingCount: incoming.length,
        matchCount: matches.length,
        demo,
      }}
    >
      {children}
      <IncomingCallBanner
        uid={uid}
        enabled={gate === "ready" && !demo}
        lookupPerson={lookupPerson}
      />
      {legalSheet}
      {gate === "ready" && profile && (
        <>
          <Sheet
            dismissible={!busy}
            title={t("Discovery filters")}
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
            title={t("Membership")}
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
                <MemberPhoto uri={selected.photos[0]} style={{ width: "100%", aspectRatio: 0.87, borderRadius: radius.xl, borderCurve: "continuous" }} />
                <View style={[shared.row, { gap: 7 }]}>
                  <Icon name="location-outline" size={17} />
                  <Text style={shared.muted}>
                    {selected.location} · {t(selected.gender)}
                  </Text>
                </View>
                <Text style={shared.body}>{selected.bio}</Text>
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
                <View>
                  <Text style={[shared.label, { marginBottom: 12 }]}>
                    {t("Looking for")}
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
                    <Text style={shared.label}>{p.question}</Text>
                    <Text
                      style={[
                        type.body,
                        { marginTop: spacing.row },
                      ]}
                    >
                      {p.answer}
                    </Text>
                  </View>
                ))}
                {selected.photos.slice(1).map((photo, i) => <MemberPhoto key={`${photo}-${i}`} uri={photo} style={{ width: "100%", aspectRatio: 0.87, borderRadius: radius.xl, borderCurve: "continuous" }} />)}
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
    backgroundColor: colors.soft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.md,
    marginBottom: 12,
  },
  main: {
    flex: 1,
    minHeight: 0,
    width: "100%",
    paddingHorizontal: 16,
    paddingTop: spacing.sm,
  },
  matchPhoto: {
    width: 104,
    height: 132,
    borderRadius: radius.lg,
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
