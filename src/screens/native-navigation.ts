export type AppTab = "discover" | "likes" | "matches" | "profile";
export const tabPath = (tab: AppTab) =>
  (
    ({
      discover: "/(tabs)/discover",
      likes: "/(tabs)/likes",
      matches: "/(tabs)/connections",
      profile: "/(tabs)/profile",
    }) as const
  )[tab];
type SessionGate = {
  authReady: boolean;
  uid: string;
  profileOwner: string | null;
  hasProfile: boolean;
  editing: boolean;
  loadFailed: boolean;
};
export function entryGate(
  state: SessionGate,
): "starting" | "welcome" | "loading" | "error" | "onboarding" | "ready" {
  if (!state.authReady) return "starting";
  if (!state.uid) return "welcome";
  if (state.loadFailed) return "error";
  if (state.profileOwner !== state.uid) return "loading";
  if (!state.hasProfile || state.editing) return "onboarding";
  return "ready";
}
export function conversationFallback(ready: boolean, hasConversation: boolean) {
  return !ready ? "/" : !hasConversation ? tabPath("matches") : null;
}
