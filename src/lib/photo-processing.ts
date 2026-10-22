export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const PHOTO_PREPARE_ERROR =
  "We couldn’t prepare this photo. Choose another image.";
export const PHOTO_UPLOAD_ERROR =
  "We couldn’t upload this photo. Check your connection and try again.";
const MAX_PHOTO_EDGE = 1600;

export type PhotoSize = { width: number; height: number };
type NativePhoto = PhotoSize & {
  saveJpeg(quality: number): Promise<string>;
  release(): void;
};
type PhotoContext = {
  resize(size: PhotoSize): void;
  render(): Promise<NativePhoto>;
  release(): void;
};
/** The native boundary stays small so byte limits and cleanup can run in Node tests. */
export type PhotoAdapter = {
  open(
    uri: string,
    bounds: { maxWidth: number; maxHeight: number },
  ): PhotoContext;
  size(uri: string): number;
  bytes(uri: string): Promise<Uint8Array>;
  remove(uri: string): void;
};

export function boundedPhotoSize(
  width: number,
  height: number,
  maxEdge: number,
): PhotoSize {
  if (
    ![width, height, maxEdge].every(
      (value) => Number.isInteger(value) && value > 0,
    )
  )
    throw new Error(PHOTO_PREPARE_ERROR);
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

// Encode each attempt from native pixels rather than recompressing a previous JPEG.
const attempts = [
  { edge: 1600, quality: 0.86 },
  { edge: 1600, quality: 0.68 },
  { edge: 1600, quality: 0.5 },
  { edge: 1200, quality: 0.46 },
  { edge: 900, quality: 0.42 },
  { edge: 640, quality: 0.38 },
  { edge: 320, quality: 0.34 },
];
function release(resource: { release(): void } | undefined) {
  try {
    resource?.release();
  } catch {
    /* Cleanup must not mask the photo result. */
  }
}

export async function preparePhoto(
  uri: string,
  adapter: PhotoAdapter,
): Promise<Uint8Array> {
  let context: PhotoContext | undefined;
  let image: NativePhoto | undefined;
  try {
    // Decode with bounded native memory before inspecting bytes. HEIC and large originals are valid sources.
    context = adapter.open(uri, {
      maxWidth: MAX_PHOTO_EDGE,
      maxHeight: MAX_PHOTO_EDGE,
    });
    image = await context.render();
    for (const attempt of attempts) {
      const size = boundedPhotoSize(image.width, image.height, attempt.edge);
      if (size.width !== image.width || size.height !== image.height) {
        context.resize(size);
        release(image);
        image = undefined;
        image = await context.render();
      }
      // Recheck the actual decoder result rather than trusting the requested resize.
      if (image.width !== size.width || image.height !== size.height)
        throw new Error(PHOTO_PREPARE_ERROR);
      const temporaryUri = await image.saveJpeg(attempt.quality);
      try {
        const byteSize = adapter.size(temporaryUri);
        if (!Number.isFinite(byteSize) || byteSize <= 0)
          throw new Error(PHOTO_PREPARE_ERROR);
        if (byteSize > MAX_PHOTO_BYTES) continue;
        const bytes = await adapter.bytes(temporaryUri);
        if (bytes.byteLength > 0 && bytes.byteLength <= MAX_PHOTO_BYTES)
          return bytes;
      } finally {
        try {
          adapter.remove(temporaryUri);
        } catch {
          /* The cache can reclaim a file if immediate cleanup fails. */
        }
      }
    }
    throw new Error(PHOTO_PREPARE_ERROR);
  } catch {
    throw new Error(PHOTO_PREPARE_ERROR);
  } finally {
    release(image);
    release(context);
  }
}

export async function processAndUploadPhoto(
  uri: string,
  adapter: PhotoAdapter,
  upload: (bytes: Uint8Array) => Promise<string>,
): Promise<string> {
  const bytes = await preparePhoto(uri, adapter);
  try {
    return await upload(bytes);
  } catch {
    throw new Error(PHOTO_UPLOAD_ERROR);
  }
}
