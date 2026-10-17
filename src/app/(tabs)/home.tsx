import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { RequestCard } from "../../components/RequestCard";
import { StatCard } from "../../components/StatCard";
import { StockistCard } from "../../components/StockistCard";

import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";

import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function DashboardScreen() {
  const { requests } = useRequests();

  const {
    approvedStockists,
    approvalRequests,
  } = useStockists();

  const {
    isTablet,
    gutter,
    contentMaxWidth,
  } = useResponsive();

  // -----------------------------------------
  // REQUEST COUNTS
  // -----------------------------------------

  const pendingRequests = requests.filter(
    (request) => request.status === "PENDING"
  );

  const processingRequests = requests.filter(
    (request) => request.status === "PROCESSING"
  );

  const completedRequests = requests.filter(
    (request) => request.status === "COMPLETED"
  );

  // -----------------------------------------
  // STOCKIST APPROVAL COUNT
  // -----------------------------------------

  const pendingStockistRequests =
    approvalRequests.filter(
      (request) => request.status === "PENDING"
    );

  // -----------------------------------------
  // RECENT DATA
  // -----------------------------------------

  const recentRequests = requests
    .filter(
      (request) =>
        request.status !== "CANCELLED"
    )
    .slice(0, 3);

  const recentStockists =
    approvedStockists.slice(0, 3);

  // -----------------------------------------
  // GREETING
  // -----------------------------------------

  const greeting = getGreeting();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: gutter,
          },
        ]}
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
          {/* =====================================
              HEADER
          ====================================== */}

          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>
                {greeting} 👋
              </Text>

              <Text style={styles.name}>
                Suman Acharya
              </Text>

              <Text style={styles.role}>
                Medical Representative
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.notificationButton,
                pressed &&
                  styles.buttonPressed,
              ]}
            >
              <MaterialCommunityIcons
                name="bell-outline"
                size={23}
                color={colors.text}
              />

              <View
                style={styles.notificationDot}
              />
            </Pressable>
          </View>

          {/* =====================================
              HERO
          ====================================== */}

          <View
            style={[
              styles.hero,
              isTablet
                ? styles.heroTablet
                : undefined,
            ]}
          >
            <View style={styles.heroTextArea}>
              <Text style={styles.heroTitle}>
                Create a new medicine request
              </Text>

              <Text
                style={styles.heroDescription}
              >
                Select one of your approved
                stockists and request the medicines
                they need.
              </Text>

              <Pressable
                style={({ pressed }) => [
                  styles.heroButton,
                  pressed &&
                    styles.heroButtonPressed,
                ]}
                onPress={() =>
                  router.push(
                    "/(tabs)/new-request"
                  )
                }
              >
                <MaterialCommunityIcons
                  name="plus"
                  size={19}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.heroButtonText}
                >
                  New Request
                </Text>
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

          {/* =====================================
              OVERVIEW
          ====================================== */}

          <Text style={styles.sectionTitle}>
            Overview
          </Text>

          <View style={styles.statsGrid}>
            <View style={styles.statWrapper}>
              <StatCard
                title="Pending Requests"
                value={pendingRequests.length}
                icon="clock-outline"
                tone="orange"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="Processing"
                value={
                  processingRequests.length
                }
                icon="progress-clock"
                tone="blue"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="Completed"
                value={
                  completedRequests.length
                }
                icon="check-circle-outline"
                tone="green"
              />
            </View>

            <View style={styles.statWrapper}>
              <StatCard
                title="My Stockists"
                value={
                  approvedStockists.length
                }
                icon="storefront-outline"
                tone="purple"
              />
            </View>
          </View>

          {/* =====================================
              STOCKIST APPROVAL ALERT
          ====================================== */}

          {pendingStockistRequests.length >
            0 && (
            <Pressable
              style={({ pressed }) => [
                styles.approvalBanner,
                pressed &&
                  styles.buttonPressed,
              ]}
              onPress={() =>
                router.push(
                  "/(tabs)/stockists"
                )
              }
            >
              <View
                style={styles.approvalIcon}
              >
                <MaterialCommunityIcons
                  name="store-plus-outline"
                  size={22}
                  color={colors.warning}
                />
              </View>

              <View
                style={
                  styles.approvalContent
                }
              >
                <Text
                  style={
                    styles.approvalTitle
                  }
                >
                  {
                    pendingStockistRequests.length
                  }{" "}
                  {pendingStockistRequests.length ===
                  1
                    ? "stockist request"
                    : "stockist requests"}{" "}
                  awaiting approval
                </Text>

                <Text
                  style={
                    styles.approvalText
                  }
                >
                  You can use these stockists
                  after Admin approves them.
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>
          )}

          {/* =====================================
              MAIN CONTENT
          ====================================== */}

          <View
            style={[
              styles.dashboardContent,
              isTablet
                ? styles.dashboardContentTablet
                : undefined,
            ]}
          >
            {/* =================================
                RECENT REQUESTS
            ================================== */}

            <View
              style={styles.sectionColumn}
            >
              <View
                style={styles.sectionHeader}
              >
                <Text
                  style={styles.sectionTitle}
                >
                  Recent Requests
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/(tabs)/requests"
                    )
                  }
                >
                  <Text
                    style={styles.viewAll}
                  >
                    View all
                  </Text>
                </Pressable>
              </View>

              {recentRequests.length > 0 ? (
                recentRequests.map(
                  (request) => {
                    // RequestCard currently supports
                    // Pending, Processing and Completed.
                    if (
                      request.status ===
                      "CANCELLED"
                    ) {
                      return null;
                    }

                    return (
                      <RequestCard
                        key={request.id}
                        id={
                          request.requestNumber
                        }
                        stockist={
                          request.stockistName
                        }
                        items={
                          request.items.length
                        }
                        date={
                          request.createdAt
                        }
                        status={
                          request.status
                        }
                      />
                    );
                  }
                )
              ) : (
                <View
                  style={styles.emptyCard}
                >
                  <MaterialCommunityIcons
                    name="clipboard-text-outline"
                    size={31}
                    color={colors.textMuted}
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No requests yet
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Your recent medicine
                    requests will appear here.
                  </Text>
                </View>
              )}
            </View>

            {/* =================================
                MY STOCKISTS
            ================================== */}

            <View
              style={styles.sectionColumn}
            >
              <View
                style={styles.sectionHeader}
              >
                <Text
                  style={styles.sectionTitle}
                >
                  My Stockists
                </Text>

                <Pressable
                  onPress={() =>
                    router.push(
                      "/(tabs)/stockists"
                    )
                  }
                >
                  <Text
                    style={styles.viewAll}
                  >
                    View all
                  </Text>
                </Pressable>
              </View>

              {recentStockists.length > 0 ? (
                recentStockists.map(
                  (stockist) => (
                    <StockistCard
                      key={stockist.id}
                      name={stockist.name}
                      location={
                        stockist.location
                      }
                    />
                  )
                )
              ) : (
                <View
                  style={styles.emptyCard}
                >
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={31}
                    color={colors.textMuted}
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    No approved stockists
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Add a stockist and submit
                    it for Admin approval.
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

// =============================================
// GREETING
// =============================================

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 17) {
    return "Good afternoon";
  }

  return "Good evening";
}

