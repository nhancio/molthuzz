import assert from "node:assert/strict";
import test from "node:test";
import { profileFormError, makeMainPhoto } from "./profile-form.ts";
import type { ProfileInput } from "../lib/contracts.ts";

const valid: ProfileInput = {
  name: "Asha", birthDate: "1998-08-24", gender: "Woman", interestedIn: ["Man"],
  location: "Bengaluru", bio: "Coffee and books", photos: ["https://example.com/a.jpg"],
  interests: ["Books"], intent: "A relationship", prompts: [],
};

test("profile form reveals the field rejected by the existing model", () => {
  const cases: [keyof ProfileInput, unknown][] = [
    ["name", ""], ["birthDate", "2015-01-01"], ["gender", "Unknown"],
    ["interestedIn", []], ["location", ""], ["bio", ""], ["photos", []],
    ["interests", []], ["intent", "Unknown"], ["prompts", [{ question: "Hello", answer: "" }]],
  ];
  for (const [field, value] of cases) {
    assert.equal(profileFormError({ ...valid, [field]: value } as ProfileInput)?.field, field);
  }
  assert.equal(profileFormError(valid), null);
  assert.equal(profileFormError({ ...valid, name: "", photos: [] })?.field, "name");
});

test("unresolved local photos block an otherwise valid profile without silently dropping them", () => {
  const error = profileFormError(valid, 2);
  assert.equal(error?.field, "photos");
  assert.equal(error?.message, "Finish uploading or remove the selected photos before saving.");
  assert.equal(profileFormError({ ...valid, name: "" }, 2)?.field, "name");
});

test("choosing a main photo preserves every photo and does not mutate the draft", () => {
  const photos = ["one", "two", "three"];
  assert.deepEqual(makeMainPhoto(photos, 2), ["three", "one", "two"]);
  assert.deepEqual(photos, ["one", "two", "three"]);
  assert.deepEqual(makeMainPhoto(photos, 0), photos);
  assert.deepEqual(makeMainPhoto(photos, 7), photos);
});
