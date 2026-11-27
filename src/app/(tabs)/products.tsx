import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMediaUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";
import { ProductCardSkeleton } from "../../components/Skeleton";
import { TopBar } from "../../components/TopBar";

export default function ProductsScreen() {
  const { isSuperAdmin } = useAuth();
  const { products, isLoading, refreshProducts, catalogOptions } = useProducts();
  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshProducts().catch(() => {});
    }, [refreshProducts])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshProducts().catch(() => {});
    setIsRefreshing(false);
  }, [refreshProducts]);

  // Extract unique types for filtering
  const productTypes = useMemo(() => {
    const typesSet = new Set<string>();
    products.forEach((p) => {
      if (p.type && p.type.trim()) {
        typesSet.add(p.type.trim());
      }
    });
    if (catalogOptions?.types) {
      catalogOptions.types.forEach((t) => {
        if (t.name && t.name.trim()) {
          typesSet.add(t.name.trim());
        }
      });
    }
    return ["ALL", ...Array.from(typesSet)];
  }, [products, catalogOptions]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesType =
        selectedType === "ALL" ||
        (product.type &&
          product.type.trim().toLowerCase() === selectedType.toLowerCase());

      if (!matchesType) return false;

      if (!query) return true;

      const nameMatch = product.name?.toLowerCase().includes(query);
      const batchMatch = product.batch?.toLowerCase().includes(query);
      const typeMatch = product.type?.toLowerCase().includes(query);
      const unitMatch = product.unit?.toLowerCase().includes(query);

      return nameMatch || batchMatch || typeMatch || unitMatch;
    });
  }, [products, search, selectedType]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <TopBar />
      <FlatList
        key={isTablet ? "products-tablet" : "products-phone"}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={isTablet ? 2 : 1}
        columnWrapperStyle={isTablet ? styles.productRow : undefined}
        renderItem={({ item: product }) => {
          const priceNum = parseFloat(product.price) || 0;
          const isOutOfStock = product.amount <= 0;
          const isLowStock = !isOutOfStock && product.amount <= 10;
          const imageUrl = getMediaUrl(product.imageUrl);

          return (
            <View
              style={[
                styles.productItem,
                isTablet && styles.productItemTablet,
              ]}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.itemCard,
                  pressed && { opacity: 0.88 },
                ]}
                onPress={() => router.push("/(tabs)/new-request")}
              >
                {/* Image Box */}
                <View style={styles.itemImageBox}>
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.itemImage}
                      contentFit="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name="image-outline"
                      size={26}
                      color="#9CA3AF"
                    />
                  )}
                </View>

                {/* Info */}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.itemSubtitle} numberOfLines={1}>
                    {product.type || "Medicine"} • {product.unit || "Unit"}
                  </Text>
                  <Text style={styles.itemPrice}>
                    Rs. {priceNum.toFixed(2)}
                  </Text>
                </View>

                {/* Stock Tag on the right */}
                <View style={styles.itemRightAction}>
                  <View
                    style={[
                      styles.stockBadge,
                      isOutOfStock
                        ? styles.stockBadgeOut
                        : isLowStock
                        ? styles.stockBadgeLow
                        : styles.stockBadgeIn,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockBadgeText,
                        isOutOfStock
                          ? styles.stockTextOut
                          : isLowStock
                          ? styles.stockTextLow
                          : styles.stockTextIn,
                      ]}
                    >
                      {isOutOfStock
                        ? "Out of stock"
                        : `${product.amount} in stock`}
                    </Text>
                  </View>
                </View>
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
                <Text style={styles.title}>Products</Text>
              </View>

              {/* Admin Add Product Shortcut */}
              {isSuperAdmin && (
                <Pressable
                  style={({ pressed }) => [
                    styles.adminAddButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={() => router.push("/product/add")}
                >
                  <MaterialCommunityIcons
                    name="plus"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.adminAddText}>Add Product</Text>
                </Pressable>
              )}
            </View>

            {/* SEARCH BAR */}
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

            {/* TYPE FILTER CHIPS */}
            {productTypes.length > 2 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterRow}
              >
                {productTypes.map((type) => {
                  const isSelected = selectedType === type;
                  return (
                    <Pressable
                      key={type}
                      onPress={() => setSelectedType(type)}
                      style={[
                        styles.filterChip,
                        isSelected && styles.filterChipSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          isSelected && styles.filterChipTextSelected,
                        ]}
                      >
                        {type === "ALL" ? "All Items" : type}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        }
        ListEmptyComponent={
          isLoading && !isRefreshing && products.length === 0 ? (
            <View style={[styles.grid, isTablet && styles.gridTablet]}>
              {Array.from({ length: 4 }).map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.cardWrapper,
                    isTablet && styles.cardWrapperTablet,
                  ]}
                >
                  <ProductCardSkeleton />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="package-variant"
                size={48}
                color={colors.textMuted}
              />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>
                Try adjusting your search query or selected filter.
              </Text>
            </View>
          )
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
    paddingVertical: 16,
    paddingBottom: 100, // room for bottom bar and FAB
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontStyle: "italic",
    fontWeight: "normal",
    color: "#000000",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: "300",
    color: "#000000",
    marginTop: 2,
  },
  adminAddButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    gap: 4,
  },
  adminAddText: {
    color: "#FFFFFF",
    fontSize: 13,
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
    fontWeight: "400",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#000000",
  },
  filterChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  grid: {
    flexDirection: "column",
    gap: 10,
  },
  gridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  productRow: {
    gap: 12,
    marginBottom: 12,
  },
  productItem: {
    width: "100%",
    marginBottom: 10,
  },
  productItemTablet: {
    flex: 1,
    width: undefined,
    marginBottom: 0,
  },
  cardWrapper: {
    width: "100%",
  },
  cardWrapperTablet: {
    width: "48.5%",
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F2F5",
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
  itemImage: {
    width: "100%",
    height: "100%",
  },
  itemInfo: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  itemPrice: {
    fontSize: 13,
    fontWeight: "400",
    color: "#000000",
    marginTop: 3,
  },
  itemRightAction: {
    paddingRight: 14,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  stockBadgeIn: {
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  stockBadgeLow: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warning,
  },
  stockBadgeOut: {
    backgroundColor: colors.dangerSoft,
    borderColor: colors.danger,
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  stockTextIn: {
    color: colors.success,
  },
  stockTextLow: {
    color: colors.warning,
  },
  stockTextOut: {
    color: colors.danger,
  },
  emptyContainer: {
    paddingVertical: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "300",
    color: "#000000",
    marginTop: 4,
    textAlign: "center",
    maxWidth: 260,
  },
});
