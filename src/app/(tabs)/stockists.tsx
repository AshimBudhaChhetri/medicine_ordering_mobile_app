import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { StockistCardSkeleton } from "../../components/Skeleton";
import { useAuth } from "../../context/AuthContext";
import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function StockistsScreen() {
  const { isSuperAdmin } = useAuth();
  const { stockists, isLoading, refreshStockists } = useStockists();
  const { requests, refreshOrders } = useRequests();

  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  // Re-fetch stockists and orders whenever the tab comes into focus
  useFocusEffect(
    useCallback(() => {
      refreshStockists().catch(() => { });
      refreshOrders().catch(() => { });
    }, [refreshStockists, refreshOrders])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      refreshStockists().catch(() => { }),
      refreshOrders().catch(() => { }),
    ]);
    setIsRefreshing(false);
  }, [refreshStockists, refreshOrders]);

  // Map orders count by stockist ID
  const ordersCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const req of requests) {
      if (req.stockistId) {
        map[req.stockistId] = (map[req.stockistId] || 0) + 1;
      }
    }
    return map;
  }, [requests]);

  // Filter stockists
  const filteredStockists = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return stockists;
    }

    return stockists.filter((stockist) => {
      return (
        stockist.name.toLowerCase().includes(query) ||
        stockist.location.toLowerCase().includes(query)
      );
    });
  }, [search, stockists]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        key={isTablet ? "stockists-tablet" : "stockists-phone"}
        data={filteredStockists}
        keyExtractor={(item) => item.id}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? styles.stockistRow : undefined}
        renderItem={({ item: stockist }) => {
          const totalOrders = ordersCountMap[stockist.id] || 0;
          const createdDate = stockist.createdAt
            ? new Date(stockist.createdAt).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
            : undefined;

          return (
            <View
              style={[
                styles.stockistItem,
                isTablet && styles.stockistItemTablet,
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.itemCard,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() =>
                  router.push({
                    pathname: "/stockist/[id]",
                    params: { id: stockist.id },
                  })
                }
              >
                {/* Icon */}
                <View style={styles.itemImageBox}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={26}
                    color="#9CA3AF"
                  />
                </View>

                {/* Info */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {stockist.name}
                  </Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {stockist.location}
                  </Text>
                  {totalOrders > 0 && (
                    <Text style={styles.itemMeta}>
                      {totalOrders} {totalOrders === 1 ? "order" : "orders"} placed
                    </Text>
                  )}
                </View>

                {/* New Order shortcut */}
                <Pressable
                  style={styles.newOrderBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    router.push({
                      pathname: "/(tabs)/new-request",
                      params: { stockistId: stockist.id },
                    });
                  }}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="plus" size={18} color="#7a7a7aff" />
                </Pressable>
              </Pressable>
            </View>
          );
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter },
          contentMaxWidth
            ? {
              width: "100%",
              maxWidth: contentMaxWidth,
              alignSelf: "center",
            }
            : undefined,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        ListHeaderComponent={
          <View>
            {/* HEADER */}
            <View style={styles.header}>
              <View style={styles.headerText}>
                <Text style={styles.title}>Stockists</Text>
              </View>

              {/* Tablet Add Button */}
              {isTablet && isSuperAdmin && (
                <Pressable
                  style={({ pressed }) => [
                    styles.addButtonTablet,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.push("/stockist/add")}
                >
                  <MaterialCommunityIcons
                    name="store-plus-outline"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.addButtonText}>Add Stockist</Text>
                </Pressable>
              )}
            </View>

            {/* SEARCH */}
            <View style={styles.searchBar}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color="#9CA3AF"
              />

              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search"
                placeholderTextColor="#9CA3AF"
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
                clearButtonMode="while-editing"
              />

              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="close-circle"
                    size={18}
                    color="#9CA3AF"
                  />
                </Pressable>
              )}
            </View>

            {/* LIST HEADER */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionLabel}>Registered Stockists</Text>
              <Text style={styles.sectionCount}>
                {filteredStockists.length}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading && !isRefreshing && stockists.length === 0 ? (
            <View
              style={[
                styles.cardGrid,
                isTablet ? styles.cardGridTablet : undefined,
              ]}
            >
              {Array.from({ length: 4 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.cardWrapper,
                    isTablet ? styles.cardWrapperTablet : undefined,
                  ]}
                >
                  <StockistCardSkeleton />
                </View>
              ))}
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

              <Text style={styles.emptyTitle}>No stockists found</Text>
              <Text style={styles.emptyText}>
                {search.trim().length > 0
                  ? "Try using a different search term."
                  : isSuperAdmin
                    ? "Add your first stockist to start placing orders."
                    : "No stockists have been assigned to your areas yet."}
              </Text>

              {isSuperAdmin && (
                <Pressable
                  style={styles.emptyAddButton}
                  onPress={() => router.push("/stockist/add")}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.emptyAddText}>Add Stockist</Text>
                </Pressable>
              )}
            </View>
          )
        }
        ListFooterComponent={
          !isTablet && isSuperAdmin ? (
            <Pressable
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.push("/stockist/add")}
            >
              <MaterialCommunityIcons
                name="store-plus-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>Add New Stockist</Text>
            </Pressable>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 16,
    paddingBottom: 30,
  },
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: "500",
    color: "#000000",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  addButtonTablet: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButton: {
    marginTop: 20,
    backgroundColor: colors.primary,
    borderRadius: 14,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 14,
    marginTop: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
    fontWeight: "400",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cardGrid: {
    gap: 12,
  },
  cardGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  cardWrapper: {
    width: "100%",
  },
  cardWrapperTablet: {
    width: "48%",
  },
  stockistRow: {
    gap: 16,
    marginBottom: 16,
  },
  stockistItem: {
    width: "100%",
    marginBottom: 10,
  },
  stockistItemTablet: {
    flex: 1,
    width: undefined,
    marginBottom: 0,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
    minHeight: 68,
  },
  itemImageBox: {
    width: 68,
    alignSelf: "stretch",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  itemInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
  },
  itemSubtitle: {
    fontSize: 12,
    fontWeight: "300",
    color: "#000000",
    opacity: 0.6,
    marginTop: 2,
  },
  itemMeta: {
    fontSize: 11,
    fontWeight: "400",
    color: "#2563EB",
    marginTop: 3,
  },
  newOrderBtn: {
    width: 46,
    height: 46,
    borderRadius: 6,
    backgroundColor: "#e4e4e4ff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  emptyState: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    marginVertical: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
    fontWeight: "400",
  },
  emptyAddButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyAddText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },
});
