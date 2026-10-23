import assert from "node:assert/strict";
import test from "node:test";
import { uploadSelectedPhotos, remainingPhotoSlots, type SelectedPhoto } from "./photo-batch.ts";

test("photo batch uploads in selection order and retries failures without reuploading successes", async () => {
  const picks: SelectedPhoto[] = [1, 2, 3].map((id) => ({ id: String(id), uri: `local:${id}`, width: 9000, height: 6000 }));
  let remaining = [...picks];
  let gallery = [...picks];
  const uploaded: string[] = [];
  const attempts: string[] = [];
  const progress: number[] = [];
  let active = 0;
  let failSecond = true;
  const run = () => uploadSelectedPhotos(remaining, {
    upload: async (photo) => {
      active += 1;
      assert.equal(active, 1);
      attempts.push(photo.id);
      await Promise.resolve();
      active -= 1;
      if (photo.id === "2" && failSecond) throw Error("connection lost");
      return `https://example.com/${photo.id}.jpg`;
    },
    onUploaded: (photo, url) => {
      uploaded.push(url);
      gallery = gallery.map((entry) => entry.id === photo.id ? { ...entry, url } : entry);
      remaining = remaining.filter(({ id }) => id !== photo.id);
    },
    onFailed: (photo) => { assert.equal(photo.id, "2"); },
    onProgress: (current) => { progress.push(current); },
  });
  await run();
  assert.deepEqual(attempts, ["1", "2", "3"]);
  assert.deepEqual(remaining.map(({ id }) => id), ["2"]);
  assert.deepEqual(uploaded, ["https://example.com/1.jpg", "https://example.com/3.jpg"]);
  assert.deepEqual(progress, [1, 2, 3]);
  failSecond = false;
  await run();
  assert.deepEqual(attempts, ["1", "2", "3", "2"]);
  assert.deepEqual(remaining, []);
  assert.equal(uploaded.length, 3);
  assert.deepEqual(gallery.map(({ url }) => url), ["https://example.com/1.jpg", "https://example.com/2.jpg", "https://example.com/3.jpg"]);
});

test("photo selection accounts for both existing and unresolved photos within six slots", () => {
  assert.equal(remainingPhotoSlots(2, 3), 1);
  assert.equal(remainingPhotoSlots(6, 0), 0);
  assert.equal(remainingPhotoSlots(3, 3), 0);
  assert.equal(remainingPhotoSlots(0, 0), 6);
});
