export type SelectedPhoto = {
  id: string;
  uri: string;
  width?: number;
  height?: number;
  error?: string;
  url?: string;
};

export function remainingPhotoSlots(uploaded: number, selected: number): number {
  return Math.max(0, 6 - uploaded - selected);
}

export async function uploadSelectedPhotos(
  photos: SelectedPhoto[],
  callbacks: {
    upload: (photo: SelectedPhoto) => Promise<string>;
    onUploaded: (photo: SelectedPhoto, url: string) => void;
    onFailed: (photo: SelectedPhoto, error: unknown) => void;
    onProgress: (current: number, total: number) => void;
  },
): Promise<void> {
  for (const [index, photo] of photos.entries()) {
    callbacks.onProgress(index + 1, photos.length);
    try {
      const url = await callbacks.upload(photo);
      callbacks.onUploaded(photo, url);
    } catch (error) {
      callbacks.onFailed(photo, error);
    }
  }
}
