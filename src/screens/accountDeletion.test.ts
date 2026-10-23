import assert from "node:assert/strict";
import test from "node:test";
import type { AuthUser, Membership } from "../lib/contracts.ts";
import { deleteAccountSafely } from "./accountDeletion.ts";

const user: AuthUser = {
  uid: "account-owner",
  displayName: null,
  email: null,
  photoURL: null,
  getIdToken: async () => "token",
};
function services(events: string[], cancellationFails = false) {
  return {
    reauthenticate: async () => {
      events.push("reauthenticate");
    },
    cancelBilling: async (account: AuthUser) => {
      assert.equal(account.uid, user.uid);
      events.push("cancel");
      if (cancellationFails) throw new Error("Provider unavailable");
    },
    deleteData: async (uid: string) => {
      assert.equal(uid, user.uid);
      events.push("data");
    },
    deleteAuth: async () => {
      events.push("auth");
    },
  };
}

test("configured billing checks pending mandates even before an entitlement exists", async () => {
  for (const membership of [
    null,
    { status: "inactive", currentPeriodEnd: 0 } satisfies Membership,
  ]) {
    const events: string[] = [];
    await deleteAccountSafely(user, membership, true, services(events));
    assert.deepEqual(events, ["reauthenticate", "cancel", "data", "auth"]);
  }
});

test("known subscription always requires cancellation even when billing is disabled", async () => {
  for (const status of ["active", "cancelled", "inactive"] as const) {
    const events: string[] = [];
    await deleteAccountSafely(
      user,
      { status, subscriptionId: "pending-mandate", currentPeriodEnd: 0 },
      false,
      services(events),
    );
    assert.deepEqual(events, ["reauthenticate", "cancel", "data", "auth"]);
  }
});

test("provider cancellation failure preserves profile and authentication", async () => {
  for (const [configured, membership] of [
    [true, null],
    [
      false,
      {
        status: "inactive",
        subscriptionId: "pending-mandate",
        currentPeriodEnd: 0,
      },
    ],
  ] as const) {
    const events: string[] = [];
    await assert.rejects(
      deleteAccountSafely(user, membership, configured, services(events, true)),
      /Provider unavailable/,
    );
    assert.deepEqual(events, ["reauthenticate", "cancel"]);
  }
});

test("fresh app with billing disabled and no subscription can delete without a provider", async () => {
  const events: string[] = [];
  await deleteAccountSafely(user, null, false, services(events));
  assert.deepEqual(events, ["reauthenticate", "data", "auth"]);
});

test("reauthentication failure stops all billing and destructive operations", async () => {
  const events: string[] = [];
  const actions = services(events);
  actions.reauthenticate = async () => {
    throw new Error("Sign-in failed");
  };
  await assert.rejects(
    deleteAccountSafely(user, null, true, actions),
    /Sign-in failed/,
  );
  assert.deepEqual(events, []);
});
