import assert from "node:assert/strict";
import test from "node:test";
import {
  entryGate,
  tabPath,
  conversationFallback,
} from "./native-navigation.ts";

test("all permanent tabs have native routes and a conversation returns to Chats", () => {
  assert.equal(tabPath("discover"), "/(tabs)/discover");
  assert.equal(tabPath("likes"), "/(tabs)/likes");
  assert.equal(tabPath("matches"), "/(tabs)/connections");
  assert.equal(tabPath("profile"), "/(tabs)/profile");
  assert.equal(conversationFallback(true, true), null);
  assert.equal(conversationFallback(true, false), "/(tabs)/connections");
  assert.equal(conversationFallback(false, true), "/");
});
test("session gates never expose a previous account profile and preserve loading/error/edit flows", () => {
  const state = {
    authReady: true,
    uid: "alice",
    profileOwner: "alice",
    hasProfile: true,
    editing: false,
    loadFailed: false,
  };
  assert.equal(entryGate(state), "ready");
  assert.equal(entryGate({ ...state, authReady: false }), "starting");
  assert.equal(entryGate({ ...state, uid: "" }), "welcome");
  assert.equal(entryGate({ ...state, uid: "bob" }), "loading");
  assert.equal(entryGate({ ...state, loadFailed: true }), "error");
  assert.equal(entryGate({ ...state, editing: true }), "onboarding");
  assert.equal(entryGate({ ...state, hasProfile: false }), "onboarding");
});
