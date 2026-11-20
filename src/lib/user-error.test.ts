import assert from "node:assert/strict";
import test from "node:test";
import { userErrorMessage } from "./user-error.ts";

test("service failures give recovery instructions without exposing backend wording", () => {
  const failure = (code: string) => Object.assign(new Error("Firebase: private implementation detail"), { code });
  assert.equal(userErrorMessage(failure("auth/network-request-failed")), "Check your connection and try again.");
  assert.equal(userErrorMessage(failure("unavailable")), "Check your connection and try again.");
  assert.equal(userErrorMessage(failure("permission-denied")), "You don’t have permission to complete this action.");
  assert.equal(userErrorMessage(failure("auth/user-token-expired")), "Your session has expired. Sign in again.");
  assert.equal(userErrorMessage(failure("unknown-code")), "Something went wrong. Please try again.");
});

test("business validation keeps its specific message and non-errors have a safe fallback", () => {
  assert.equal(userErrorMessage(new Error("An active membership is required to send messages.")), "An active membership is required to send messages.");
  assert.equal(userErrorMessage(null), "Something went wrong. Please try again.");
});
