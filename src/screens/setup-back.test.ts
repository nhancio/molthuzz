import assert from "node:assert/strict";
import test from "node:test";
import { setupBackAction } from "./setup-back.ts";

const idle = { busy: false, uploading: false, datePickerOpen: false, step: 0 };

test("setup Back protects pending work before dismissing or navigating", () => {
  for (const pending of [{ busy: true }, { uploading: true }]) {
    for (const step of [0, 1, 9]) {
      assert.equal(setupBackAction({ ...idle, ...pending, step }), "stay");
      assert.equal(setupBackAction({ ...idle, ...pending, step, datePickerOpen: true }), "stay");
    }
  }
});

test("setup Back dismisses the date picker before leaving its step", () => {
  assert.equal(setupBackAction({ ...idle, step: 1, datePickerOpen: true }), "dismiss-date");
});

test("setup Back moves every later step back and exits only the first step", () => {
  assert.equal(setupBackAction(idle), "exit");
  for (let step = 1; step < 10; step += 1) {
    assert.equal(setupBackAction({ ...idle, step }), "previous");
  }
});
