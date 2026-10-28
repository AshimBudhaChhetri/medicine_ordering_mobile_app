import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useRequests } from "../../context/RequestContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";
import { Order } from "../../types/order";

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { getOrderById } = useRequests();
  const { gutter, contentMaxWidth } = useResponsive();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrder() {
      if (!id) return;
      setIsLoading(true);
      try {
        const found = await getOrderById(id);
        if (isMounted) {
          setOrder(found ?? null);
        }
      } catch {
        if (isMounted) setOrder(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadOrder();
    return () => {
      isMounted = false;
    };
  }, [id, getOrderById]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <MaterialCommunityIcons
            name="file-document-remove-outline"
            size={48}
            color={colors.textMuted}
          />
          <Text style={styles.notFoundTitle}>Request not found</Text>
          <Text style={styles.notFoundText}>
            This order may have been deleted or is not accessible.
          </Text>

          <Pressable
            style={styles.backSimpleButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backSimpleText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const createdDate = new Date(order.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
                  width: "100%",
                  maxWidth: 900,
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

            <View style={styles.headerContent}>
              <Text style={styles.pageTitle}>Order Details</Text>
              <Text style={styles.requestNumber}>{order.orderNo}</Text>
            </View>

            <StatusBadge status={order.status} />
          </View>

          {/* Stockist Card */}
          <View style={styles.stockistCard}>
            <View style={styles.stockistIcon}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={26}
                color={colors.primary}
              />
            </View>

            <View style={styles.stockistInfo}>
              <Text style={styles.label}>STOCKIST</Text>
              <Text style={styles.stockistName}>{order.stockist?.name}</Text>
              <Text style={styles.stockistLocation}>
                {order.stockist?.location}
              </Text>
            </View>
          </View>

          {/* Order Information */}
          <Text style={styles.sectionTitle}>Order Information</Text>

          <View style={styles.infoCard}>
            <InfoRow
              icon="calendar-outline"
              label="Date Placed"
              value={createdDate}
            />

            <View style={styles.divider} />

            <InfoRow
              icon="pill"
              label="Total Line Items"
              value={`${order.items.length} items (${order.totalQuantity} units)`}
            />

            <View style={styles.divider} />

            <InfoRow
              icon="account-outline"
              label="Placed By"
              value={order.createdBy?.name || "Medical Representative"}
            />

            {order.approvedBy && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon="check-circle-outline"
                  label="Approved By"
                  value={order.approvedBy.name}
                />
              </>
            )}
          </View>

          {/* Rejection notice if rejected */}
          {order.rejectionReason && (
            <View style={styles.rejectionCard}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={22}
                color={colors.danger}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.rejectionTitle}>Rejection Reason</Text>
                <Text style={styles.rejectionText}>
                  {order.rejectionReason}
                </Text>
              </View>
            </View>
          )}

          {/* Requested Medicines */}
          <Text style={styles.sectionTitle}>Requested Medicines</Text>

          <View style={styles.medicineCard}>
            {order.items.map((item, index) => (
              <View key={item.id || item.productId || String(index)}>
                <View style={styles.medicineRow}>
                  <View style={styles.medicineIcon}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={20}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.medicineInfo}>
                    <Text style={styles.medicineName}>{item.productName}</Text>
                    <Text style={styles.medicineMeta}>
                      {item.quantity} units @ Rs. {item.rate.toFixed(2)}
                      {item.bonus > 0 ? ` • +${item.bonus} free bonus` : ""}
                    </Text>
                  </View>

                  <Text style={styles.medicineAmount}>
                    Rs. {item.amount.toFixed(2)}
                  </Text>
                </View>

                {index < order.items.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>

          {/* Grand Total */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Grand Total</Text>
            <Text style={styles.totalValue}>
              Rs. {order.grandTotal.toFixed(2)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const norm = (status || "").toLowerCase();

  let config = {
    text: "Pending",
    background: colors.warningSoft,
    color: colors.warning,
  };

  if (norm === "approved" || norm === "completed") {
    config = {
      text: "Approved",
      background: colors.successSoft,
      color: colors.success,
    };
  } else if (norm === "rejected" || norm === "cancelled") {
    config = {
      text: "Rejected",
      background: colors.dangerSoft,
      color: colors.danger,
    };
  }

  return (
    <View
      style={[
        styles.statusBadge,
        { backgroundColor: config.background },
      ]}
    >
      <Text style={[styles.statusText, { color: config.color }]}>
        {config.text}
      </Text>
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
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
  headerContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
  },
  requestNumber: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  stockistCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  stockistIcon: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stockistInfo: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  stockistName: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  stockistLocation: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 11,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  infoValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  rejectionCard: {
    marginTop: 14,
    backgroundColor: colors.dangerSoft,
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.danger,
  },
  rejectionText: {
    marginTop: 2,
    fontSize: 12,
    color: colors.text,
    fontWeight: "400",
  },
  medicineCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 15,
  },
  medicineRow: {
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  medicineIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  medicineInfo: {
    flex: 1,
    marginLeft: 11,
  },
  medicineName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  medicineMeta: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  medicineAmount: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  totalCard: {
    marginTop: 14,
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  notFoundTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  notFoundText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "400",
  },
  backSimpleButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
  },
  backSimpleText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
