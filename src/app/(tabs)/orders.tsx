import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { OrderReviewSheet } from "../../components/OrderReviewSheet";
import { OrderDocumentsModal } from "../../components/OrderDocumentsModal";
import { TopBar } from "../../components/TopBar";
import { useAuth } from "../../context/AuthContext";
import { useRequests } from "../../context/RequestContext";
import { Order } from "../../types/order";

type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export default function OrdersScreen() {
  const { isSuperAdmin } = useAuth();
  const { requests, orders, isLoading, refreshOrders } = useRequests();

  const [activeFilter, setActiveFilter] = useState<StatusFilter>("ALL");
  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Modal sheet states
  const [reviewOrder, setReviewOrder] = useState<{ id: string; orderNo: string } | null>(null);
  const [documentsOrder, setDocumentsOrder] = useState<{ id: string; orderNo: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshOrders().catch(() => { });
    }, [refreshOrders])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshOrders().catch(() => { });
    setIsRefreshing(false);
  }, [refreshOrders]);

  // Status counts calculated from orders
  const counts = useMemo(() => {
    const list = orders && orders.length > 0 ? orders : requests.map((r) => r.rawOrder).filter(Boolean);
    let all = list.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    for (const order of list) {
      const s = (order?.status || "").toLowerCase();
      if (s === "pending") pending++;
      else if (s === "approved") approved++;
      else if (s === "rejected") rejected++;
    }

    return { all, pending, approved, rejected };
  }, [orders, requests]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sourceOrders: Order[] =
      orders && orders.length > 0
        ? orders
        : (requests.map((r) => r.rawOrder).filter(Boolean) as Order[]);

    return sourceOrders.filter((order) => {
      if (!order) return false;
      const statusNorm = (order.status || "").toLowerCase();
      const matchesStatus =
        activeFilter === "ALL" || statusNorm === activeFilter.toLowerCase();

      if (!matchesStatus) return false;

      if (!query) return true;

      const orderNo = (order.orderNo || "").toLowerCase();
      const stockistName = (order.stockist?.name || "").toLowerCase();
      const toStockistName = (order.toStockist?.name || "").toLowerCase();
      const hasProduct = order.items?.some((i) =>
        (i.productName || "").toLowerCase().includes(query)
      );

      return (
        orderNo.includes(query) ||
        stockistName.includes(query) ||
        toStockistName.includes(query) ||
        hasProduct
      );
    });
  }, [orders, requests, activeFilter, search]);

  const renderOrderCard = ({ item }: { item: Order }) => {
    const status = (item.status || "pending").toLowerCase();
    const stockistName = item.stockist?.name || "Ram Pharma";
    const stockistLocation = item.stockist?.location || "KTM";
    const toStockistName = item.toStockist?.name || "Shree Pharma";
    const toStockistLocation = item.toStockist?.location || "BKT";
    const itemCount = item.items?.length || item.itemCount || 4;
    const grandTotal = item.grandTotal ?? 4900;

    return (
      <View style={styles.cardContainer}>
        {/* Left main clickable area */}
        <Pressable
          style={styles.cardLeftContent}
          onPress={() =>
            router.push({
              pathname: "/request/[id]",
              params: { id: item.id },
            })
          }
        >
          {/* Line 1: Stockist name and location */}
          <View style={styles.stockistRow}>
            <Text style={styles.stockistName} numberOfLines={1}>
              {stockistName}
            </Text>
            {stockistLocation ? (
              <Text style={styles.locationTag}>{stockistLocation}</Text>
            ) : null}
          </View>

          {/* Line 2: Transfer row — only shown for STOCKIST_TRANSFER orders */}
          {item.orderType === "STOCKIST_TRANSFER" && (
            <View style={styles.transferRow}>
              <MaterialCommunityIcons name="swap-horizontal" size={18} color="#111827" />
              <Text style={styles.toStockistName} numberOfLines={1}>
                {toStockistName}
              </Text>
              {toStockistLocation ? (
                <Text style={styles.locationTag}>{toStockistLocation}</Text>
              ) : null}
            </View>
          )}

          {/* Line 3: Status icon + Items count + Total amount */}
          <View style={styles.metaRow}>
            {status === "approved" ? (
              <MaterialCommunityIcons name="check-circle" size={18} color="#22C55E" />
            ) : status === "rejected" ? (
              <MaterialCommunityIcons name="close-circle" size={18} color="#EF4444" />
            ) : (
              <MaterialCommunityIcons name="clock-time-four" size={18} color="#F59E0B" />
            )}

            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="paperclip" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>{itemCount}</Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="currency-inr" size={14} color="#9CA3AF" />
              <Text style={styles.metaText}>Rs. {grandTotal}</Text>
            </View>
          </View>
        </Pressable>

        {/* Right Action Button 1: Attachments / Documents (Light Blue) */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtnBlue,
            pressed ? styles.actionBtnBluePressed : styles.actionBtnBlueNormal,
          ]}
          onPress={() => setDocumentsOrder({ id: item.id, orderNo: item.orderNo })}
          accessibilityLabel="Attached documents"
        >
          <MaterialCommunityIcons name="paperclip" size={22} color="#111827" />
        </Pressable>

        {/* Right Action Button 2: Remarks / Chat (Light Yellow) */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtnYellow,
            pressed ? styles.actionBtnYellowPressed : styles.actionBtnYellowNormal,
          ]}
          onPress={() => setReviewOrder({ id: item.id, orderNo: item.orderNo })}
          accessibilityLabel="Comments and timeline"
        >
          <MaterialCommunityIcons name="message-text-outline" size={22} color="#111827" />
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <TopBar />

      {/* Header Section: "Orders" Title + Status Pills */}
      <View style={styles.headerSection}>
        <View style={styles.titleAndPillsGrid}>
          {/* Top Line: Title "Orders" on left, "rejected" and "pending" on right */}
          <View style={styles.headerTopLine}>
            <Text style={styles.screenTitle}>Orders</Text>
            <View style={styles.pillsRow}>

            </View>
          </View>

          {/* Bottom Line of Pills: "All" and "approved" */}
          <View style={styles.headerBottomLine}>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === "ALL" ? styles.filterPillActive : styles.filterPillInactive,
              ]}
              onPress={() => setActiveFilter("ALL")}
            >
              <Text
                style={[
                  styles.pillLabel,
                  activeFilter === "ALL" ? styles.pillLabelActive : styles.pillLabelInactive,
                ]}
              >
                All{" "}
                <Text
                  style={activeFilter === "ALL" ? styles.pillCountActive : styles.pillCountInactive}
                >
                  {counts.all}
                </Text>
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.filterPill,
                activeFilter === "REJECTED" ? styles.filterPillRejectedActive : styles.filterPillInactive,
              ]}
              onPress={() => setActiveFilter(activeFilter === "REJECTED" ? "ALL" : "REJECTED")}
            >
              <Text
                style={[
                  styles.pillLabel,
                  activeFilter === "REJECTED" ? styles.pillLabelActive : styles.pillLabelInactive,
                ]}
              >
                rejected{" "}
                <Text
                  style={
                    activeFilter === "REJECTED" ? styles.pillCountActive : styles.pillCountInactive
                  }
                >
                  {counts.rejected}
                </Text>
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === "PENDING" ? styles.filterPillPendingActive : styles.filterPillInactive,
              ]}
              onPress={() => setActiveFilter(activeFilter === "PENDING" ? "ALL" : "PENDING")}
            >
              <Text
                style={[
                  styles.pillLabel,
                  activeFilter === "PENDING" ? styles.pillLabelActive : styles.pillLabelInactive,
                ]}
              >
                pending{" "}
                <Text
                  style={
                    activeFilter === "PENDING" ? styles.pillCountActive : styles.pillCountInactive
                  }
                >
                  {counts.pending}
                </Text>
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.filterPill,
                activeFilter === "APPROVED" ? styles.filterPillApprovedActive : styles.filterPillInactive,
              ]}
              onPress={() => setActiveFilter(activeFilter === "APPROVED" ? "ALL" : "APPROVED")}
            >
              <Text
                style={[
                  styles.pillLabel,
                  activeFilter === "APPROVED" ? styles.pillLabelActive : styles.pillLabelInactive,
                ]}
              >
                approved{" "}
                <Text
                  style={
                    activeFilter === "APPROVED" ? styles.pillCountActive : styles.pillCountInactive
                  }
                >
                  {counts.approved}
                </Text>
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Orders List */}
      <FlatList
        style={styles.list}
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: isSuperAdmin ? 24 : 104 },
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={44} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No orders found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? "Try searching with a different term." : "No orders match this status."}
              </Text>
            </View>
          ) : null
        }
      />

      {/* Always visible "+ New Order" button — hidden for superadmin */}
      {!isSuperAdmin && (
        <View style={styles.floatingBottomContainer} pointerEvents="box-none">
          <LinearGradient
            colors={[
              "rgba(255, 255, 255, 0)",
              "rgba(255, 255, 255, 0.45)",
              "rgba(255, 255, 255, 0.9)",
              "#FFFFFF",
            ]}
            locations={[0, 0.35, 0.7, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <Pressable
            style={({ pressed }) => [styles.newOrderButton, pressed && { opacity: 0.7 }]}
            onPress={() => router.push("/(tabs)/new-request")}
            accessibilityRole="button"
            accessibilityLabel="New Order"
          >
            <MaterialCommunityIcons name="plus-circle-outline" size={24} color="#000000" />
            <Text style={styles.newOrderText}>New Order</Text>
          </Pressable>
        </View>
      )}

      {/* Attached Documents Modal */}
      <OrderDocumentsModal
        visible={Boolean(documentsOrder)}
        orderId={documentsOrder?.id ?? null}
        orderNo={documentsOrder?.orderNo ?? null}
        onClose={() => setDocumentsOrder(null)}
      />

      {/* Remarks/Timeline Sheet Modal */}
      {reviewOrder && (
        <OrderReviewSheet
          visible={Boolean(reviewOrder)}
          orderId={reviewOrder.id}
          orderNo={reviewOrder.orderNo}
          onClose={() => setReviewOrder(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  titleAndPillsGrid: {
    gap: 8,
  },
  headerTopLine: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "#000000",
    letterSpacing: -0.5,
  },
  pillsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerBottomLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterPillActive: {
    backgroundColor: "#2563EB",
  },
  filterPillRejectedActive: {
    backgroundColor: "#f03636ff",
  },
  filterPillPendingActive: {
    backgroundColor: "#f09936ff",
  },
  filterPillApprovedActive: {
    backgroundColor: "#1f9930ff",
  },
  filterPillInactive: {
    backgroundColor: "#F3F4F6",
  },
  pillLabel: {
    fontSize: 13,
  },
  pillLabelActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  pillLabelInactive: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  pillCountActive: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  pillCountInactive: {
    color: "#6B7280",
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 14,
    marginTop: 16,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
    fontWeight: "400",
  },
  list: {
    flex: 1,
    zIndex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 104,
  },
  cardContainer: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    marginBottom: 14,
    overflow: "hidden",
  },
  cardLeftContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "space-between",
  },
  stockistRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockistName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
  locationTag: {
    fontSize: 10,
    fontWeight: "400",
    color: "#9CA3AF",
    marginLeft: 4,
  },
  transferRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  toStockistName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#111827",
    marginLeft: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    gap: 12,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  metaText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
  },
  actionBtnBlue: {
    width: 52,
    backgroundColor: "#DCEBFE",
    justifyContent: "center",
    alignItems: "center",
  },
  actionBtnBlueNormal: {
    borderTopWidth: 2.5,
    borderTopColor: "#eef5ffff",
    borderBottomWidth: 2.5,
    borderBottomColor: "#b2d6ffff",
  },
  actionBtnBluePressed: {
    borderTopWidth: 1.5,
    borderTopColor: "#c9d6e9ff",
    borderLeftWidth: 1.5,
    borderLeftColor: "#c9d6e9ff",
    borderRightWidth: 1.5,
    borderRightColor: "#c9d6e9ff",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "#d4e2f5ff"
  },
  actionBtnYellow: {
    width: 52,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  actionBtnYellowNormal: {
    borderBottomWidth: 2.5,
    borderBottomColor: "#ffdf75ff",
    borderTopWidth: 2.5,
    borderTopColor: "#fffbeeff",
  },
  actionBtnYellowPressed: {
    borderTopWidth: 1.5,
    borderTopColor: "#eee3b9ff",
    borderLeftWidth: 1.5,
    borderLeftColor: "#eee3b9ff",
    borderRightWidth: 1.5,
    borderRightColor: "#eee3b9ff",
    borderBottomWidth: 0,
    borderBottomColor: "transparent",
    backgroundColor: "#f7ecc1ff",
  },
  floatingBottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 96,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 14,
    zIndex: 50,
  },
  newOrderButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 20,
  },
  newOrderText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#000000",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
});
