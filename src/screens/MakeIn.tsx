/* Effects synchronize external Firebase sessions and reset their loading UI. */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { colors, fonts, shared } from "../theme";
import {
  Badge,
  Button,
  Chips,
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

type Tab = "discover" | "likes" | "matches" | "profile";
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
const tabs: {
  id: Tab;
  name: string;
  icon: React.ComponentProps<typeof Icon>["name"];
}[] = [
  { id: "discover", name: "Discover", icon: "compass-outline" },
  { id: "likes", name: "Likes you", icon: "heart-outline" },
  { id: "matches", name: "Connections", icon: "chatbubbles-outline" },
  { id: "profile", name: "Your profile", icon: "person-outline" },
];
function messageOf(e: unknown) {
  return e instanceof Error
    ? e.message
    : "Something went wrong. Please try again.";
}
export default function MakeIn() {
  const wide = useWindowDimensions().width >= 900;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [demo, setDemo] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
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
  const [reason, setReason] = useState("Inappropriate behaviour");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [newMatch, setNewMatch] = useState<Card | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const uid = demo ? "demo-you" : user?.uid || "";
  const active = demo || membershipActive(membership);
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
  }, [user, demo]);
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
      title={
        dialog === "privacy" ? "Your privacy matters." : "A few things to know."
      }
      visible={dialog === "terms" || dialog === "privacy"}
      onClose={() => setDialog(null)}
    >
      <Legal kind={dialog === "privacy" ? "privacy" : "terms"} />
    </Sheet>
  );
  if (!authReady)
    return (
      <View style={shared.page}>
        <Empty
          title="A fresh beginning."
          text="Getting things ready…"
          action={<ActivityIndicator color={colors.ink} />}
        />
      </View>
    );
  if (!user && !demo)
    return (
      <>
        <Welcome
          onGoogle={() => run(signInGoogle)}
          onDemo={enterDemo}
          onLegal={setDialog}
          busy={busy}
          error={error}
        />
        {legalSheet}
      </>
    );
  if (loading && !profile)
    return (
      <View style={shared.page}>
        <Empty
          title="A moment for you."
          text="Loading your profile…"
          action={<ActivityIndicator color={colors.ink} />}
        />
      </View>
    );
  if (loadFailed)
    return (
      <View style={shared.page}>
        <Empty
          title="Couldn’t load your profile."
          text={error}
          action={
            <View style={{ gap: 12 }}>
              <Button
                onPress={() => {
                  setLoadFailed(false);
                  setUser(user ? { ...user } : null);
                }}
              >
                Try again
              </Button>
              <Button secondary onPress={leave}>
                Sign out
              </Button>
            </View>
          }
        />
      </View>
    );
  if (!profile || editing)
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
  return (
    <View style={shared.page}>
      <View style={a.root}>
        {wide && (
          <View style={a.sidebar}>
            <Text style={a.logo}>
              makein<Text style={{ color: "#9BB329" }}>✳</Text>
            </Text>
            <Text
              style={[
                shared.label,
                {
                  fontSize: 8,
                  letterSpacing: 1.5,
                  marginTop: 6,
                  marginLeft: 3,
                },
              ]}
            >
              SOMETHING GOOD STARTS HERE
            </Text>
            <View style={{ gap: 8, marginTop: 60 }}>
              {tabs.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: tab === item.id }}
                  onPress={() => {
                    setTab(item.id);
                    setChat(null);
                    setError("");
                  }}
                  style={[
                    a.nav,
                    tab === item.id && { backgroundColor: colors.lime },
                  ]}
                >
                  <Icon name={item.icon} size={21} />
                  <Text
                    style={{
                      fontFamily: tab === item.id ? fonts.semi : fonts.regular,
                      fontSize: 13,
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.id === "matches" && matches.length > 0 && (
                    <View style={a.count}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 10 }}>
                        {matches.length}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
            <View style={{ flex: 1 }} />
            <View style={a.sidebarNote}>
              <Icon name="flower-outline" size={27} />
              <Text
                style={{
                  fontFamily: fonts.serif,
                  fontSize: 24,
                  marginTop: 12,
                  lineHeight: 27,
                }}
              >
                Good energy.{"\n"}Great possibilities.
              </Text>
              <Text style={[shared.muted, { fontSize: 10, marginTop: 10 }]}>
                Be kind. Be curious. Be you.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setTab("profile")}
              style={[shared.row, { marginTop: 27, gap: 11 }]}
            >
              <Image source={{ uri: profile.photos[0] }} style={a.avatar} />
              <View>
                <Text style={{ fontFamily: fonts.semi, fontSize: 12 }}>
                  {profile.name}
                </Text>
                <Text style={[shared.muted, { fontSize: 10 }]}>
                  {demo ? "Demo explorer" : "Your profile"}
                </Text>
              </View>
              <Icon name="chevron-forward" size={13} />
            </Pressable>
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={[a.topbar, { paddingHorizontal: wide ? 44 : 22 }]}>
            {!wide ? (
              <Text style={[a.logo, { fontSize: 31 }]}>makein✳</Text>
            ) : (
              <Text style={[shared.label, { fontSize: 9 }]}>
                {tab === "discover"
                  ? "DISCOVER YOUR KIND OF CONNECTION"
                  : tab === "likes"
                    ? "A LITTLE SPARK GOES BOTH WAYS"
                    : tab === "matches"
                      ? "LET THE CONVERSATION BEGIN"
                      : "MAKE YOURSELF AT HOME"}
              </Text>
            )}
            <Pressable
              accessibilityRole="button"
              onPress={() => (demo ? leave() : setDialog("membership"))}
            >
              <Badge dark>
                {demo ? "DEMO · EXIT ↗" : active ? "MEMBER ✳" : "JOIN FOR ₹2 ↗"}
              </Badge>
            </Pressable>
          </View>
          {demo && (
            <View style={a.demoBar}>
              <Text
                style={{
                  fontFamily: fonts.medium,
                  fontSize: 10,
                  textAlign: "center",
                  color: colors.ink,
                }}
              >
                DEMO EXPERIENCE · Fictional profiles. Local likes and practice
                chats.
              </Text>
            </View>
          )}
          <View
            style={[
              a.main,
              { paddingHorizontal: wide ? 44 : 21, paddingTop: wide ? 34 : 28 },
            ]}
          >
            {error ? (
              <View style={{ marginBottom: 20 }}>
                <Notice text={error} error={!error.includes("report")} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Dismiss notice"
                  onPress={() => setError("")}
                >
                  <Text
                    style={[
                      shared.muted,
                      { textAlign: "right", marginTop: 4, fontSize: 10 },
                    ]}
                  >
                    Dismiss
                  </Text>
                </Pressable>
              </View>
            ) : null}
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
                active={active}
                onMembership={() => setDialog("membership")}
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
            {tab === "matches" &&
              (chat ? (
                <Chat
                  match={chat}
                  uid={uid}
                  messages={messages}
                  demo={demo}
                  busy={busy}
                  loading={chatLoading}
                  onBack={() => setChat(null)}
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
              ) : (
                <Conversations
                  matches={matches}
                  uid={uid}
                  demo={demo}
                  onOpen={(m) => {
                    if (!active) return setDialog("membership");
                    setChat(m);
                  }}
                />
              ))}
            {tab === "profile" && (
              <AccountScreen
                profile={profile}
                demo={demo}
                active={active}
                onEdit={() => setEditing(true)}
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
          {!wide && (
            <View style={a.bottom}>
              {tabs.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityState={{ selected: item.id === tab }}
                  onPress={() => {
                    setTab(item.id);
                    setChat(null);
                    setError("");
                  }}
                  style={{ alignItems: "center", gap: 6, flex: 1 }}
                >
                  <View
                    style={[
                      a.mobileIcon,
                      item.id === tab && { backgroundColor: colors.lime },
                    ]}
                  >
                    <Icon name={item.icon} size={21} />
                  </View>
                  <Text
                    style={{
                      fontFamily: item.id === tab ? fonts.semi : fonts.regular,
                      fontSize: 9,
                      color: colors.ink,
                    }}
                  >
                    {item.id === "profile"
                      ? "You"
                      : item.id === "matches"
                        ? "Chats"
                        : item.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
      {legalSheet}
      <Sheet
        title="Your kind of connection."
        visible={dialog === "filters"}
        onClose={() => setDialog(null)}
      >
        <Text style={shared.muted}>
          Set your age range and optional city. Your gender preferences are in
          Edit profile.
        </Text>
        <View style={[shared.row, { gap: 20 }]}>
          <View style={{ flex: 1 }}>
            <Field
              label="Minimum age"
              keyboardType="number-pad"
              value={String(filterDraft.minAge)}
              onChangeText={(v) =>
                setFilterDraft((f) => ({ ...f, minAge: Number(v) || 0 }))
              }
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Maximum age"
              keyboardType="number-pad"
              value={String(filterDraft.maxAge)}
              onChangeText={(v) =>
                setFilterDraft((f) => ({ ...f, maxAge: Number(v) || 0 }))
              }
            />
          </View>
        </View>
        <Field
          label="City · optional"
          value={filterDraft.location}
          placeholder="Anywhere"
          onChangeText={(v) => setFilterDraft((f) => ({ ...f, location: v }))}
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
          Apply preferences
        </Button>
        <Button
          secondary
          compact
          onPress={() => setFilterDraft(initialFilters)}
        >
          Reset preferences
        </Button>
      </Sheet>
      <Sheet
        title="A little more possibility."
        visible={dialog === "membership"}
        onClose={() => setDialog(null)}
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
        title="Stop future renewals?"
        visible={dialog === "cancel"}
        onClose={() => setDialog("membership")}
      >
        <Text style={shared.body}>
          Your already paid access continues until the current period ends.
          Cancelling stops future automatic renewal payments.
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
          Cancel automatic renewal
        </Button>
        <Button secondary onPress={() => setDialog("membership")}>
          Keep membership
        </Button>
        {error && <Notice text={error} error />}
      </Sheet>
      <Sheet
        title={selected ? `${selected.name}, ${selected.age}` : ""}
        visible={!!selected}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <View style={[shared.row, { gap: 8 }]}>
              <Badge>
                {selected.demo ? "FICTIONAL DEMO PROFILE" : selected.intent}
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
                {selected.location} · {selected.gender}
              </Text>
            </View>
            <Text style={shared.body}>{selected.bio}</Text>
            <View>
              <Text style={[shared.label, { marginBottom: 12 }]}>
                LOOKING FOR
              </Text>
              <Text style={shared.body}>{selected.intent}</Text>
            </View>
            <Chips
              values={selected.interests}
              selected={selected.interests}
              onChange={() => {}}
            />
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
                ? "Like back"
                : "Like profile"}
            </Button>
            <Button
              secondary
              onPress={() => openSafety(selected.id, selected.name)}
            >
              Report or block
            </Button>
            {error && <Notice text={error} error />}
          </>
        )}
      </Sheet>
      <Sheet
        title={
          safety ? `Your connection with ${safety.name}` : "Safety options"
        }
        visible={dialog === "safety"}
        onClose={() => setDialog(null)}
      >
        <Text style={shared.muted}>
          {demo
            ? "These actions affect this demo session only. No real report is submitted."
            : "Blocking removes this connection and stops further likes and messages between you."}
        </Text>
        <Field
          label="Reason for reporting"
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
          Submit report
        </Button>
        <Button
          secondary
          busy={busy}
          onPress={() => safetyAction("block")}
          icon="ban-outline"
        >
          Block profile
        </Button>
        {chat && (
          <Button secondary busy={busy} onPress={() => safetyAction("unmatch")}>
            End this match
          </Button>
        )}
        {error && <Notice error text={error} />}
      </Sheet>
      <Sheet
        title="A mutual little spark."
        visible={dialog === "match"}
        onClose={() => setDialog(null)}
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
              You and {newMatch.name}
              {"\n"}liked each other.
            </Text>
            <Text style={[shared.muted, { textAlign: "center" }]}>
              {demo
                ? "A fictional demo match. Your practice messages aren’t sent to anyone."
                : "A shared hello could be the beginning of something good."}
            </Text>
            <Button
              onPress={() => {
                setDialog(null);
                setTab("matches");
                const match = matches.find((m) =>
                  m.members.includes(newMatch.id),
                );
                if (match) setChat(match);
              }}
            >
              Say hello
            </Button>
            <Button secondary onPress={() => setDialog(null)}>
              Keep discovering
            </Button>
          </>
        )}
      </Sheet>
      <Sheet
        title="Delete your account?"
        visible={dialog === "delete"}
        onClose={() => setDialog(null)}
      >
        <Text style={shared.body}>
          This permanently removes your profile, likes, matches, conversation
          data and sign-in account. You’ll need to sign in with Google again to
          confirm ownership. When payments are connected, we first ask the
          provider to cancel any subscription or pending mandate, or confirm
          none exists. A known subscription also requires this check if payments
          are currently unavailable. If the provider cannot confirm
          cancellation, deletion stops.
        </Text>
        {membership?.status === "active" && (
          <Notice
            error
            text="Cancel automatic renewal in Membership before deleting your account. Deletion does not itself cancel billing."
          />
        )}
        <Field
          label="Type DELETE to confirm"
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
              await deleteAccountSafely(user, membership, paymentConfigured, {
                reauthenticate: reauthenticateGoogle,
                cancelBilling: cancelMembership,
                deleteData: deleteAccountData,
                deleteAuth: deleteAuthUser,
              });
              setDialog(null);
              setProfile(null);
            })
          }
        >
          Permanently delete account
        </Button>
        {error && <Notice error text={error} />}
      </Sheet>
    </View>
  );
}
const a = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: 236,
    borderRightWidth: 1,
    borderColor: colors.line,
    padding: 27,
    paddingTop: 32,
    backgroundColor: "#F3F3EB",
  },
  logo: {
    fontFamily: fonts.serif,
    fontSize: 43,
    letterSpacing: -2,
    color: colors.ink,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 13,
  },
  count: {
    backgroundColor: colors.paper,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  sidebarNote: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#D8DCCE",
    borderRadius: 17,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 20,
    backgroundColor: colors.soft,
  },
  topbar: {
    minHeight: 88,
    borderBottomWidth: 1,
    borderColor: colors.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  demoBar: {
    backgroundColor: "#EAF0D5",
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  main: { flex: 1, maxWidth: 1120, width: "100%", alignSelf: "center" },
  bottom: {
    paddingTop: 11,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paper,
    flexDirection: "row",
  },
  mobileIcon: {
    width: 50,
    height: 31,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  matchPhoto: {
    width: 100,
    height: 130,
    borderRadius: 50,
    backgroundColor: colors.soft,
  },
  matchHeart: {
    width: 55,
    height: 55,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lime,
  },
});
