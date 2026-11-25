import * as Device from "expo-device";
import Constants from "expo-constants";
import type { Href } from "expo-router";
import { Platform } from "react-native";

import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from "../storage/secureStorage";
import {
  NotificationItem,
  NotificationListResponse,
  NotificationQueryParams,
} from "../types/notification";

const PUSH_TOKEN_KEY = "mediflow_expo_push_token";

type UnreadBadgeListener = (count: number) => void;

const unreadBadgeListeners = new Set<UnreadBadgeListener>();

let unreadBadgeCount = 0;

export function getUnreadBadgeCount(): number {
  return unreadBadgeCount;
}

export function setUnreadBadgeCount(count: number): void {
  unreadBadgeCount = Math.max(0, count);
  unreadBadgeListeners.forEach((listener) => listener(unreadBadgeCount));
}

export function subscribeUnreadBadge(listener: UnreadBadgeListener): () => void {
  unreadBadgeListeners.add(listener);
  listener(unreadBadgeCount);

  return () => {
    unreadBadgeListeners.delete(listener);
  };
}

function projectId(): string | undefined {
  return (
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ||
    Constants.expoConfig?.extra?.eas?.projectId ||
    (Constants as any).easConfig?.projectId ||
    undefined
  );
}

function isExpoGo(): boolean {
  try {
    const c: any = Constants;
    return c?.appOwnership === "expo" || c?.executionEnvironment === "storeClient";
  } catch {
    return true;
  }
}

async function getNotificationsModule() {
  try {
    if (isExpoGo()) {
      return null;
    }
    const Notifications = await import("expo-notifications");
    return Notifications;
  } catch {
    return null;
  }
}

// Set handler if possible (async to avoid top-level native module access in Expo Go)
getNotificationsModule().then((Notifications: any) => {
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {}
});

/**
 * Requests permission and registers this device with the backend.
 */
export async function registerForPushNotifications(): Promise<void> {
  try {
    const Notifications = await getNotificationsModule();
    if (!Notifications) return;

    if (!Device.isDevice) {
      return;
    }

    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance?.HIGH ?? 4,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#208AEF",
        });
      } catch {}
    }

    let permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") {
      permission = await Notifications.requestPermissionsAsync();
    }
    if (permission.status !== "granted") {
      return;
    }

    const id = projectId();
    if (!id) {
      console.warn(
        "Missing EAS project id; set EXPO_PUBLIC_EAS_PROJECT_ID to enable push notifications."
      );
      return;
    }

    const { data: token } = await Notifications.getExpoPushTokenAsync({
      projectId: id,
    });

    if (__DEV__) {
      console.log("[push] Expo push token:", token);
    }

    await apiRequest(API_ENDPOINTS.notifications.registerToken, {
      method: "POST",
      body: {
        token,
        platform: Platform.OS,
      },
    });

    await setItemAsync(PUSH_TOKEN_KEY, token);
  } catch (error) {
    console.warn("registerForPushNotifications skipped:", error);
  }
}

/**
 * Removes this device from the signed-in account before the session is cleared.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    const token = await getItemAsync(PUSH_TOKEN_KEY);
    if (!token) {
      return;
    }

    try {
      await apiRequest(API_ENDPOINTS.notifications.removeToken, {
        method: "DELETE",
        body: { token },
      });
    } finally {
      await deleteItemAsync(PUSH_TOKEN_KEY);
    }
  } catch (error) {
    console.warn("unregisterPushToken skipped:", error);
  }
}

/**
 * Route a tapped notification to the matching in-app screen.
 */
export function notificationRoute(
  data: Record<string, unknown>
): Href {
  if (typeof data.orderId === "string" && data.orderId.length > 0) {
    return {
      pathname: "/request/[id]",
      params: { id: data.orderId },
    };
  }

  if (typeof data.productId === "string" && data.productId.length > 0) {
    return "/(tabs)/home";
  }

  if (
    data.type === "PRODUCT_CREATED" ||
    data.type === "PRODUCT_UPDATED" ||
    data.type === "PRODUCT_TYPE_CREATED" ||
    data.type === "PRODUCT_TYPE_UPDATED" ||
    data.type === "REGISTRATION_APPROVED"
  ) {
    return "/(tabs)/home";
  }

  return "/(tabs)/requests";
}

/**
 * Notification API methods.
 */
export const notificationService = {
  /**
   * Fetch paginated notifications list.
   */
  async getNotifications(
    params?: NotificationQueryParams
  ): Promise<NotificationListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append("page", String(params.page));
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.unread) searchParams.append("unread", "true");

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.notifications.list}?${query}`
      : API_ENDPOINTS.notifications.list;

    return apiRequest<NotificationListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Quick unread badge counter.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const res = await apiRequest<{ count: number }>(
        API_ENDPOINTS.notifications.unreadCount,
        {
          method: "GET",
        }
      );
      return res.count ?? 0;
    } catch {
      return 0;
    }
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(id: string): Promise<NotificationItem> {
    return apiRequest<NotificationItem>(
      API_ENDPOINTS.notifications.markAsRead(id),
      {
        method: "PATCH",
      }
    );
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<{ updated: number }> {
    return apiRequest<{ updated: number }>(
      API_ENDPOINTS.notifications.markAllAsRead,
      {
        method: "PATCH",
      }
    );
  },

  /**
   * Mint a short-lived token to authenticate the real-time Socket.IO connection.
   */
  async getSocketToken(): Promise<{ token: string; expiresIn: number }> {
    return apiRequest<{ token: string; expiresIn: number }>(
      API_ENDPOINTS.notifications.socketToken,
      {
        method: "POST",
      }
    );
  },
};
