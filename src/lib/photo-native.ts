import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { File } from "expo-file-system";
import { readNativePhotoBlob, type PhotoAdapter } from "./photo-processing";

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
    return readNativePhotoBlob(uri);
  },
  remove(uri) {
    const file = new File(uri);
    if (file.exists) file.delete();
  },
};
