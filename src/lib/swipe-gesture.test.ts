import assert from "node:assert/strict";
import test from "node:test";
import { swipeDirection } from "./model.ts";
import {
  commitSwipeTransaction,
  gestureSwipeDirection,
} from "./swipe-gesture.ts";

test("UI swipe thresholds preserve the model contract including velocity units and reversals", () => {
  for (const dx of [
    -121,
    -120,
    -119,
    -26,
    -25,
    -24,
    0,
    24,
    25,
    26,
    119,
    120,
    121,
    NaN,
  ]) {
    for (const vx of [-1, -0.65, -0.649, 0, 0.649, 0.65, 1, Infinity]) {
      assert.equal(
        gestureSwipeDirection(dx, vx * 1000),
        swipeDirection(dx, vx),
        `${dx}, ${vx}`,
      );
    }
  }
});

test("one pending swipe commits and signals feedback once; rejection unlocks a retry", async () => {
  const transaction = { locked: false };
  let reject!: (reason: Error) => void;
  let requests = 0;
  let feedback = 0;
  let recoveries = 0;
  const request = new Promise<void>((_resolve, rejectRequest) => {
    reject = rejectRequest;
  });
  const first = commitSwipeTransaction(
    transaction,
    "like",
    () => {
      requests += 1;
      return request;
    },
    () => {
      feedback += 1;
    },
    () => {
      recoveries += 1;
    },
  );
  assert.equal(
    await commitSwipeTransaction(
      transaction,
      "pass",
      async () => {
        requests += 1;
      },
      () => {
        feedback += 1;
      },
      () => {
        recoveries += 1;
      },
    ),
    false,
  );
  assert.equal(requests, 1);
  assert.equal(feedback, 1);
  reject(new Error("offline"));
  await assert.rejects(first, /offline/);
  assert.equal(transaction.locked, false);
  assert.equal(recoveries, 1);
  assert.equal(
    await commitSwipeTransaction(
      transaction,
      "pass",
      async () => {
        requests += 1;
      },
      () => {
        feedback += 1;
      },
      () => {
        recoveries += 1;
      },
    ),
    true,
  );
  assert.equal(requests, 2);
  assert.equal(feedback, 2);
  assert.equal(recoveries, 2);
});
