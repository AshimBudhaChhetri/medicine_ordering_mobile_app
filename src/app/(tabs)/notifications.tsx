import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import type { ComponentProps } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { NotificationRowSkeleton } from "../../components/Skeleton";
import { useResponsive } from "../../hooks/useResponsive";
import {
  notificationRoute,
  notificationService,
  setUnreadBadgeCount,
} from "../../services/notificationService";
import { colors } from "../../theme/colors";
import type {
  NotificationItem,
  NotificationType,
} from "../../types/notification";

const PAGE_SIZE = 20;

type IconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

type NotificationMeta = {
  icon: IconName;
  color: string;
  soft: string;
};

function notificationMeta(type: NotificationType): NotificationMeta {
  switch (type) {
    case "ORDER_CREATED":
      return {
        icon: "clipboard-plus-outline",
        color: colors.primary,
        soft: colors.primarySoft,
      };
    case "ORDER_APPROVED":
      return {
        icon: "check-circle-outline",
        color: colors.success,
        soft: colors.successSoft,
      };
    case "ORDER_REJECTED":
      return {
        icon: "close-circle-outline",
        color: colors.danger,
        soft: colors.dangerSoft,
      };
    case "REGISTRATION_CREATED":
      return {
        icon: "account-plus-outline",
        color: colors.purple,
        soft: colors.purpleSoft,
      };
    case "REGISTRATION_APPROVED":
      return {
        icon: "account-check-outline",
        color: colors.success,
        soft: colors.successSoft,
      };
    case "PRODUCT_CREATED":
    case "PRODUCT_UPDATED":
      return {
        icon: "pill",
        color: colors.primary,
        soft: colors.primarySoft,
      };
    case "PRODUCT_TYPE_CREATED":
    case "PRODUCT_TYPE_UPDATED":
      return {
        icon: "shape-outline",
        color: colors.warning,
        soft: colors.warningSoft,
      };
    default:
      return {
        icon: "bell-outline",
        color: colors.primary,
        soft: colors.primarySoft,
      };
  }
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}

