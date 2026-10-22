import assert from "node:assert/strict";
import test from "node:test";
import { setupBackAction } from "./setup-back.ts";

const idle = { busy: false, uploading: false, datePickerOpen: false };

test("form Back protects pending save or photo work before dismissal or exit", () => {
  for (const pending of [{ busy: true }, { uploading: true }]) {
    assert.equal(setupBackAction({ ...idle, ...pending }), "stay");
    assert.equal(setupBackAction({ ...idle, ...pending, datePickerOpen: true }), "stay");
  }
});

test("form Back dismisses the date picker before exiting the single form", () => {
  assert.equal(setupBackAction({ ...idle, datePickerOpen: true }), "dismiss-date");
  assert.equal(setupBackAction(idle), "exit");
});
