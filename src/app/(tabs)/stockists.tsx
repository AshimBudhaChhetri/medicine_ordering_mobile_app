import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ApprovedStockistCard } from "../../components/ApprovedStockistCard";
import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function StockistsScreen() {
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
              <Text style={styles.title}>My Stockists</Text>
              {/* <Text style={styles.subtitle}>
                View and manage the pharmacies and stockists in your territory.
              </Text> */}
            </View>

            {/* Tablet Add Button */}
            {isTablet && (
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
          <View style={styles.searchContainer}>
            <MaterialCommunityIcons
              name="magnify"
              size={21}
              color={colors.textMuted}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search stockists by name or location..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")} hitSlop={10}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={19}
                  color={colors.textMuted}
                />
              </Pressable>
            )}
          </View>

          {/* LIST HEADER */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Registered Stockists</Text>
            <Text style={styles.sectionCount}>{filteredStockists.length}</Text>
          </View>

          {/* LOADING STATE */}
          {isLoading && !isRefreshing && stockists.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : filteredStockists.length > 0 ? (
            <View
              style={[
                styles.cardGrid,
                isTablet ? styles.cardGridTablet : undefined,
              ]}
            >
              {filteredStockists.map((stockist) => {
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
                    key={stockist.id}
                    style={[
                      styles.cardWrapper,
                      isTablet ? styles.cardWrapperTablet : undefined,
                    ]}
                  >
                    <ApprovedStockistCard
                      name={stockist.name}
                      location={stockist.location}
                      totalOrders={totalOrders}
                      createdDate={createdDate}
                      onPress={() =>
                        router.push({
                          pathname: "/stockist/[id]",
                          params: { id: stockist.id },
                        })
                      }
                      onNewRequest={() =>
                        router.push({
                          pathname: "/(tabs)/new-request",
                          params: { stockistId: stockist.id },
                        })
                      }
                    />
                  </View>
                );
              })}
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
                  : "Add your first stockist to start placing orders."}
              </Text>

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
            </View>
          )}

          {/* MOBILE ADD STOCKIST BUTTON */}
          {!isTablet && (
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
    fontWeight: "600",
    color: colors.text,
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 9,
    fontSize: 14,
    color: colors.text,
    paddingVertical: 0,
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
    fontWeight: "600",
    color: colors.text,
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