export default function NotificationsScreen() {
  const { gutter, contentMaxWidth } = useResponsive();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setUnreadBadgeCount(unreadCount);
  }, [unreadCount]);

  const loadPage = useCallback(
    async (nextPage: number, mode: "replace" | "append") => {
      if (mode === "append") {
        setIsLoadingMore(true);
      }

      try {
        const res = await notificationService.getNotifications({
          page: nextPage,
          limit: PAGE_SIZE,
        });

        setNotifications((prev) => {
          if (mode === "replace") {
            return res.notifications;
          }

          const existingIds = new Set(prev.map((item) => item.id));
          return [
            ...prev,
            ...res.notifications.filter((item) => !existingIds.has(item.id)),
          ];
        });
        setPage(res.page);
        setTotalPages(res.totalPages);
        setUnreadCount(res.unreadCount);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not load notifications."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadPage(1, "replace");
    }, [loadPage])
  );

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPage(1, "replace");
  }, [loadPage]);

  const onEndReached = useCallback(() => {
    if (
      isLoading ||
      isLoadingMore ||
      isRefreshing ||
      page >= totalPages
    ) {
      return;
    }

    loadPage(page + 1, "append");
  }, [isLoading, isLoadingMore, isRefreshing, page, totalPages, loadPage]);

  const handlePress = useCallback((item: NotificationItem) => {
    if (!item.readAt) {
      const readAt = new Date().toISOString();

      setNotifications((prev) =>
        prev.map((candidate) =>
          candidate.id === item.id ? { ...candidate, readAt } : candidate
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      notificationService.markAsRead(item.id).catch(() => {});
    }

    router.push(notificationRoute(item.data ?? {}));
  }, []);

  const handleMarkAllSeen = useCallback(async () => {
    if (unreadCount === 0) {
      return;
    }

    const readAt = new Date().toISOString();

    setNotifications((prev) =>
      prev.map((item) => (item.readAt ? item : { ...item, readAt }))
    );
    setUnreadCount(0);

    try {
      await notificationService.markAllAsRead();
    } catch {
      loadPage(1, "replace");
    }
  }, [unreadCount, loadPage]);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    loadPage(1, "replace");
  }, [loadPage]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View
        style={[
          styles.container,
          contentMaxWidth
            ? {
                width: "100%",
                maxWidth: contentMaxWidth,
                alignSelf: "center",
              }
            : undefined,
        ]}
      >
        <View style={[styles.header, { paddingHorizontal: gutter }]}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Notifications</Text>
            <Text style={styles.subtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You are all caught up"}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={unreadCount === 0}
            onPress={handleMarkAllSeen}
            style={({ pressed }) => [
              styles.markAllButton,
              unreadCount === 0 && styles.markAllButtonDisabled,
              pressed && unreadCount > 0 && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name="check-all"
              size={18}
              color={unreadCount === 0 ? colors.textMuted : colors.primary}
            />
            <Text
              style={[
                styles.markAllText,
                unreadCount === 0 && styles.markAllTextDisabled,
              ]}
            >
              Mark all seen
            </Text>
          </Pressable>
        </View>

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow item={item} onPress={handlePress} />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingHorizontal: gutter },
            notifications.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isLoadingMore ? (
              <View style={styles.footer}>
                <ActivityIndicator size="small" color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.skeletonList}>
                {Array.from({ length: 6 }).map((_, index) => (
                  <NotificationRowSkeleton key={index} />
                ))}
              </View>
            ) : error ? (
              <View style={styles.state}>
                <View style={styles.stateIcon}>
                  <MaterialCommunityIcons
                    name="cloud-off-outline"
                    size={34}
                    color={colors.danger}
                  />
                </View>
                <Text style={styles.stateTitle}>Could not load notifications</Text>
                <Text style={styles.stateText}>{error}</Text>
                <Pressable style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryText}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.state}>
                <View style={styles.stateIcon}>
                  <MaterialCommunityIcons
                    name="bell-sleep-outline"
                    size={34}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.stateTitle}>No notifications yet</Text>
                <Text style={styles.stateText}>
                  Order updates and approvals will appear here.
                </Text>
              </View>
            )
          }
        />
      </View>
    </SafeAreaView>
  );
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: (item: NotificationItem) => void;
}) {
  const meta = notificationMeta(item.type);
  const isUnread = !item.readAt;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.card,
        !isUnread && styles.cardSeen,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.soft }]}>
        <MaterialCommunityIcons
          name={meta.icon}
          size={21}
          color={meta.color}
        />
      </View>

      <View style={styles.cardContent}>
        <Text
          style={[styles.cardTitle, !isUnread && styles.cardTitleSeen]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text
          style={[styles.cardBody, !isUnread && styles.cardBodySeen]}
          numberOfLines={3}
        >
          {item.body}
        </Text>
        <Text style={styles.cardTime}>{formatTimestamp(item.createdAt)}</Text>
      </View>

      {isUnread && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 27,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    marginTop: 5,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  markAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  markAllButtonDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  markAllTextDisabled: {
    color: colors.textMuted,
  },
  listContent: {
    paddingBottom: 120,
    gap: 10,
  },
  listEmpty: {
    flexGrow: 1,
  },
  skeletonList: {
    gap: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  cardSeen: {
    opacity: 0.62,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  cardTitleSeen: {
    color: colors.textSecondary,
  },
  cardBody: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  cardBodySeen: {
    color: colors.textMuted,
  },
  cardTime: {
    marginTop: 7,
    fontSize: 11,
    fontWeight: "500",
    color: colors.textMuted,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.success,
    marginTop: 4,
  },
  footer: {
    paddingVertical: 18,
    alignItems: "center",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  stateIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  stateTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  stateText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  pressed: {
    opacity: 0.72,
  },
});
