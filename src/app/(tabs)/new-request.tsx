import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useProducts } from "../../context/ProductContext";
import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";
import { Product } from "../../types/product";

interface CartItemState {
  quantity: number;
  bonus: number;
}

export default function NewRequestScreen() {
  const params = useLocalSearchParams<{
    stockistId?: string;
  }>();

  const { stockists } = useStockists();
  const { products, isLoading: isProductsLoading } = useProducts();
  const { createOrder } = useRequests();

  const { gutter, contentMaxWidth } = useResponsive();

  // =========================================================
  // STOCKIST
  // =========================================================

  const [stockistSearch, setStockistSearch] = useState("");

  const [selectedStockistId, setSelectedStockistId] = useState<string | undefined>(
    typeof params.stockistId === "string" ? params.stockistId : undefined
  );

  const selectedStockist = stockists.find(
    (stockist) => stockist.id === selectedStockistId
  );

  const filteredStockists = useMemo(() => {
    const query = stockistSearch.trim().toLowerCase();
    if (!query) {
      return [];
    }

    return stockists
      .filter((stockist) => {
        return (
          stockist.name.toLowerCase().includes(query) ||
          stockist.location.toLowerCase().includes(query)
        );
      })
      .slice(0, 10);
  }, [stockistSearch, stockists]);

  // =========================================================
  // MEDICINES / PRODUCTS
  // =========================================================

  const [medicineSearch, setMedicineSearch] = useState("");

  const filteredMedicines = useMemo(() => {
    if (!selectedStockist) {
      return [];
    }

    const query = medicineSearch.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) => {
      return (
        product.name.toLowerCase().includes(query) ||
        product.type.toLowerCase().includes(query) ||
        product.unit.toLowerCase().includes(query) ||
        product.batch.toLowerCase().includes(query)
      );
    });
  }, [medicineSearch, selectedStockist, products]);

  // =========================================================
  // CART
  // =========================================================

  const [cart, setCart] = useState<Record<string, CartItemState>>({});

  const selectedMedicines = useMemo(() => {
    return products.filter((product) => (cart[product.id]?.quantity ?? 0) > 0);
  }, [products, cart]);

  const medicineCount = selectedMedicines.length;

  const totalQuantity = useMemo(() => {
    return selectedMedicines.reduce((total, product) => {
      const item = cart[product.id];
      return total + (item?.quantity ?? 0) + (item?.bonus ?? 0);
    }, 0);
  }, [selectedMedicines, cart]);

  const totalAmount = useMemo(() => {
    return selectedMedicines.reduce((total, product) => {
      const item = cart[product.id];
      const rate = parseFloat(product.price) || 0;
      return total + (item?.quantity ?? 0) * rate;
    }, 0);
  }, [selectedMedicines, cart]);

  // =========================================================
  // QUANTITY MODAL
  // =========================================================

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [bonus, setBonus] = useState(0);
  const [quantityModal, setQuantityModal] = useState(false);

  function openProduct(product: Product) {
    if (product.amount <= 0) {
      Alert.alert(
        "Out of Stock",
        "This medicine is currently out of stock in warehouse inventory."
      );
      return;
    }

    setSelectedProduct(product);
    const existing = cart[product.id];
    setQuantity(existing?.quantity ?? 1);
    setBonus(existing?.bonus ?? 0);
    setQuantityModal(true);
  }

  function addProductToCart() {
    if (!selectedProduct) return;

    if (quantity < 1) {
      Alert.alert("Invalid Quantity", "Quantity must be at least 1.");
      return;
    }

    if (quantity + bonus > selectedProduct.amount) {
      Alert.alert(
        "Stock Limit Exceeded",
        `Only ${selectedProduct.amount} units available in inventory.`
      );
      return;
    }

    setCart((current) => ({
      ...current,
      [selectedProduct.id]: {
        quantity,
        bonus,
      },
    }));

    setQuantityModal(false);
    setSelectedProduct(null);
    setQuantity(1);
    setBonus(0);
    setMedicineSearch("");
  }

  function changeCartQuantity(product: Product, delta: number) {
    const current = cart[product.id];
    if (!current) return;

    const newQuantity = current.quantity + delta;
    if (newQuantity <= 0) {
      removeFromCart(product.id);
      return;
    }

    if (newQuantity + current.bonus > product.amount) {
      Alert.alert(
        "Stock Limit Exceeded",
        `Only ${product.amount} units available in inventory.`
      );
      return;
    }

    setCart((prev) => ({
      ...prev,
      [product.id]: {
        ...current,
        quantity: newQuantity,
      },
    }));
  }

  function removeFromCart(productId: string) {
    setCart((current) => {
      const updated = { ...current };
      delete updated[productId];
      return updated;
    });
  }

  // =========================================================
  // CART MODAL & SUBMIT
  // =========================================================

  const [cartModal, setCartModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function resetRequestForm() {
    setSelectedStockistId(undefined);
    setStockistSearch("");
    setMedicineSearch("");
    setCart({});
    setSelectedProduct(null);
    setQuantity(1);
    setBonus(0);
    setQuantityModal(false);
    setCartModal(false);
  }

  async function handleSubmit() {
    if (!selectedStockist) {
      Alert.alert("Select Stockist", "Please select a stockist.");
      return;
    }

    if (selectedMedicines.length === 0) {
      Alert.alert("Empty Request", "Please add at least one medicine.");
      return;
    }

    try {
      setIsSubmitting(true);

      const items = selectedMedicines.map((product) => {
        const itemState = cart[product.id];
        return {
          productName: product.name,
          quantity: itemState.quantity,
          bonus: itemState.bonus || 0,
          rate: parseFloat(product.price) || 0,
          productId: product.id,
        };
      });

      const order = await createOrder({
        stockistId: selectedStockist.id,
        items,
      });

      resetRequestForm();

      Alert.alert(
        "Order Created",
        `Order ${order.orderNo} has been submitted successfully.`,
        [
          {
            text: "View Order",
            onPress: () =>
              router.push({
                pathname: "/request/[id]",
                params: { id: order.id },
              }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Order Submission Failed", err?.message || "Failed to submit order.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
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
                  maxWidth: 850,
                  alignSelf: "center",
                }
              : undefined,
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.title}>New Medicine Request</Text>
            <Text style={styles.subtitle}>
              Choose a stockist and add the medicines they require.
            </Text>
          </View>

          {/* STEP 1 - STOCKIST */}
          <View style={styles.stepHeader}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepTitle}>Select Stockist</Text>
          </View>

          {!selectedStockist ? (
            <>
              {/* STOCKIST SEARCH */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={21}
                  color={colors.textMuted}
                />
                <TextInput
                  value={stockistSearch}
                  onChangeText={setStockistSearch}
                  placeholder="Search stockist name or location..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  autoCorrect={false}
                />
                {stockistSearch.length > 0 && (
                  <Pressable onPress={() => setStockistSearch("")}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={19}
                      color={colors.textMuted}
                    />
                  </Pressable>
                )}
              </View>

              {/* STOCKIST RESULTS */}
              {filteredStockists.map((stockist) => (
                <Pressable
                  key={stockist.id}
                  style={({ pressed }) => [
                    styles.resultCard,
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => {
                    setSelectedStockistId(stockist.id);
                    setStockistSearch("");
                  }}
                >
                  <View style={styles.resultIcon}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={21}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{stockist.name}</Text>
                    <Text style={styles.resultMeta}>{stockist.location}</Text>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={22}
                    color={colors.textMuted}
                  />
                </Pressable>
              ))}

              {/* NO RESULTS */}
              {stockistSearch.trim().length > 0 &&
                filteredStockists.length === 0 && (
                  <View style={styles.noResult}>
                    <MaterialCommunityIcons
                      name="store-search-outline"
                      size={36}
                      color={colors.textMuted}
                    />
                    <Text style={styles.noResultTitle}>No stockist found</Text>
                    <Text style={styles.noResultText}>
                      Try another stockist name or add a new stockist.
                    </Text>

                    <Pressable
                      style={styles.addStockistButton}
                      onPress={() => router.push("/stockist/add")}
                    >
                      <MaterialCommunityIcons
                        name="store-plus-outline"
                        size={18}
                        color={colors.primary}
                      />
                      <Text style={styles.addStockistText}>Add New Stockist</Text>
                    </Pressable>
                  </View>
                )}

              {stockistSearch.trim().length === 0 && stockists.length === 0 && (
                <View style={styles.noResult}>
                  <MaterialCommunityIcons
                    name="storefront-outline"
                    size={36}
                    color={colors.textMuted}
                  />
                  <Text style={styles.noResultTitle}>No stockists registered</Text>
                  <Text style={styles.noResultText}>
                    Add your first stockist to start placing requests.
                  </Text>
                  <Pressable
                    style={styles.addStockistButton}
                    onPress={() => router.push("/stockist/add")}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={18}
                      color={colors.primary}
                    />
                    <Text style={styles.addStockistText}>Add Stockist</Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : (
            /* SELECTED STOCKIST */
            <View style={styles.selectedStockistCard}>
              <View style={styles.resultIcon}>
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>

              <View style={styles.resultInfo}>
                <Text style={styles.selectedLabel}>Selected Stockist</Text>
                <Text style={styles.resultName}>{selectedStockist.name}</Text>
                <Text style={styles.resultMeta}>{selectedStockist.location}</Text>
              </View>

              <Pressable
                onPress={() => {
                  if (selectedMedicines.length > 0) {
                    Alert.alert(
                      "Change Stockist?",
                      "Changing the stockist will clear the medicines currently in your cart.",
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Change",
                          style: "destructive",
                          onPress: () => {
                            setSelectedStockistId(undefined);
                            setCart({});
                            setMedicineSearch("");
                          },
                        },
                      ]
                    );
                  } else {
                    setSelectedStockistId(undefined);
                  }
                }}
              >
                <Text style={styles.changeText}>Change</Text>
              </Pressable>
            </View>
          )}

          {/* STEP 2 - MEDICINES */}
          {selectedStockist && (
            <>
              <View style={[styles.stepHeader, styles.medicineStep]}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Add Medicines</Text>
              </View>

              {/* MEDICINE SEARCH */}
              <View style={styles.searchContainer}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={colors.textMuted}
                />
                <TextInput
                  value={medicineSearch}
                  onChangeText={setMedicineSearch}
                  placeholder="Search medicine, category, or batch..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.searchInput}
                  autoCorrect={false}
                />
                {medicineSearch.length > 0 && (
                  <Pressable onPress={() => setMedicineSearch("")}>
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={19}
                      color={colors.textMuted}
                    />
                  </Pressable>
                )}
              </View>

              {/* LIST HEADER */}
              <View style={styles.medicineListHeader}>
                <Text style={styles.medicineListTitle}>
                  {medicineSearch.trim() ? "Search Results" : "Catalogue Products"}
                </Text>
                <Text style={styles.medicineCount}>
                  {filteredMedicines.length}
                </Text>
              </View>

              {isProductsLoading ? (
                <View style={{ paddingVertical: 30, alignItems: "center" }}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ) : (
                filteredMedicines.map((product) => {
                  const added = cart[product.id]?.quantity ?? 0;
                  const outOfStock = product.amount <= 0;
                  const lowStock = product.amount > 0 && product.amount <= 10;
                  const price = parseFloat(product.price) || 0;

                  return (
                    <Pressable
                      key={product.id}
                      style={({ pressed }) => [
                        styles.medicineResult,
                        outOfStock && styles.medicineDisabled,
                        pressed && !outOfStock && styles.cardPressed,
                      ]}
                      onPress={() => openProduct(product)}
                    >
                      <View style={styles.medicineIcon}>
                        <MaterialCommunityIcons
                          name="pill"
                          size={21}
                          color={outOfStock ? colors.textMuted : colors.primary}
                        />
                      </View>

                      <View style={styles.resultInfo}>
                        <Text
                          style={[
                            styles.resultName,
                            outOfStock && styles.disabledText,
                          ]}
                        >
                          {product.name}
                        </Text>

                        <Text style={styles.resultMeta}>
                          {product.type} • {product.unit} • Batch: {product.batch}
                        </Text>

                        <View style={styles.medicineMetaRow}>
                          <Text style={styles.price}>
                            Rs. {price.toFixed(2)}
                          </Text>

                          <Text
                            style={[
                              styles.stock,
                              outOfStock
                                ? styles.outOfStock
                                : lowStock
                                ? styles.lowStock
                                : styles.inStock,
                            ]}
                          >
                            {outOfStock
                              ? "Out of Stock"
                              : lowStock
                              ? `Low Stock (${product.amount})`
                              : `In Stock (${product.amount})`}
                          </Text>
                        </View>
                      </View>

                      {added > 0 ? (
                        <View style={styles.addedBadge}>
                          <Text style={styles.addedText}>
                            ✓ {added} added
                          </Text>
                        </View>
                      ) : (
                        <MaterialCommunityIcons
                          name="plus-circle-outline"
                          size={26}
                          color={outOfStock ? colors.textMuted : colors.primary}
                        />
                      )}
                    </Pressable>
                  );
                })
              )}

              {/* NO MEDICINES FOUND */}
              {!isProductsLoading && filteredMedicines.length === 0 && (
                <View style={styles.noResult}>
                  <MaterialCommunityIcons
                    name="pill-off"
                    size={36}
                    color={colors.textMuted}
                  />
                  <Text style={styles.noResultTitle}>No products found</Text>
                  <Text style={styles.noResultText}>
                    Try searching for another product name or category.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* FLOATING CART BAR */}
      {medicineCount > 0 && (
        <Pressable
          style={[styles.cartBar, { marginHorizontal: gutter }]}
          onPress={() => setCartModal(true)}
        >
          <View style={styles.cartIcon}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={23}
              color="#FFFFFF"
            />
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{medicineCount}</Text>
            </View>
          </View>

          <View style={styles.cartInfo}>
            <Text style={styles.cartTitle}>
              {medicineCount} {medicineCount === 1 ? "medicine" : "medicines"}
            </Text>
            <Text style={styles.cartUnits}>{totalQuantity} total units</Text>
          </View>

          <View style={styles.cartAmountArea}>
            <Text style={styles.cartAmount}>Rs. {totalAmount.toFixed(2)}</Text>
            <Text style={styles.viewCartText}>View Cart →</Text>
          </View>
        </Pressable>
      )}

      {/* QUANTITY MODAL */}
      <Modal
        visible={quantityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setQuantityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            {selectedProduct && (
              <>
                <View style={styles.modalHandle} />

                <View style={styles.modalMedicineHeader}>
                  <View style={styles.largeMedicineIcon}>
                    <MaterialCommunityIcons
                      name="pill"
                      size={26}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.modalMedicineInfo}>
                    <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                    <Text style={styles.modalSubtitle}>
                      {selectedProduct.type} • {selectedProduct.unit}
                    </Text>
                  </View>

                  <Pressable onPress={() => setQuantityModal(false)}>
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>

                {/* PRODUCT INFO */}
                <View style={styles.productInfoRow}>
                  <View style={styles.productInfoBox}>
                    <Text style={styles.smallLabel}>Rate</Text>
                    <Text style={styles.productInfoValue}>
                      Rs. {(parseFloat(selectedProduct.price) || 0).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.productInfoBox}>
                    <Text style={styles.smallLabel}>Available Stock</Text>
                    <Text style={styles.productInfoValue}>
                      {selectedProduct.amount}
                    </Text>
                  </View>
                </View>

                {/* QUANTITY PICKER */}
                <Text style={styles.quantityLabel}>Enter Quantity</Text>
                <View style={styles.quantityPicker}>
                  <Pressable
                    style={styles.quantityButton}
                    onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={22}
                      color={colors.primary}
                    />
                  </Pressable>

                  <TextInput
                    value={String(quantity)}
                    onChangeText={(val) => {
                      const clean = val.replace(/\D/g, "");
                      setQuantity(clean ? Number(clean) : 1);
                    }}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={styles.quantityInput}
                  />

                  <Pressable
                    style={styles.quantityButton}
                    onPress={() =>
                      setQuantity(
                        Math.min(selectedProduct.amount - bonus, quantity + 1)
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={22}
                      color={colors.primary}
                    />
                  </Pressable>
                </View>

                {/* BONUS UNITS */}
                <View style={styles.bonusRow}>
                  <View>
                    <Text style={styles.bonusLabel}>Bonus Units (Free)</Text>
                    <Text style={styles.bonusSubtext}>Promotional non-billed units</Text>
                  </View>
                  <View style={styles.bonusPicker}>
                    <Pressable
                      style={styles.bonusButton}
                      onPress={() => setBonus(Math.max(0, bonus - 1))}
                    >
                      <MaterialCommunityIcons
                        name="minus"
                        size={18}
                        color={colors.primary}
                      />
                    </Pressable>
                    <Text style={styles.bonusText}>{bonus}</Text>
                    <Pressable
                      style={styles.bonusButton}
                      onPress={() =>
                        setBonus(
                          Math.min(selectedProduct.amount - quantity, bonus + 1)
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="plus"
                        size={18}
                        color={colors.primary}
                      />
                    </Pressable>
                  </View>
                </View>

                {/* TOTAL */}
                <View style={styles.modalTotal}>
                  <Text style={styles.totalLabel}>Line Total</Text>
                  <Text style={styles.totalValue}>
                    Rs. {(quantity * (parseFloat(selectedProduct.price) || 0)).toFixed(2)}
                  </Text>
                </View>

                {/* ADD CART BUTTON */}
                <Pressable
                  style={styles.primaryButton}
                  onPress={addProductToCart}
                >
                  <MaterialCommunityIcons
                    name="cart-plus"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.primaryButtonText}>
                    {cart[selectedProduct.id] ? "Update Cart" : "Add to Cart"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* CART MODAL */}
      <Modal
        visible={cartModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCartModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.bottomSheet, styles.cartSheet]}>
            <View style={styles.modalHandle} />

            <View style={styles.cartHeader}>
              <View>
                <Text style={styles.modalTitle}>Your Request</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedStockist?.name}
                </Text>
              </View>

              <Pressable onPress={() => setCartModal(false)}>
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color={colors.text}
                />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedMedicines.map((product) => {
                const itemState = cart[product.id];
                const price = parseFloat(product.price) || 0;

                return (
                  <View key={product.id} style={styles.cartItem}>
                    <View style={styles.cartItemInfo}>
                      <Text style={styles.cartMedicineName}>{product.name}</Text>
                      <Text style={styles.resultMeta}>
                        {product.unit}
                        {itemState.bonus > 0 ? ` • +${itemState.bonus} free bonus` : ""}
                      </Text>
                      <Text style={styles.cartPriceText}>
                        Rs. {price.toFixed(2)} each
                      </Text>
                    </View>

                    <View style={styles.cartQuantity}>
                      <Pressable onPress={() => changeCartQuantity(product, -1)}>
                        <MaterialCommunityIcons
                          name="minus-circle-outline"
                          size={24}
                          color={colors.primary}
                        />
                      </Pressable>
                      <Text style={styles.cartQuantityText}>
                        {itemState.quantity}
                      </Text>
                      <Pressable onPress={() => changeCartQuantity(product, 1)}>
                        <MaterialCommunityIcons
                          name="plus-circle-outline"
                          size={24}
                          color={colors.primary}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.cartItemAmount}>
                      Rs. {(itemState.quantity * price).toFixed(2)}
                    </Text>

                    <Pressable onPress={() => removeFromCart(product.id)}>
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={22}
                        color={colors.danger}
                      />
                    </Pressable>
                  </View>
                );
              })}

              {/* TOTALS */}
              <View style={styles.cartTotals}>
                <View style={styles.totalLine}>
                  <Text style={styles.totalLabel}>Line Items</Text>
                  <Text style={styles.totalText}>{medicineCount}</Text>
                </View>

                <View style={styles.totalLine}>
                  <Text style={styles.totalLabel}>Total Units (incl. bonus)</Text>
                  <Text style={styles.totalText}>{totalQuantity}</Text>
                </View>

                <View style={[styles.totalLine, styles.finalTotal]}>
                  <Text style={styles.finalTotalLabel}>Grand Total</Text>
                  <Text style={styles.finalTotalValue}>
                    Rs. {totalAmount.toFixed(2)}
                  </Text>
                </View>
              </View>

              {/* SUBMIT BUTTON */}
              <Pressable
                style={[
                  styles.primaryButton,
                  styles.submitButton,
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="send-outline"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.primaryButtonText}>Submit Order</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 150,
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 26,
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  stepHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 10,
  },
  medicineStep: {
    marginTop: 28,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  searchContainer: {
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: "400",
  },
  resultCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  resultIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  resultMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "400",
  },
  selectedStockistCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  selectedLabel: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: "500",
    marginBottom: 2,
  },
  changeText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  medicineListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 12,
  },
  medicineListTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  medicineCount: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textMuted,
  },
  medicineResult: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  medicineDisabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
  medicineIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  medicineMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  price: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  stock: {
    fontSize: 11,
    fontWeight: "500",
  },
  inStock: {
    color: colors.success,
  },
  lowStock: {
    color: colors.warning,
  },
  outOfStock: {
    color: colors.danger,
  },
  addedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: colors.successSoft,
  },
  addedText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  noResult: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 10,
  },
  noResultTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  noResultText: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    fontWeight: "400",
  },
  addStockistButton: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  addStockistText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
  cartBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 88,
    minHeight: 64,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.primaryDark,
  },
  cartIcon: {
    position: "relative",
  },
  cartCountBadge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  cartCountText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  cartInfo: {
    flex: 1,
    marginLeft: 16,
  },
  cartTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  cartUnits: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "400",
  },
  cartAmountArea: {
    alignItems: "flex-end",
  },
  cartAmount: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  viewCartText: {
    color: "#E2E8F0",
    fontSize: 11,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartSheet: {
    maxHeight: "85%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalMedicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  largeMedicineIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modalMedicineInfo: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "400",
  },
  productInfoRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  productInfoBox: {
    flex: 1,
    padding: 12,
    backgroundColor: "#FAFBFD",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  smallLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  productInfoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginTop: 4,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 10,
  },
  quantityPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 8,
  },
  quantityButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  quantityInput: {
    minWidth: 80,
    textAlign: "center",
    fontSize: 22,
    fontWeight: "600",
    color: colors.text,
    paddingVertical: 4,
  },
  bonusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#FAFBFD",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bonusLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  bonusSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  bonusPicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bonusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  bonusText: {
    fontSize: 15,
    fontWeight: "600",
    minWidth: 20,
    textAlign: "center",
    color: colors.text,
  },
  modalTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 18,
    marginBottom: 18,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.primary,
  },
  primaryButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  cartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartMedicineName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  cartPriceText: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "400",
  },
  cartQuantity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cartQuantityText: {
    minWidth: 20,
    textAlign: "center",
    fontWeight: "600",
    color: colors.text,
  },
  cartItemAmount: {
    minWidth: 70,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  cartTotals: {
    marginTop: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FAFBFD",
    borderWidth: 1,
    borderColor: colors.border,
  },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  finalTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: 0,
  },
  finalTotalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  finalTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.primary,
  },
  submitButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  cardPressed: {
    opacity: 0.75,
  },
});
