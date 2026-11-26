import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

/**
 * Cross-platform key/value storage.
 *
 * `expo-secure-store` only supports Android, iOS and tvOS. On web its
 * native module is unavailable, so fall back to `localStorage`.
 */
const isWeb = Platform.OS === "web";

function getWebStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage;
  } catch {
    return null;
  }
}

export async function getItemAsync(
  key: string
): Promise<string | null> {
  if (isWeb) {
    return getWebStorage()?.getItem(key) ?? null;
  }

  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(
  key: string,
  value: string
): Promise<void> {
  if (isWeb) {
    getWebStorage()?.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(
  key: string
): Promise<void> {
  if (isWeb) {
    getWebStorage()?.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
