import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { fetch as expoFetch } from "expo/fetch";
import type { PhotoAdapter } from "./photo-processing";

export const nativePhotoAdapter: PhotoAdapter<Blob> = {
  open(uri, bounds) {
    const context = ImageManipulator.manipulate(uri, bounds);
    return {
      resize(size) {
        context.resize(size);
      },
      async render() {
        const image = await context.renderAsync();
        return {
          width: image.width,
          height: image.height,
          async saveJpeg(quality) {
            const result = await image.saveAsync({
              format: SaveFormat.JPEG,
              compress: quality,
            });
            return result.uri;
          },
          release() {
            image.release();
          },
        };
      },
      release() {
        context.release();
      },
    };
  },
  size(uri) {
    return new File(uri).size;
  },
  async bytes(uri) {
    // expo/fetch materializes file bytes in React Native's native Blob store.
    // Firebase's multipart builder can then combine it with string headers.
    const response = await expoFetch(uri);
    if (!response.ok) throw new Error("Could not read prepared photo");
    return response.blob();
  },
  remove(uri) {
    const file = new File(uri);
    if (file.exists) file.delete();
  },
};
