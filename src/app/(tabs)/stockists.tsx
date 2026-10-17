import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ApprovedStockistCard } from "../../components/ApprovedStockistCard";
import { StockistApprovalCard } from "../../components/StockistApprovalCard";
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

type Tab = "APPROVED" | "REQUESTS";

export default function StockistsScreen() {
  const { approvedStockists, approvalRequests } = useStockists();

  const [activeTab, setActiveTab] =
    useState<Tab>("APPROVED");

  const [search, setSearch] = useState("");

  const {
    isTablet,
    gutter,
    contentMaxWidth,
  } = useResponsive();

  // Filter approved stockists
  const filteredStockists = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return approvedStockists;
    }

    return approvedStockists.filter((stockist) => {
      return (
        stockist.name.toLowerCase().includes(query) ||
        stockist.location.toLowerCase().includes(query) ||
        stockist.contactPerson
          .toLowerCase()
          .includes(query) ||
        stockist.phone.toLowerCase().includes(query)
      );
    });
  }, [search, approvedStockists]);

  // Filter stockist approval requests
  const filteredApprovalRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return approvalRequests;
    }

    return approvalRequests.filter((request) => {
      return (
        request.name.toLowerCase().includes(query) ||
        request.location.toLowerCase().includes(query) ||
        request.contactPerson
          .toLowerCase()
          .includes(query) ||
        request.phone.toLowerCase().includes(query)
      );
    });
  }, [search, approvalRequests]);

  const pendingCount = approvalRequests.filter(
    (request) => request.status === "PENDING"
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                  width: "100%",
                  maxWidth: contentMaxWidth,
                  alignSelf: "center",
                }
              : undefined,
          ]}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                My Stockists
              </Text>

              <Text style={styles.subtitle}>
                View your approved stockists and manage new
                stockist approval requests.
              </Text>
            </View>

            {/* Tablet Add Button */}

            {isTablet && (
              <Pressable
                style={({ pressed }) => [
                  styles.addButtonTablet,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() =>
                  router.push("/stockist/add")
                }
              >
                <MaterialCommunityIcons
                  name="store-plus-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.addButtonText}>
                  Add Stockist
                </Text>
              </Pressable>
            )}
          </View>

          {/* SEARCH */}

          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={21}
              color={colors.textMuted}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={
                activeTab === "APPROVED"
                  ? "Search approved stockists..."
                  : "Search approval requests..."
              }
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <Pressable
                onPress={() => setSearch("")}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name="close-circle"
                  size={19}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
          </View>

          {/* TABS */}

          <View style={styles.tabs}>
            {/* APPROVED TAB */}

            <Pressable
              style={[
                styles.tab,
                activeTab === "APPROVED"
                  ? styles.activeTab
                  : undefined,
              ]}
              onPress={() =>
                setActiveTab("APPROVED")
              }
            >
              <MaterialCommunityIcons
                name="store-check-outline"
                size={18}
                color={
                  activeTab === "APPROVED"
                    ? colors.primary
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "APPROVED"
                    ? styles.activeTabText
                    : undefined,
                ]}
              >
                Approved
              </Text>

              <View
                style={[
                  styles.countBadge,
                  activeTab === "APPROVED"
                    ? styles.activeCountBadge
                    : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    activeTab === "APPROVED"
                      ? styles.activeCountText
                      : undefined,
                  ]}
                >
                  {approvedStockists.length}
                </Text>
              </View>
            </Pressable>

            {/* APPROVAL REQUESTS TAB */}

            <Pressable
              style={[
                styles.tab,
                activeTab === "REQUESTS"
                  ? styles.activeTab
                  : undefined,
              ]}
              onPress={() =>
                setActiveTab("REQUESTS")
              }
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color={
                  activeTab === "REQUESTS"
                    ? colors.primary
                    : colors.textSecondary
                }
              />

              <Text
                style={[
                  styles.tabText,
                  activeTab === "REQUESTS"
                    ? styles.activeTabText
                    : undefined,
                ]}
              >
                Approval Requests
              </Text>

              <View
                style={[
                  styles.countBadge,
                  activeTab === "REQUESTS"
                    ? styles.activeCountBadge
                    : undefined,
                ]}
              >
                <Text
                  style={[
                    styles.countText,
                    activeTab === "REQUESTS"
                      ? styles.activeCountText
                      : undefined,
                  ]}
                >
                  {approvalRequests.length}
                </Text>
              </View>
            </Pressable>
          </View>

          {/* PENDING APPROVAL MESSAGE */}

          {pendingCount > 0 && (
            <View style={styles.pendingBanner}>
              <View style={styles.pendingBannerIcon}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={21}
                  color={colors.warning}
                />
              </View>

              <View style={styles.pendingBannerContent}>
                <Text style={styles.pendingBannerTitle}>
                  {pendingCount}{" "}
                  {pendingCount === 1
                    ? "stockist request"
                    : "stockist requests"}{" "}
                  waiting for approval
                </Text>

                <Text style={styles.pendingBannerText}>
                  You can create medicine requests only after
                  Admin approves the stockist.
                </Text>
              </View>
            </View>
          )}

          {/* APPROVED STOCKISTS */}

          {activeTab === "APPROVED" && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>
                  APPROVED STOCKISTS
                </Text>

                <Text style={styles.sectionCount}>
                  {filteredStockists.length}
                </Text>
              </View>

              {filteredStockists.length > 0 ? (
                <View
                  style={[
                    styles.cardGrid,
                    isTablet
                      ? styles.cardGridTablet
                      : undefined,
                  ]}
                >
                  {filteredStockists.map(
                    (stockist) => (
                      <View
                        key={stockist.id}
                        style={[
                          styles.cardWrapper,
                          isTablet
                            ? styles.cardWrapperTablet
                            : undefined,
                        ]}
                      >
                        <ApprovedStockistCard
                          name={stockist.name}
                          location={
                            stockist.location
                          }
                          contactPerson={
                            stockist.contactPerson
                          }
                          phone={stockist.phone}
                          // Open Stockist Details
                          onPress={() =>
                            router.push({
                              pathname:
                                "/stockist/[id]",
                              params: {
                                id: stockist.id,
                              },
                            })
                          }
                          // Directly create a medicine request
                          onNewRequest={() =>
                            router.push({
                              pathname:
                                "/(tabs)/new-request",
                              params: {
                                stockistId:
                                  stockist.id,
                              },
                            })
                          }
                        />
                      </View>
                    )
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <MaterialCommunityIcons
                      name="store-search-outline"
                      size={38}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    No stockists found
                  </Text>

                  <Text style={styles.emptyText}>
                    Try using a different search term.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* APPROVAL REQUESTS */}

          {activeTab === "REQUESTS" && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>
                  STOCKIST APPROVAL REQUESTS
                </Text>

                <Text style={styles.sectionCount}>
                  {filteredApprovalRequests.length}
                </Text>
              </View>

              {filteredApprovalRequests.length >
              0 ? (
                <View
                  style={[
                    styles.cardGrid,
                    isTablet
                      ? styles.cardGridTablet
                      : undefined,
                  ]}
                >
                  {filteredApprovalRequests.map(
                    (request) => (
                      <View
                        key={request.id}
                        style={[
                          styles.cardWrapper,
                          isTablet
                            ? styles.cardWrapperTablet
                            : undefined,
                        ]}
                      >
                        <StockistApprovalCard
                          name={request.name}
                          location={
                            request.location
                          }
                          submittedDate={
                            request.submittedDate
                          }
                          status={request.status}
                          rejectionReason={
                            request.rejectionReason
                          }
                        />
                      </View>
                    )
                  )}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIcon}>
                    <MaterialCommunityIcons
                      name="clipboard-check-outline"
                      size={38}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.emptyTitle}>
                    No approval requests
                  </Text>

                  <Text style={styles.emptyText}>
                    Stockist requests submitted to Admin will
                    appear here.
                  </Text>
                </View>
              )}
            </>
          )}

          {/* MOBILE ADD STOCKIST BUTTON */}

          {!isTablet && (
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.push("/stockist/add")
              }
            >
              <MaterialCommunityIcons
                name="store-plus-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.addButtonText}>
                Add New Stockist
              </Text>
            </Pressable>
          )}
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
    paddingBottom: 120,
  },

  container: {
    flex: 1,
  },

  // Header

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 22,

    gap: 20,
  },

  headerText: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",

    color: colors.text,
  },

  subtitle: {
    marginTop: 6,

    maxWidth: 560,

    fontSize: 13,
    lineHeight: 19,

    color: colors.textSecondary,
  },

  // Search

  searchContainer: {
    minHeight: 50,

    paddingHorizontal: 14,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.card,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 14,
  },

  searchInput: {
    flex: 1,

    marginLeft: 8,
    marginRight: 8,

    paddingVertical: 0,

    fontSize: 14,

    color: colors.text,
  },

  // Tabs

  tabs: {
    marginTop: 18,

    padding: 4,

    flexDirection: "row",

    backgroundColor: "#EDF1F7",

    borderRadius: 14,
  },

  tab: {
    flex: 1,

    minHeight: 44,

    paddingHorizontal: 5,

    borderRadius: 11,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 5,
  },

  activeTab: {
    backgroundColor: colors.card,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 3,

    elevation: 1,
  },

  tabText: {
    fontSize: 11,
    fontWeight: "600",

    color: colors.textSecondary,
  },

  activeTabText: {
    color: colors.primary,
  },

  countBadge: {
    minWidth: 22,
    height: 22,

    paddingHorizontal: 5,

    borderRadius: 11,

    backgroundColor: "#DDE3ED",

    alignItems: "center",
    justifyContent: "center",
  },

  activeCountBadge: {
    backgroundColor: colors.primarySoft,
  },

  countText: {
    fontSize: 10,
    fontWeight: "700",

    color: colors.textSecondary,
  },

  activeCountText: {
    color: colors.primary,
  },

  // Pending banner

  pendingBanner: {
    marginTop: 16,

    padding: 13,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.warningSoft,

    borderRadius: 15,

    borderWidth: 1,
    borderColor: "#F8DFAC",
  },

  pendingBannerIcon: {
    width: 40,
    height: 40,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",
  },

  pendingBannerContent: {
    flex: 1,

    marginLeft: 11,
  },

  pendingBannerTitle: {
    fontSize: 12,
    fontWeight: "700",

    color: colors.text,
  },

  pendingBannerText: {
    marginTop: 3,

    fontSize: 11,
    lineHeight: 16,

    color: colors.textSecondary,
  },

  // Sections

  sectionHeader: {
    marginTop: 26,
    marginBottom: 12,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",

    letterSpacing: 0.7,

    color: colors.textSecondary,
  },

  sectionCount: {
    fontSize: 11,
    fontWeight: "700",

    color: colors.textMuted,
  },

  // Grid

  cardGrid: {
    gap: 12,
  },

  cardGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",

    alignItems: "flex-start",
  },

  cardWrapper: {
    width: "100%",
  },

  cardWrapperTablet: {
    width: "48.8%",
  },

  // Buttons

  addButtonTablet: {
    minHeight: 46,

    paddingVertical: 11,
    paddingHorizontal: 17,

    borderRadius: 13,

    backgroundColor: colors.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,
  },

  addButton: {
    marginTop: 26,

    minHeight: 54,

    borderRadius: 15,

    backgroundColor: colors.primary,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,
  },

  addButtonText: {
    fontSize: 14,
    fontWeight: "700",

    color: "#FFFFFF",
  },

  buttonPressed: {
    opacity: 0.85,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  // Empty states

  emptyState: {
    paddingVertical: 60,

    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    width: 68,
    height: 68,

    borderRadius: 22,

    backgroundColor: colors.primarySoft,

    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 14,

    fontSize: 16,
    fontWeight: "700",

    color: colors.text,
  },

  emptyText: {
    marginTop: 5,

    maxWidth: 300,

    textAlign: "center",

    fontSize: 12,
    lineHeight: 18,

    color: colors.textSecondary,
  },
});