import { router, Stack } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";

import { AuthProvider } from "../context/AuthContext";
import { ProductProvider } from "../context/ProductContext";
import { RequestProvider } from "../context/RequestContext";
import { StockistProvider } from "../context/StockistContext";
import { notificationRoute } from "../services/notificationService";

function isExpoGo(): boolean {
  try {
    const c: any = Constants;
    return c?.appOwnership === "expo" || c?.executionEnvironment === "storeClient";
  } catch {
    return true;
  }
}

function useNotificationNavigation() {
  useEffect(() => {
    let subscription: any;
    let isMounted = true;

    const setupNotifications = async () => {
      try {
        if (isExpoGo() && Platform.OS === "android") {
          return;
        }

        const Notifications = await import("expo-notifications");
        if (!Notifications) return;

        function open(response: any) {
          try {
            const data =
              response?.notification?.request?.content?.data as Record<
                string,
                unknown
              > | undefined;

            if (!data) return;
            router.push(notificationRoute(data));
          } catch (e) {
            console.warn("Failed to handle notification response:", e);
          }
        }

        subscription =
          Notifications.addNotificationResponseReceivedListener?.(open);

        try {
          const lastResponse = Notifications.getLastNotificationResponse?.();
          if (lastResponse && isMounted) {
            open(lastResponse);
          }
        } catch {}
      } catch (error) {
        console.warn("Notifications not available:", error);
      }
    };

    setupNotifications();

    return () => {
      isMounted = false;
      try {
        subscription?.remove?.();
      } catch {}
    };
  }, []);
}

export default function RootLayout() {
  useNotificationNavigation();

  return (
    <AuthProvider>
      <StockistProvider>
        <RequestProvider>
          <ProductProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </ProductProvider>
        </RequestProvider>
      </StockistProvider>
    </AuthProvider>
  );
}
