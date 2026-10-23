export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const PHOTO_PREPARE_ERROR =
  "We couldn’t prepare this photo. Choose another image.";
export const PHOTO_UPLOAD_ERROR =
  "We couldn’t upload this photo. Check your connection and try again.";
export const PHOTO_AUTH_ERROR =
  "Your session has expired. Sign in again to upload your photo.";
export const PHOTO_PERMISSION_ERROR =
  "This account cannot upload the photo. Sign in and try again.";
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
type PhotoPayload = Uint8Array | Blob;
export type PhotoAdapter<Payload extends PhotoPayload = Uint8Array> = {
  open(
    uri: string,
    bounds: { maxWidth: number; maxHeight: number },
  ): PhotoContext;
  size(uri: string): number;
  bytes(uri: string): Promise<Payload>;
  remove(uri: string): void;
};

function payloadSize(payload: PhotoPayload): number {
  return payload instanceof Uint8Array ? payload.byteLength : payload.size;
}

function closePayload(payload: PhotoPayload | undefined): void {
  if (payload && "close" in payload && typeof payload.close === "function") {
    try {
      payload.close();
    } catch {
      /* Native blob cleanup must not hide the upload result. */
    }
  }
}

/** React Native's XHR Blob response is backed by its native Blob store. */
export function readNativePhotoBlob(
  uri: string,
  createRequest: () => XMLHttpRequest = () => new XMLHttpRequest(),
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const request = createRequest();
    const fail = () => {
      const response = request.response;
      if (response instanceof Blob) closePayload(response);
      reject(new Error("Could not read prepared photo"));
    };
    request.onload = () => {
      const response = request.response;
      // Native file handlers may report status 0 even for a completed local read.
      const statusOk = request.status >= 200 && request.status < 300 ||
        (request.status === 0 && uri.startsWith("file://"));
      if (!statusOk || !(response instanceof Blob) || response.size === 0) {
        fail();
        return;
      }
      resolve(response);
    };
    request.onerror = fail;
    request.ontimeout = fail;
    request.onabort = fail;
    try {
      request.open("GET", uri);
      request.responseType = "blob";
      request.timeout = 30000;
      request.send();
    } catch {
      fail();
    }
  });
}

export function photoUploadMessage(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  if (code === "storage/unauthenticated" || code === "auth/user-token-expired" || code === "auth/invalid-user-token")
    return PHOTO_AUTH_ERROR;
  if (code === "storage/unauthorized" || code === "permission-denied")
    return PHOTO_PERMISSION_ERROR;
  return PHOTO_UPLOAD_ERROR;
}

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

export async function preparePhoto<Payload extends PhotoPayload>(
  uri: string,
  adapter: PhotoAdapter<Payload>,
): Promise<Payload> {
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
        const payload = await adapter.bytes(temporaryUri);
        if (payloadSize(payload) > 0 && payloadSize(payload) <= MAX_PHOTO_BYTES)
          return payload;
        closePayload(payload);
      } finally {
        try {
          adapter.remove(temporaryUri);
        } catch {
          /* The cache can reclaim a file if immediate cleanup fails. */
        }
      }
    }
    throw new Error(PHOTO_PREPARE_ERROR);
  } catch (cause) {
    throw new Error(PHOTO_PREPARE_ERROR, { cause });
  } finally {
    release(image);
    release(context);
  }
}

export async function processAndUploadPhoto<Payload extends PhotoPayload>(
  uri: string,
  adapter: PhotoAdapter<Payload>,
  upload: (payload: Payload) => Promise<string>,
): Promise<string> {
  const payload = await preparePhoto(uri, adapter);
  try {
    return await upload(payload);
  } catch (cause) {
    const error = new Error(photoUploadMessage(cause), { cause }) as Error & { code?: string };
    const code = (cause as { code?: unknown } | null)?.code;
    if (typeof code === "string") error.code = code;
    throw error;
  } finally {
    closePayload(payload);
  }
}
