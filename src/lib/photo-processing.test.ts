import assert from "node:assert/strict";
import test from "node:test";
import { initializeApp, deleteApp } from "firebase/app";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import {
  boundedPhotoSize,
  preparePhoto,
  processAndUploadPhoto,
  MAX_PHOTO_BYTES,
  PHOTO_PREPARE_ERROR,
  PHOTO_UPLOAD_ERROR,
  PHOTO_AUTH_ERROR,
  PHOTO_PERMISSION_ERROR,
  photoUploadMessage,
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

test("Firebase multipart accepts a native Blob where React Native rejects typed array parts", async () => {
  const OriginalBlob = globalThis.Blob;
  class ReactNativeBlob {
    readonly size: number;
    readonly type: string;
    constructor(parts: (string | ReactNativeBlob)[], options?: { type?: string }) {
      if (parts.some((part) => part instanceof ArrayBuffer || ArrayBuffer.isView(part)))
        throw new Error("Creating blobs from 'ArrayBuffer' and 'ArrayBufferView' are not supported");
      this.size = parts.reduce((sum, part) => sum + (typeof part === "string" ? part.length : part.size), 0);
      this.type = options?.type ?? "";
    }
    close() {}
  }
  const app = initializeApp({ apiKey: "test", appId: "test", projectId: "test", storageBucket: "test.appspot.com" }, "native-blob-regression");
  const storage = getStorage(app);
  const captured: unknown[] = [];
  const service = storage as typeof storage & { makeRequestWithTokens: (request: { body: unknown }) => Promise<unknown> };
  service.makeRequestWithTokens = async (request) => {
    captured.push(request.body);
    return {};
  };
  globalThis.Blob = ReactNativeBlob as unknown as typeof Blob;
  try {
    const destination = ref(storage, "profiles/test/photo.jpg");
    assert.throws(() => uploadBytes(destination, new Uint8Array([1, 2, 3])), /ArrayBuffer/);
    assert.equal(captured.length, 0);
    await uploadBytes(destination, new ReactNativeBlob(["jpeg"]) as unknown as Blob, { contentType: "image/jpeg" });
    assert.equal(captured.length, 1);
    assert.ok(captured[0] instanceof ReactNativeBlob);
  } finally {
    globalThis.Blob = OriginalBlob;
    await deleteApp(app);
  }
});

test("native payload is closed after successful and failed uploads; auth and permission errors remain safe and inspectable", async () => {
  for (const code of [undefined, "storage/unauthenticated", "storage/unauthorized"] as const) {
    const { adapter } = fakeAdapter();
    let closed = 0;
    const blob = Object.assign(new Blob(["jpeg"]), { close: () => { closed += 1; } });
    const blobAdapter = { ...adapter, bytes: async () => blob };
    if (!code) {
      assert.equal(await processAndUploadPhoto("file:///photo", blobAdapter, async () => "https://photo"), "https://photo");
    } else {
      const cause = Object.assign(new Error("private transport details"), { code });
      await assert.rejects(
        processAndUploadPhoto("file:///photo", blobAdapter, async () => { throw cause; }),
        (error: unknown) => {
          assert.ok(error instanceof Error);
          assert.equal(error.message, code === "storage/unauthenticated" ? PHOTO_AUTH_ERROR : PHOTO_PERMISSION_ERROR);
          assert.equal((error as Error & { code: string }).code, code);
          assert.equal(error.cause, cause);
          assert.equal(photoUploadMessage(error), error.message);
          return true;
        },
      );
    }
    assert.equal(closed, 1);
  }
  assert.equal(photoUploadMessage(new Error("private transport details")), PHOTO_UPLOAD_ERROR);
});

test("oversized native Blobs are closed before the next JPEG attempt", async () => {
  const { adapter, calls } = fakeAdapter();
  let closed = 0;
  let reads = 0;
  const blobAdapter = {
    ...adapter,
    async bytes() {
      reads += 1;
      return Object.assign(new Blob([new Uint8Array(reads === 1 ? MAX_PHOTO_BYTES + 1 : 1)]), {
        close: () => { closed += 1; },
      });
    },
  };
  await processAndUploadPhoto("file:///photo", blobAdapter, async () => "https://photo");
  assert.equal(reads, 2);
  assert.equal(closed, 2);
  assert.equal(calls.removed.length, 2);
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
