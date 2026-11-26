import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { API_BASE_URL } from "../../config/api";
import { DetailSkeleton } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { useRequests } from "../../context/RequestContext";
import { useResponsive } from "../../hooks/useResponsive";
import { documentService } from "../../services/documentService";
import { colors } from "../../theme/colors";
import { DocumentItem } from "../../types/document";
import { Order } from "../../types/order";

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { isSuperAdmin } = useAuth();
  const { getOrderById, approveOrder, rejectOrder } = useRequests();
  const { gutter, contentMaxWidth } = useResponsive();

  const [order, setOrder] = useState<Order | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const [foundOrder, attachedDocs] = await Promise.all([
        getOrderById(id),
        documentService.getOrderDocuments(id).catch(() => []),
      ]);
      setOrder(foundOrder ?? null);
      setDocuments(attachedDocs || []);
    } catch {
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, getOrderById]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleApprove = () => {
    if (!id) return;
    Alert.alert(
      "Approve Order",
      `Are you sure you want to approve order ${order?.orderNo}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              setIsActionLoading(true);
              const updated = await approveOrder(id);
              setOrder(updated);
              Alert.alert("Success", `Order ${updated.orderNo} has been approved.`);
            } catch (err: any) {
              Alert.alert("Approval Failed", err?.message || "Could not approve order.");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = () => {
    if (!id) return;
    Alert.prompt(
      "Reject Order",
      "Enter the reason for rejecting this order:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async (reason?: string) => {
            try {
              setIsActionLoading(true);
              const updated = await rejectOrder(id, reason || "Order rejected by administrator");
              setOrder(updated);
              Alert.alert("Success", `Order ${updated.orderNo} was rejected.`);
            } catch (err: any) {
              Alert.alert("Rejection Failed", err?.message || "Could not reject order.");
            } finally {
              setIsActionLoading(false);
            }
          },
        },
      ],
      "plain-text",
      "Credit limit exceeded or stock unavailable"
    );
  };

  const handleOpenDoc = (url: string) => {
    if (!url) return;
    const fullUrl = url.startsWith("http")
      ? url
      : `${API_BASE_URL}${url.replace(/^\/api\/backend/, "")}`;
    Linking.openURL(fullUrl).catch(() => {});
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View
          style={[
            styles.skeletonContainer,
            { paddingHorizontal: gutter, maxWidth: contentMaxWidth },
          ]}
        >
          <DetailSkeleton />
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
          <Text style={styles.notFoundTitle}>Order not found</Text>
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

  const isPending = order.status.toLowerCase() === "pending";
  const isTransfer = order.orderType === "STOCKIST_TRANSFER";

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
            { maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              style={styles.backButton}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={22}
                color={colors.text}
              />
            </Pressable>

            <View style={styles.headerContent}>
              <Text style={styles.pageTitle}>Order Details</Text>
              <Text style={styles.requestNumber}>{order.orderNo}</Text>
            </View>

            <StatusBadge status={order.status} />
          </View>

          {/* Superadmin Action Buttons */}
          {isSuperAdmin && isPending && (
            <View style={styles.adminActionCard}>
              <Text style={styles.adminActionHeading}>Superadmin Actions</Text>
              <View style={styles.adminActionButtonsRow}>
                <Pressable
                  style={[styles.approveButton, isActionLoading && styles.btnDisabled]}
                  onPress={handleApprove}
                  disabled={isActionLoading}
                >
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>Approve Order</Text>
                </Pressable>

                <Pressable
                  style={[styles.rejectButton, isActionLoading && styles.btnDisabled]}
                  onPress={handleReject}
                  disabled={isActionLoading}
                >
                  <MaterialCommunityIcons name="close-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.rejectButtonText}>Reject Order</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Stockist Info */}
          <View style={styles.stockistCard}>
            <View style={styles.stockistIcon}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={26}
                color={colors.primary}
              />
            </View>
            <View style={styles.stockistInfo}>
              <Text style={styles.label}>
                {isTransfer ? "From Stockist" : "Stockist / Pharmacy"}
              </Text>
              <Text style={styles.stockistName}>
                {order.stockist?.name || "Direct Order"}
              </Text>
              {order.stockist?.location && (
                <Text style={styles.stockistLocation}>
                  {order.stockist.location}
                </Text>
              )}
            </View>
          </View>

          {isTransfer && order.toStockist && (
            <View style={[styles.stockistCard, styles.stockistCardSpaced]}>
              <View style={styles.stockistIcon}>
                <MaterialCommunityIcons
                  name="swap-horizontal"
                  size={26}
                  color={colors.primary}
                />
              </View>
              <View style={styles.stockistInfo}>
                <Text style={styles.label}>To Stockist</Text>
                <Text style={styles.stockistName}>
                  {order.toStockist.name}
                </Text>
                {order.toStockist.location && (
                  <Text style={styles.stockistLocation}>
                    {order.toStockist.location}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Request Overview */}
          <Text style={styles.sectionTitle}>Request Summary</Text>
          <View style={styles.infoCard}>
            <InfoRow
              icon={isTransfer ? "swap-horizontal" : "cart-outline"}
              label="Order Type"
              value={isTransfer ? "Stockist Transfer" : "Dealer Order"}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="calendar-clock"
              label="Created Date"
              value={createdDate}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="account-outline"
              label="Submitted By"
              value={order.createdBy?.name || "Medical Representative"}
            />
            <View style={styles.divider} />
            <InfoRow
              icon="package-variant-closed"
              label="Total Items / Units"
              value={`${order.itemCount || order.items.length} line items (${order.totalQuantity} total units)`}
            />
            {order.approvedBy && (
              <>
                <View style={styles.divider} />
                <InfoRow
                  icon="shield-check-outline"
                  label="Approved By"
                  value={order.approvedBy.name || "Administrator"}
                />
              </>
            )}
          </View>

          {/* Rejection Notice */}
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
          <Text style={styles.sectionTitle}>Ordered Medicines</Text>

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

          {/* Attached Documents Section */}
          <View style={styles.docHeaderRow}>
            <Text style={styles.sectionTitle}>Attached Documents</Text>
            <Pressable
              style={styles.attachDocButton}
              onPress={() =>
                router.push({
                  pathname: "/document/upload",
                  params: { orderId: order.id, orderNo: order.orderNo },
                })
              }
            >
              <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
              <Text style={styles.attachDocButtonText}>Attach Document</Text>
            </Pressable>
          </View>

          {documents.length === 0 ? (
            <View style={styles.emptyDocCard}>
              <MaterialCommunityIcons
                name="file-outline"
                size={32}
                color={colors.textMuted}
              />
              <Text style={styles.emptyDocText}>
                No documents or invoices attached yet.
              </Text>
            </View>
          ) : (
            <View style={styles.docsListCard}>
              {documents.map((doc, idx) => (
                <View key={doc.id}>
                  <Pressable
                    style={styles.docRow}
                    onPress={() => handleOpenDoc(doc.url)}
                  >
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={22}
                      color={colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.docItemName} numberOfLines={1}>
                        {doc.name}
                      </Text>
                      <Text style={styles.docItemMeta}>
                        Uploaded {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="open-in-new"
                      size={18}
                      color={colors.textMuted}
                    />
                  </Pressable>
                  {idx < documents.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>
          )}
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
  skeletonContainer: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContent: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.text,
  },
  requestNumber: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "400",
    color: colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  adminActionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 16,
  },
  adminActionHeading: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 10,
  },
  adminActionButtonsRow: {
    flexDirection: "row",
    gap: 10,
  },
  approveButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.success,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  approveButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  rejectButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
    backgroundColor: colors.danger,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  rejectButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  stockistCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  stockistCardSpaced: {
    marginTop: 10,
  },
  stockistIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  stockistInfo: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "400",
    color: colors.textMuted,
  },
  stockistName: {
    marginTop: 2,
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  stockistLocation: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "400",
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rejectionTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.danger,
  },
  rejectionText: {
    marginTop: 2,
    fontSize: 12,
    color: colors.text,
    fontWeight: "400",
  },
  medicineCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  medicineRow: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  medicineIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  medicineInfo: {
    flex: 1,
    marginLeft: 10,
  },
  medicineName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  medicineMeta: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "400",
  },
  medicineAmount: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  totalCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.primary,
  },
  docHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  attachDocButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },
  attachDocButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  emptyDocCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyDocText: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: 6,
  },
  docsListCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 10,
  },
  docItemName: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  docItemMeta: {
    fontSize: 11,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: 2,
  },
  notFoundTitle: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "500",
    color: colors.text,
  },
  notFoundText: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    fontWeight: "400",
  },
  backSimpleButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
  },
  backSimpleText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
});
