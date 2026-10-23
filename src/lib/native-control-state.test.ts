import assert from "node:assert/strict";
import test from "node:test";
import { nativeSelectionChange } from "./native-control-state.ts";

test("repeated native checkbox callbacks are idempotent and preserve canonical values", () => {
  const values = ["Woman", "Man", "Non-binary"];
  const selected = ["Woman"];
  const next = nativeSelectionChange({
    values,
    selected,
    value: "Non-binary",
    multiple: true,
    checked: true,
  });
  assert.deepEqual(next, ["Woman", "Non-binary"]);
  assert.deepEqual(selected, ["Woman"]);
  assert.equal(
    nativeSelectionChange({
      values,
      selected: next!,
      value: "Non-binary",
      multiple: true,
      checked: true,
    }),
    null,
  );
  assert.deepEqual(
    nativeSelectionChange({
      values,
      selected: next!,
      value: "Woman",
      multiple: true,
      checked: false,
    }),
    ["Non-binary"],
  );
});

test("pending controls and stale or translated option callbacks cannot change canonical form data", () => {
  const values = ["A relationship", "Something casual"];
  const selected = ["A relationship"];
  assert.equal(
    nativeSelectionChange({
      values,
      selected,
      value: "Something casual",
      multiple: false,
      disabled: true,
    }),
    null,
  );
  assert.equal(
    nativeSelectionChange({
      values,
      selected,
      value: "एक रिश्ता",
      multiple: false,
    }),
    null,
  );
  assert.equal(
    nativeSelectionChange({
      values,
      selected,
      value: "A relationship",
      multiple: false,
    }),
    null,
  );
  assert.deepEqual(
    nativeSelectionChange({
      values,
      selected,
      value: "Something casual",
      multiple: false,
    }),
    ["Something casual"],
  );
});

test("selection limit blocks a ninth choice while retaining deselection and retry capacity", () => {
  const values = Array.from({ length: 9 }, (_, i) => `interest-${i}`);
  const selected = values.slice(0, 8);
  assert.equal(
    nativeSelectionChange({
      values,
      selected,
      value: values[8],
      multiple: true,
      checked: true,
      maxSelected: 8,
    }),
    null,
  );
  const smaller = nativeSelectionChange({
    values,
    selected,
    value: values[0],
    multiple: true,
    checked: false,
    maxSelected: 8,
  });
  assert.equal(smaller?.length, 7);
  const retry = nativeSelectionChange({
    values,
    selected: smaller!,
    value: values[8],
    multiple: true,
    checked: true,
    maxSelected: 8,
  });
  assert.equal(retry?.length, 8);
  assert.equal(retry?.at(-1), values[8]);
});
