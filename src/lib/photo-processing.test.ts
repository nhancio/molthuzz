import assert from "node:assert/strict";
import test from "node:test";
import {
  boundedPhotoSize,
  preparePhoto,
  processAndUploadPhoto,
  MAX_PHOTO_BYTES,
  PHOTO_PREPARE_ERROR,
  PHOTO_UPLOAD_ERROR,
  type PhotoAdapter,
} from "./photo-processing.ts";

function fakeAdapter(
  sizes = [1024],
  dimensions = { width: 1600, height: 1200 },
) {
  const calls = {
    opened: [] as unknown[][],
    resized: [] as { width: number; height: number }[],
    qualities: [] as number[],
    formats: [] as string[],
    removed: [] as string[],
    releasedImages: 0,
    releasedContexts: 0,
    reads: 0,
  };
  let index = 0;
  let current = { ...dimensions };
  const savedSizes = new Map<string, number>();
  const adapter: PhotoAdapter = {
    open(uri, bounds) {
      calls.opened.push([uri, bounds]);
      return {
        resize(size) {
          calls.resized.push(size);
          current = { ...size };
        },
        async render() {
          return {
            ...current,
            async saveJpeg(quality) {
              const uri = `file:///optimized-${index}.jpg`;
              calls.qualities.push(quality);
              calls.formats.push("jpeg");
              savedSizes.set(uri, sizes[Math.min(index++, sizes.length - 1)]);
              return uri;
            },
            release() {
              calls.releasedImages += 1;
            },
          };
        },
        release() {
          calls.releasedContexts += 1;
        },
      };
    },
    size(uri) {
      return savedSizes.get(uri)!;
    },
    async bytes(uri) {
      calls.reads += 1;
      return new Uint8Array(savedSizes.get(uri)!);
    },
    remove(uri) {
      calls.removed.push(uri);
    },
  };
  return { adapter, calls };
}

test("giant portrait and landscape preserve aspect ratio at 1600px; small photos never upscale", () => {
  assert.deepEqual(boundedPhotoSize(12000, 8000, 1600), {
    width: 1600,
    height: 1067,
  });
  assert.deepEqual(boundedPhotoSize(8000, 12000, 1600), {
    width: 1067,
    height: 1600,
  });
  assert.deepEqual(boundedPhotoSize(640, 480, 1600), {
    width: 640,
    height: 480,
  });
});

test("HEIC source is decoded with native bounds and normalized without reading/rejecting original bytes", async () => {
  const { adapter, calls } = fakeAdapter();
  const bytes = await preparePhoto("file:///original-80mb.heic", adapter);
  assert.equal(bytes.byteLength, 1024);
  assert.deepEqual(calls.opened, [
    ["file:///original-80mb.heic", { maxWidth: 1600, maxHeight: 1600 }],
  ]);
  assert.deepEqual(calls.formats, ["jpeg"]);
  assert.deepEqual(calls.removed, ["file:///optimized-0.jpg"]);
  assert.equal(calls.releasedImages, 1);
  assert.equal(calls.releasedContexts, 1);
});

test("oversize JPEG retries quality then dimensions, only reading an accepted bounded output", async () => {
  const { adapter, calls } = fakeAdapter([
    MAX_PHOTO_BYTES + 1,
    MAX_PHOTO_BYTES + 1,
    MAX_PHOTO_BYTES + 1,
    MAX_PHOTO_BYTES,
  ]);
  const bytes = await preparePhoto("file:///large.png", adapter);
  assert.equal(bytes.byteLength, MAX_PHOTO_BYTES);
  assert.equal(calls.qualities.length, 4);
  assert.ok(calls.qualities[1] < calls.qualities[0]);
  assert.deepEqual(calls.resized, [{ width: 1200, height: 900 }]);
  assert.equal(calls.reads, 1);
  assert.equal(calls.removed.length, 4);
  assert.equal(calls.releasedImages, 2);
  assert.equal(calls.releasedContexts, 1);
});

test("unbounded or empty results never upload; errors release resources and a later retry can succeed", async () => {
  const { adapter, calls } = fakeAdapter([MAX_PHOTO_BYTES + 1]);
  let uploaded = false;
  await assert.rejects(
    processAndUploadPhoto("file:///large.heic", adapter, async () => {
      uploaded = true;
      return "https://photo";
    }),
    { message: PHOTO_PREPARE_ERROR },
  );
  assert.equal(uploaded, false);
  assert.ok(calls.qualities.length <= 8);
  assert.equal(calls.removed.length, calls.qualities.length);
  assert.equal(calls.releasedContexts, 1);
  const empty = fakeAdapter([0]);
  await assert.rejects(preparePhoto("file:///empty.jpg", empty.adapter), {
    message: PHOTO_PREPARE_ERROR,
  });
  const retry = fakeAdapter();
  assert.equal(
    await processAndUploadPhoto(
      "file:///large.heic",
      retry.adapter,
      async (bytes) => {
        assert.equal(bytes.byteLength, 1024);
        return "https://photo";
      },
    ),
    "https://photo",
  );
});

test("native decode errors and connection failures expose only their agreed friendly message", async () => {
  const broken = fakeAdapter();
  broken.adapter.open = () => {
    throw new Error("internal decoder details");
  };
  await assert.rejects(preparePhoto("file:///bad", broken.adapter), {
    message: PHOTO_PREPARE_ERROR,
  });
  const { adapter, calls } = fakeAdapter();
  await assert.rejects(
    processAndUploadPhoto("file:///fine.heic", adapter, async () => {
      throw new Error("storage/internal");
    }),
    { message: PHOTO_UPLOAD_ERROR },
  );
  assert.equal(calls.releasedContexts, 1);
  assert.equal(calls.removed.length, 1);
});

test("render, encode and byte-read failures clean up every acquired native resource", async () => {
  for (const failure of ["render", "encode", "bytes"] as const) {
    const { adapter, calls } = fakeAdapter();
    const open = adapter.open;
    adapter.open = (uri, bounds) => {
      const context = open(uri, bounds);
      const render = context.render;
      context.render = async () => {
        if (failure === "render") throw new Error("render failed");
        const image = await render();
        if (failure === "encode")
          image.saveJpeg = async () => {
            throw new Error("encode failed");
          };
        return image;
      };
      return context;
    };
    if (failure === "bytes")
      adapter.bytes = async () => {
        throw new Error("read failed");
      };
    await assert.rejects(preparePhoto("file:///source.heic", adapter), {
      message: PHOTO_PREPARE_ERROR,
    });
    assert.equal(calls.releasedContexts, 1, failure);
    assert.equal(calls.releasedImages, failure === "render" ? 0 : 1, failure);
    assert.equal(calls.removed.length, failure === "bytes" ? 1 : 0, failure);
  }
});

test("final byte length is rechecked even when the file metadata claims a smaller result", async () => {
  const { adapter, calls } = fakeAdapter();
  adapter.bytes = async () => new Uint8Array(MAX_PHOTO_BYTES + 1);
  let uploads = 0;
  await assert.rejects(
    processAndUploadPhoto("file:///source", adapter, async () => {
      uploads += 1;
      return "https://photo";
    }),
    { message: PHOTO_PREPARE_ERROR },
  );
  assert.equal(uploads, 0);
  assert.equal(calls.removed.length, 7);
  assert.equal(calls.releasedContexts, 1);
});
