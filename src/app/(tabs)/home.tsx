import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";

import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { RequestCard } from "../../components/RequestCard";
import { StatCard } from "../../components/StatCard";
import { StockistCard } from "../../components/StockistCard";

import { useAuth } from "../../context/AuthContext";
import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { dashboardService } from "../../services/dashboardService";
import { notificationService } from "../../services/notificationService";
import { colors } from "../../theme/colors";
import { DashboardStats } from "../../types/dashboard";

export default function DashboardScreen() {
  const { user, isSuperAdmin } = useAuth();
  const { requests, refreshOrders } = useRequests();
  const { stockists, refreshStockists } = useStockists();

  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsData, unread] = await Promise.all([
        dashboardService.getStats().catch(() => null),
        notificationService.getUnreadCount().catch(() => 0),
      ]);
      if (statsData) {
        setStats(statsData);
      }
      setUnreadCount(unread);
    } catch (err) {
      console.warn("Failed to load dashboard analytical stats:", err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Refresh data whenever the home screen comes into view
  useFocusEffect(
    useCallback(() => {
      loadDashboardData().catch(() => { });
      refreshOrders().catch(() => { });
      refreshStockists().catch(() => { });
    }, [loadDashboardData, refreshOrders, refreshStockists])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshOrders().catch(() => { }),
      refreshStockists().catch(() => { }),
      loadDashboardData().catch(() => { }),
    ]);
    setIsRefreshing(false);
  }, [refreshOrders, refreshStockists, loadDashboardData]);

  // Derived counts
  const pendingRequests = requests.filter(
    (request) => request.status?.toLowerCase() === "pending"
  );
  const completedRequests = requests.filter((r) => {
    const s = r.status?.toLowerCase();
    return s === "approved" || s === "completed";
  });

  const recentRequests = requests.slice(0, 3);
  const recentStockists = stockists.slice(0, 3);

  const roleLabel =
    user?.role === "MR"
      ? "Medical Representative"
      : user?.role === "MR-head"
      ? "Branch Head"
      : user?.role === "superadmin"
      ? "Super Administrator"
      : "Staff";

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View
          style={[
            styles.container,
            contentMaxWidth
              ? {
                  maxWidth: contentMaxWidth,
                  alignSelf: "center",
                  width: "100%",
                }
              : undefined,
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View>
              <Text style={styles.name}>{user?.name || "User"}</Text>
              <Text style={styles.role}>{roleLabel}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.notificationButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/(tabs)/requests")}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={23}
                color={colors.text}
              />
              {unreadCount > 0 && <View style={styles.notificationDot} />}
            </Pressable>
          </View>

          {/* HERO QUICK ACTIONS */}
          <View style={[styles.hero, isTablet ? styles.heroTablet : undefined]}>
            <View style={styles.heroTextArea}>
              <View style={styles.heroActionsRow}>
                {/* New Order Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.heroButton,
                    pressed && styles.heroButtonPressed,
                  ]}
                  onPress={() => router.push("/(tabs)/new-request")}
                >
                  <MaterialCommunityIcons name="plus" size={19} color="#FFFFFF" />
                  <Text style={styles.heroButtonText}>New Order</Text>
                </Pressable>

                {/* My Orders Button */}
                <Pressable
                  style={({ pressed }) => [
                    styles.heroSecondaryButton,
                    pressed && styles.heroButtonPressed,
                  ]}
                  onPress={() => router.push("/(tabs)/requests")}
                >
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={18}
                    color={colors.primary}
                  />
                  <Text style={styles.heroSecondaryText}>My Orders</Text>
                </Pressable>

                {/* Only superadmin can add products */}
                {isSuperAdmin && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.heroSecondaryButton,
                      pressed && styles.heroButtonPressed,
                    ]}
                    onPress={() => router.push("/product/add")}
                  >
                    <MaterialCommunityIcons
                      name="pill"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.heroSecondaryText}>Add Product</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {isTablet && (
              <MaterialCommunityIcons
                name="medical-bag"
                size={110}
                color="#BFD3FF"
              />
            )}
          </View>

          {/* SUPERADMIN MANAGEMENT SHORTCUTS */}
          {isSuperAdmin && (
            <View style={styles.adminShortcutsCard}>
              <Text style={styles.adminShortcutsTitle}>Admin Management</Text>
              <View style={styles.adminShortcutsRow}>
                <Pressable
                  style={styles.adminShortcutItem}
                  onPress={() => router.push("/admin/users")}
                >
                  <View style={styles.adminShortcutIcon}>
                    <MaterialCommunityIcons
                      name="account-group-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.adminShortcutLabel}>Users</Text>
                </Pressable>

                <Pressable
                  style={styles.adminShortcutItem}
                  onPress={() => router.push("/admin/registrations")}
                >
                  <View style={styles.adminShortcutIcon}>
                    <MaterialCommunityIcons
                      name="account-plus-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.adminShortcutLabel}>Registrations</Text>
                </Pressable>

                <Pressable
                  style={styles.adminShortcutItem}
                  onPress={() => router.push("/document" as any)}
                >
                  <View style={styles.adminShortcutIcon}>
                    <MaterialCommunityIcons
                      name="folder-open-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.adminShortcutLabel}>Documents</Text>
                </Pressable>

                <Pressable
                  style={styles.adminShortcutItem}
                  onPress={() => router.push("/product/add")}
                >
                  <View style={styles.adminShortcutIcon}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.adminShortcutLabel}>Products</Text>
                </Pressable>
              </View>
            </View>
          )}



          {/* OVERVIEW STATS */}
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statWrapper}>
              <StatCard
                title="Pending Orders"
                value={stats?.pendingOrders ?? pendingRequests.length}
                icon="clock-outline"
                tone="orange"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="Completed Orders"
                value={completedRequests.length}
                icon="check-circle-outline"
                tone="green"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="Total Orders"
                value={stats?.totalOrders ?? requests.length}
                icon="receipt-text-outline"
                tone="blue"
              />
            </View>

            {isSuperAdmin ? (
              <View style={styles.statWrapper}>
                <StatCard
                  title="Total Users"
                  value={stats?.totalUsers ?? 0}
                  icon="account-group-outline"
                  tone="purple"
                />
              </View>
            ) : (
              <View style={styles.statWrapper}>
                <StatCard
                  title="My Stockists"
                  value={stockists.length}
                  icon="storefront-outline"
                  tone="purple"
                />
              </View>
            )}
          </View>

          {/* MAIN CONTENT */}
          <View
            style={[
              styles.dashboardContent,
              isTablet ? styles.dashboardContentTablet : undefined,
            ]}
          >
            {/* RECENT REQUESTS */}
            <View style={styles.sectionColumn}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Orders</Text>

                <Pressable onPress={() => router.push("/(tabs)/requests")}>
                  <Text style={styles.viewAll}>View all</Text>
                </Pressable>
              </View>

              {recentRequests.length > 0 ? (
                recentRequests.map((request) => (
                  <Pressable
                    key={request.id}
                    onPress={() =>
                      router.push({
                        pathname: "/request/[id]",
                        params: { id: request.id },
                      })
                    }
                  >
                    <RequestCard
                      id={request.requestNumber}
                      stockist={request.stockistName}
                      items={request.items.length}
                      date={request.createdAt}
                      status={request.status}
                    />
                  </Pressable>
                ))
              ) : (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={31}
                    color={colors.textMuted}
                  />

                  <Text style={styles.emptyTitle}>No orders yet</Text>

                  <Text style={styles.emptyText}>
                    Your recent medicine orders will appear here.
                  </Text>
                </View>
              )}
            </View>

            {/* MY STOCKISTS (MR only) */}
            {!isSuperAdmin && (
              <View style={styles.sectionColumn}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>My Stockists</Text>

                  <Pressable onPress={() => router.push("/(tabs)/stockists")}>
                    <Text style={styles.viewAll}>View all</Text>
                  </Pressable>
                </View>

                {recentStockists.length > 0 ? (
                  recentStockists.map((stockist) => (
                    <Pressable
                      key={stockist.id}
                      onPress={() =>
                        router.push({
                          pathname: "/stockist/[id]",
                          params: { id: stockist.id },
                        })
                      }
                    >
                      <StockistCard
                        name={stockist.name}
                        location={stockist.location}
                      />
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyCard}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={31}
                      color={colors.textMuted}
                    />

                    <Text style={styles.emptyTitle}>No stockists added</Text>

                    <Text style={styles.emptyText}>
                      Add your stockists to quickly place orders for them.
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 35,
  },
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  name: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.text,
    marginTop: 2,
  },
  role: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
    fontWeight: "400",
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    position: "absolute",
    top: 11,
    right: 12,
  },
  hero: {
    backgroundColor: "transparent",
    borderColor: colors.border,
    borderRadius: 2,
    padding: 0,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTablet: {
    padding: 28,
  },
  heroTextArea: {
    flex: 1,
  },
  heroActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  heroButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroSecondaryButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroSecondaryText: {
    color: colors.primary,
    fontWeight: "500",
    fontSize: 13,
  },
  heroButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontWeight: "500",
    fontSize: 13,
  },
  adminShortcutsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
  },
  adminShortcutsTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 12,
  },
  adminShortcutsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  adminShortcutItem: {
    alignItems: "center",
    gap: 6,
  },
  adminShortcutIcon: {
    width: 48,
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  adminShortcutLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: colors.text,
    textAlign: "center",
  },
  mrDocShortcut: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  mrDocShortcutText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
    marginBottom: 20,
  },
  statWrapper: {
    minWidth: 140,
    flexGrow: 1,
    flexBasis: "47%",
  },
  dashboardContent: {
    gap: 24,
  },
  dashboardContentTablet: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  sectionColumn: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  emptyText: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "400",
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
