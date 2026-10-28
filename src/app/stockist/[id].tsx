import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function StockistDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { stockists } = useStockists();
  const { requests } = useRequests();

  const { gutter, contentMaxWidth } = useResponsive();

  const stockist = stockists.find((item) => item.id === id);

  // Orders for this stockist
  const stockistRequests = useMemo(() => {
    return requests.filter((r) => r.stockistId === id);
  }, [requests, id]);

  const pendingCount = stockistRequests.filter(
    (r) => (r.status || "").toLowerCase() === "pending"
  ).length;

  const approvedCount = stockistRequests.filter((r) => {
    const s = (r.status || "").toLowerCase();
    return s === "approved" || s === "completed";
  }).length;

  if (!stockist) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Stockist not found</Text>

          <Pressable
            style={styles.backButtonSimple}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const createdDate = stockist.createdAt
    ? new Date(stockist.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Recently added";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter },
        ]}
      >
        <View
          style={[
            styles.container,
            contentMaxWidth
              ? {
                  maxWidth: 900,
                  width: "100%",
                  alignSelf: "center",
                }
              : undefined,
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={23}
                color={colors.text}
              />
            </Pressable>

            <Text style={styles.pageTitle}>Stockist Details</Text>
          </View>

          {/* Main Stockist Card */}
          <View style={styles.mainCard}>
            <View style={styles.stockistHeader}>
              <View style={styles.stockistIcon}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <View style={styles.stockistInfo}>
                <Text style={styles.stockistName}>{stockist.name}</Text>
                <Text style={styles.location}>{stockist.location}</Text>
              </View>

              <View style={styles.activeBadge}>
                <Text style={styles.activeText}>Active</Text>
              </View>
            </View>
          </View>

          {/* Business Information */}
          <Text style={styles.sectionTitle}>Stockist Information</Text>

          <View style={styles.detailsCard}>
            <DetailRow
              icon="map-marker-outline"
              label="Location / Area"
              value={stockist.location}
            />

            <View style={styles.divider} />

            <DetailRow
              icon="calendar-outline"
              label="Registered On"
              value={createdDate}
            />
          </View>

          {/* Request Summary */}
          <Text style={styles.sectionTitle}>Medicine Requests</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{stockistRequests.length}</Text>
              <Text style={styles.summaryLabel}>Total Orders</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{pendingCount}</Text>
              <Text style={styles.summaryLabel}>Pending</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryValue}>{approvedCount}</Text>
              <Text style={styles.summaryLabel}>Approved</Text>
            </View>
          </View>

          {/* Recent Requests for this Stockist */}
          {stockistRequests.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitleNoMargin}>Recent Orders</Text>
              </View>

              {stockistRequests.slice(0, 5).map((request) => (
                <Pressable
                  key={request.id}
                  style={styles.requestCard}
                  onPress={() =>
                    router.push({
                      pathname: "/request/[id]",
                      params: { id: request.id },
                    })
                  }
                >
                  <View>
                    <Text style={styles.requestId}>{request.requestNumber}</Text>
                    <Text style={styles.requestMeta}>
                      {request.totalItems} units • Rs. {request.totalAmount.toFixed(2)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          request.status?.toLowerCase() === "approved"
                            ? colors.successSoft
                            : request.status?.toLowerCase() === "rejected"
                            ? colors.dangerSoft
                            : colors.warningSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            request.status?.toLowerCase() === "approved"
                              ? colors.success
                              : request.status?.toLowerCase() === "rejected"
                              ? colors.danger
                              : colors.warning,
                        },
                      ]}
                    >
                      {request.status}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </>
          )}

          {/* Create Request Button */}
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/new-request",
                params: { stockistId: stockist.id },
              })
            }
          >
            <MaterialCommunityIcons
              name="plus"
              size={21}
              color="#FFFFFF"
            />
            <Text style={styles.primaryButtonText}>
              Create Medicine Request
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 60,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  mainCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  stockistHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockistIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stockistInfo: {
    flex: 1,
    marginLeft: 14,
  },
  stockistName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  location: {
    marginTop: 3,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  activeBadge: {
    backgroundColor: colors.successSoft,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  sectionTitle: {
    marginTop: 26,
    marginBottom: 12,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  detailsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  detailValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  summaryLabel: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 26,
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  requestCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestId: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  requestMeta: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  primaryButton: {
    minHeight: 52,
    marginTop: 28,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  backButtonSimple: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
