import assert from "node:assert/strict";
import test from "node:test";
import { collectionReducer, initialCollection } from "./collection-state.ts";

test("initial loading is distinct from a successful empty result", () => {
  const initial = initialCollection<string>();
  assert.equal(initial.loading, true);
  const empty = collectionReducer(initial, { type: "success", data: [] });
  assert.deepEqual(empty, { data: [], loading: false, error: "" });
});

test("refresh and failure preserve content; retry clears errors; a new session clears content", () => {
  const loaded = collectionReducer(initialCollection<string>(), { type: "success", data: ["a"] });
  const refreshing = collectionReducer(loaded, { type: "start" });
  assert.deepEqual(refreshing, { data: ["a"], loading: true, error: "" });
  const failed = collectionReducer(refreshing, { type: "failure", error: "offline" });
  assert.deepEqual(failed, { data: ["a"], loading: false, error: "offline" });
  assert.deepEqual(collectionReducer(failed, { type: "start" }), refreshing);
  assert.deepEqual(collectionReducer(failed, { type: "reset" }), initialCollection());
});

test("local decisions update content without concealing a subscription error", () => {
  const state = { data: ["a", "b"], loading: false, error: "offline" };
  assert.deepEqual(collectionReducer(state, { type: "update", update: data => data.filter(id => id !== "a") }), {
    ...state, data: ["b"],
  });
  assert.deepEqual(state.data, ["a", "b"]);
});