// =============================================
// STYLES
// =============================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor:
      colors.background,
  },

  scrollContent: {
    paddingBottom: 120,
  },

  container: {
    flex: 1,
  },

  // -------------------------------------------
  // HEADER
  // -------------------------------------------

  header: {
    flexDirection: "row",

    justifyContent: "space-between",
    alignItems: "center",

    paddingTop: 12,
    paddingBottom: 24,
  },

  greeting: {
    fontSize: 13,

    color:
      colors.textSecondary,
  },

  name: {
    marginTop: 3,

    fontSize: 24,
    fontWeight: "700",

    color: colors.text,
  },

  role: {
    marginTop: 3,

    fontSize: 12,

    color:
      colors.textSecondary,
  },

  notificationButton: {
    width: 46,
    height: 46,

    borderRadius: 23,

    borderWidth: 1,
    borderColor:
      colors.border,

    backgroundColor:
      colors.card,

    alignItems: "center",
    justifyContent: "center",
  },

  notificationDot: {
    position: "absolute",

    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor:
      colors.danger,

    top: 9,
    right: 10,

    borderWidth: 1.5,
    borderColor:
      colors.card,
  },

  // -------------------------------------------
  // HERO
  // -------------------------------------------

  hero: {
    backgroundColor: "#EAF1FF",

    borderRadius: 24,

    padding: 22,

    marginBottom: 28,
  },

  heroTablet: {
    minHeight: 190,

    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",

    paddingHorizontal: 32,
  },

  heroTextArea: {
    maxWidth: 520,
  },

  heroTitle: {
    fontSize: 22,
    lineHeight: 28,

    fontWeight: "700",

    color: colors.text,
  },

  heroDescription: {
    marginTop: 8,

    fontSize: 14,
    lineHeight: 21,

    color:
      colors.textSecondary,
  },

  heroButton: {
    marginTop: 20,

    alignSelf: "flex-start",

    backgroundColor:
      colors.primary,

    borderRadius: 13,

    paddingVertical: 12,
    paddingHorizontal: 17,

    flexDirection: "row",
    alignItems: "center",

    gap: 6,
  },

  heroButtonPressed: {
    opacity: 0.88,

    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  heroButtonText: {
    color: "#FFFFFF",

    fontWeight: "700",
    fontSize: 14,
  },

  // -------------------------------------------
  // SECTIONS
  // -------------------------------------------

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",

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

  // -------------------------------------------
  // APPROVAL BANNER
  // -------------------------------------------

  approvalBanner: {
    backgroundColor:
      colors.card,

    borderWidth: 1,
    borderColor: "#F6DCA6",

    borderRadius: 17,

    padding: 14,

    flexDirection: "row",
    alignItems: "center",

    marginBottom: 28,
  },

  approvalIcon: {
    width: 43,
    height: 43,

    borderRadius: 13,

    backgroundColor:
      colors.warningSoft,

    alignItems: "center",
    justifyContent: "center",
  },

  approvalContent: {
    flex: 1,

    marginHorizontal: 12,
  },

  approvalTitle: {
    fontSize: 14,
    fontWeight: "600",

    color: colors.text,
  },

  approvalText: {
    marginTop: 4,

    fontSize: 12,
    lineHeight: 17,

    color:
      colors.textSecondary,
  },

  // -------------------------------------------
  // MAIN CONTENT
  // -------------------------------------------

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

    justifyContent:
      "space-between",

    alignItems: "center",

    marginBottom: 13,
  },

  viewAll: {
    fontSize: 13,
    fontWeight: "600",

    color: colors.primary,
  },

  // -------------------------------------------
  // EMPTY STATES
  // -------------------------------------------

  emptyCard: {
    minHeight: 160,

    padding: 22,

    borderRadius: 17,

    borderWidth: 1,
    borderColor:
      colors.border,

    backgroundColor:
      colors.card,

    justifyContent: "center",
    alignItems: "center",
  },

  emptyTitle: {
    marginTop: 10,

    fontSize: 14,
    fontWeight: "700",

    color: colors.text,
  },

  emptyText: {
    marginTop: 5,

    maxWidth: 250,

    textAlign: "center",

    fontSize: 11,
    lineHeight: 17,

    color:
      colors.textSecondary,
  },

  // -------------------------------------------
  // COMMON
  // -------------------------------------------

  buttonPressed: {
    opacity: 0.8,
  },
});