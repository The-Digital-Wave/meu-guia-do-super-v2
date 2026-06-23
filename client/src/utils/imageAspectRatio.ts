import { Image, type ImageSourcePropType } from "react-native";

/**
 * Native `require()` returns an AssetRegistry numeric ID, which needs
 * `Image.resolveAssetSource` to read width/height. Web's Metro asset
 * transformer instead returns `{ uri, width, height }` directly, and
 * react-native-web doesn't implement `resolveAssetSource` at all — calling
 * it unconditionally crashes on web.
 */
export function getImageAspectRatio(source: ImageSourcePropType): number {
  const resolved =
    typeof source === "number" ? Image.resolveAssetSource(source) : source;
  const { width, height } = resolved as { width?: number; height?: number };
  return width && height ? width / height : 1;
}
