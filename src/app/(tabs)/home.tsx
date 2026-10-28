import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
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
  const { user } = useAuth();
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

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshOrders().catch(() => {}),
      refreshStockists().catch(() => {}),
      loadDashboardData().catch(() => {}),
    ]);
    setIsRefreshing(false);
  }, [refreshOrders, refreshStockists, loadDashboardData]);

  // Derived counts
  const pendingRequests = requests.filter(
    (request) => request.status?.toLowerCase() === "pending"
  );

  const recentRequests = requests.slice(0, 3);
  const recentStockists = stockists.slice(0, 3);

  const greeting = getGreeting();

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
              <Text style={styles.greeting}>{greeting} 👋</Text>
              <Text style={styles.name}>{user?.name || "Medical Representative"}</Text>
              <Text style={styles.role}>
                {user?.role === "MR"
                  ? "Medical Representative"
                  : user?.role === "MR-head"
                  ? "Branch Head"
                  : user?.role || "Medical Representative"}
              </Text>
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

          {/* HERO */}
          <View style={[styles.hero, isTablet ? styles.heroTablet : undefined]}>
            <View style={styles.heroTextArea}>
              <Text style={styles.heroTitle}>Create a new medicine request</Text>

              <Text style={styles.heroDescription}>
                Select one of your stockists and request the medicines they need.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.heroButton,
                  pressed && styles.heroButtonPressed,
                ]}
                onPress={() => router.push("/(tabs)/new-request")}
              >
                <MaterialCommunityIcons name="plus" size={19} color="#FFFFFF" />
                <Text style={styles.heroButtonText}>New Request</Text>
              </Pressable>
            </View>

            {isTablet && (
              <MaterialCommunityIcons
                name="medical-bag"
                size={110}
                color="#BFD3FF"
              />
            )}
          </View>

          {/* OVERVIEW */}
          <Text style={styles.sectionTitle}>Overview</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statWrapper}>
              <StatCard
                title="Pending Requests"
                value={stats?.pendingOrders ?? pendingRequests.length}
                icon="clock-outline"
                tone="orange"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="Total Orders"
                value={stats?.totalOrders ?? requests.length}
                icon="clipboard-list-outline"
                tone="blue"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="Approved Revenue"
                value={`Rs. ${(stats?.approvedRevenue ?? 0).toLocaleString()}`}
                icon="cash-check"
                tone="green"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="My Stockists"
                value={stockists.length}
                icon="storefront-outline"
                tone="purple"
              />
            </View>
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
                <Text style={styles.sectionTitle}>Recent Requests</Text>

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

                  <Text style={styles.emptyTitle}>No requests yet</Text>

                  <Text style={styles.emptyText}>
                    Your recent medicine requests will appear here.
                  </Text>
                </View>
              )}
            </View>

            {/* MY STOCKISTS */}
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
                    Add your stockists to quickly place requests for them.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  name: {
    marginTop: 3,
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  role: {
    marginTop: 3,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    top: 9,
    right: 10,
    borderWidth: 1.5,
    borderColor: colors.card,
  },
  hero: {
    backgroundColor: "#EAF1FF",
    borderRadius: 24,
    padding: 22,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTablet: {
    minHeight: 190,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  heroTextArea: {
    maxWidth: 520,
  },
  heroTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
    color: colors.text,
  },
  heroDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  heroButton: {
    marginTop: 20,
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 13,
    paddingVertical: 12,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroButtonPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  heroButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
    marginBottom: 22,
  },
  statWrapper: {
    minWidth: 150,
    flexGrow: 1,
    flexBasis: "47%",
  },
  dashboardContent: {
    gap: 26,
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
    marginBottom: 13,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  emptyCard: {
    minHeight: 160,
    padding: 22,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  emptyText: {
    marginTop: 5,
    maxWidth: 250,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
