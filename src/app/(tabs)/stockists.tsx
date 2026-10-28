import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
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
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function StockistsScreen() {
  const { stockists, isLoading, refreshStockists } = useStockists();

  const [search, setSearch] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshStockists().catch(() => {});
    setIsRefreshing(false);
  }, [refreshStockists]);

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
              <Text style={styles.subtitle}>
                View and manage the pharmacies and stockists in your territory.
              </Text>
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
              {filteredStockists.map((stockist) => (
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
                size={21}
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
    paddingTop: 12,
    paddingBottom: 120,
  },
  container: {
    flex: 1,
  },
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
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    maxWidth: 560,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    fontWeight: "400",
  },
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
    fontWeight: "400",
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
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
    marginTop: 20,
    minHeight: 52,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  emptyState: {
    padding: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  emptyText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "400",
  },
  emptyAddButton: {
    marginTop: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  emptyAddText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
