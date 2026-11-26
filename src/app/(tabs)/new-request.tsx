import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useProducts } from "../../context/ProductContext";
import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";
import { OrderType } from "../../types/order";
import { Product } from "../../types/product";

export default function NewOrderScreen() {
  const params = useLocalSearchParams<{
    stockistId?: string;
  }>();

  const { stockists, refreshStockists } = useStockists();
  const { products, refreshProducts } = useProducts();
  const { createOrder } = useRequests();

  // Wizard state: 1 to 4 for Dealer, 1 to 5 for Transfer
  const [step, setStep] = useState<number>(params.stockistId ? 3 : 1);
  const [orderType, setOrderType] = useState<OrderType>("DEALER_ORDER");
  const isTransfer = orderType === "STOCKIST_TRANSFER";
  const totalSteps = isTransfer ? 5 : 4;

  const [selectedStockistId, setSelectedStockistId] = useState<string | undefined>(
    typeof params.stockistId === "string" ? params.stockistId : undefined
  );
  const [selectedToStockistId, setSelectedToStockistId] = useState<string | undefined>();
  const [cart, setCart] = useState<Record<string, { quantity: number }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNo: string; orderId: string } | null>(null);

  useFocusEffect(
    useCallback(() => {
      refreshStockists().catch(() => { });
      refreshProducts().catch(() => { });
    }, [refreshStockists, refreshProducts])
  );

  // Animated continuous progress bar
  const progressAnim = useRef(new Animated.Value((step / totalSteps) * 100)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (step / totalSteps) * 100,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [step, totalSteps, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // Selected Stockists
  const selectedStockist = stockists.find((s) => s.id === selectedStockistId);
  const selectedToStockist = stockists.find((s) => s.id === selectedToStockistId);

  // Filtered Stockists for Step 2
  const filteredStockists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stockists;
    return stockists.filter(
      (s) =>
        (s.name || "").toLowerCase().includes(q) ||
        (s.location || "").toLowerCase().includes(q)
    );
  }, [searchQuery, stockists]);

  // Filtered Destination Stockists for Step 3 in Transfer
  const filteredDestinationStockists = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stockists.filter((s) => {
      if (s.id === selectedStockistId) return false;
      if (!q) return true;
      return (
        (s.name || "").toLowerCase().includes(q) ||
        (s.location || "").toLowerCase().includes(q)
      );
    });
  }, [searchQuery, stockists, selectedStockistId]);

  // Filtered Products for Choose Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.type || "").toLowerCase().includes(q) ||
        (p.unit || "").toLowerCase().includes(q) ||
        (p.batch || "").toLowerCase().includes(q)
      );
    });
  }, [searchQuery, products]);

  // Selected Products in Cart
  const selectedMedicines = useMemo(() => {
    return products.filter((p) => (cart[p.id]?.quantity ?? 0) > 0);
  }, [products, cart]);

  const totalAmount = useMemo(() => {
    return selectedMedicines.reduce((sum, p) => {
      const qty = cart[p.id]?.quantity ?? 0;
      const rate = parseFloat(p.price) || 0;
      return sum + qty * rate;
    }, 0);
  }, [selectedMedicines, cart]);

  // Titles and Subtitles per Step
  const { subtitle, title } = useMemo(() => {
    if (step === 1) {
      return { subtitle: "", title: "New Order Type" };
    }
    const prefix = isTransfer ? "Stockist Transfer Order" : "Dealer Order";
    if (!isTransfer) {
      if (step === 2) return { subtitle: prefix, title: "Choose Stockist" };
      if (step === 3) return { subtitle: prefix, title: "Choose Products" };
      return { subtitle: prefix, title: "Adjust Quantity" };
    } else {
      if (step === 2) return { subtitle: prefix, title: "Source Stockist" };
      if (step === 3) return { subtitle: prefix, title: "Destination Stockist" };
      if (step === 4) return { subtitle: prefix, title: "Choose Products" };
      return { subtitle: prefix, title: "Adjust Quantity" };
    }
  }, [step, isTransfer]);

  // Step Validation
  const canProceedNext = useMemo(() => {
    if (step === 1) return true;
    if (!isTransfer) {
      if (step === 2) return Boolean(selectedStockistId);
      if (step === 3) return selectedMedicines.length > 0;
      if (step === 4) return selectedMedicines.length > 0 && !isSubmitting;
    } else {
      if (step === 2) return Boolean(selectedStockistId);
      if (step === 3) return Boolean(selectedToStockistId);
      if (step === 4) return selectedMedicines.length > 0;
      if (step === 5) return selectedMedicines.length > 0 && !isSubmitting;
    }
    return false;
  }, [
    step,
    isTransfer,
    selectedStockistId,
    selectedToStockistId,
    selectedMedicines.length,
    isSubmitting,
  ]);

  const isLastStep = (!isTransfer && step === 4) || (isTransfer && step === 5);

  function toggleProduct(product: Product) {
    setCart((prev) => {
      const next = { ...prev };
      if (next[product.id]) {
        delete next[product.id];
      } else {
        next[product.id] = { quantity: 1 };
      }
      return next;
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: { quantity },
      };
    });
  }

  function handleOrderTypeSelect(nextType: OrderType) {
    if (nextType === orderType) return;
    setOrderType(nextType);
    setSelectedToStockistId(undefined);
  }

  function handleNext() {
    if (isLastStep) {
      handleSubmit();
      return;
    }
    setSearchQuery("");
    setStep((prev) => prev + 1);
  }

  function handleBack() {
    if (step > 1) {
      setSearchQuery("");
      setStep((prev) => prev - 1);
    } else {
      handleClose();
    }
  }

  function handleClose() {
    router.replace("/(tabs)/orders");
  }

  async function handleSubmit() {
    if (!selectedStockist) {
      Alert.alert("Select Stockist", "Please select a stockist first.");
      setStep(2);
      return;
    }

    if (isTransfer && !selectedToStockist) {
      Alert.alert("Select Destination", "Please select a destination stockist.");
      setStep(3);
      return;
    }

    if (selectedMedicines.length === 0) {
      Alert.alert("Empty Order", "Please select at least one product.");
      setStep(isTransfer ? 4 : 3);
      return;
    }

    try {
      setIsSubmitting(true);
      const items = selectedMedicines.map((product) => {
        const itemState = cart[product.id];
        return {
          productName: product.name,
          quantity: itemState.quantity,
          bonus: 0,
          rate: parseFloat(product.price) || 0,
          productId: product.id,
        };
      });

      const order = await createOrder({
        orderType,
        stockistId: selectedStockist.id,
        toStockistId: isTransfer ? selectedToStockist?.id : undefined,
        items,
      });

      setOrderSuccess({ orderNo: order.orderNo, orderId: order.id });
    } catch (err: any) {
      Alert.alert(
        "Order Submission Failed",
        err?.message || "An unexpected error occurred while submitting."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Success view
  if (orderSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.successContainer}>
          <View style={styles.successContent}>
            <MaterialCommunityIcons name="check-circle" size={100} color="#22C55E" />
            <Text style={styles.successTitle}>Order placed successfully</Text>
            <Text style={styles.successSubtitle}>
              Order #{orderSuccess.orderNo} has been submitted.
            </Text>
          </View>
          <Pressable
            style={styles.successBtn}
            onPress={() => {
              setOrderSuccess(null);
              router.replace("/(tabs)/orders");
            }}
          >
            <Text style={styles.successBtnText}>View Orders</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Continuous Animated Progress Bar at the Very Top */}
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
      </View>

      {/* Top Header: Close Button ("X") */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }} />
        <Pressable
          style={styles.closeBtn}
          onPress={handleClose}
          accessibilityLabel="Close"
        >
          <MaterialCommunityIcons name="close" size={24} color="#000000" />
        </Pressable>
      </View>

      {/* Title & Subtitle Section */}
      <View style={styles.titleSection}>
        {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        <Text style={styles.titleText}>{title}</Text>
      </View>

      {/* STEP 1: New Order Type */}
      {step === 1 && (
        <View style={styles.stepOneContent}>
          <Pressable
            style={[
              styles.orderTypeCard,
              orderType === "DEALER_ORDER"
                ? styles.orderTypeCardSelected
                : styles.orderTypeCardUnselected,
            ]}
            onPress={() => handleOrderTypeSelect("DEALER_ORDER")}
          >
            <MaterialCommunityIcons
              name={orderType === "DEALER_ORDER" ? "radiobox-marked" : "radiobox-blank"}
              size={20}
              color={orderType === "DEALER_ORDER" ? "#2563EB" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.orderTypeLabel,
                orderType === "DEALER_ORDER" && styles.orderTypeLabelSelected,
              ]}
            >
              Dealer Order
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.orderTypeCard,
              orderType === "STOCKIST_TRANSFER"
                ? styles.orderTypeCardSelected
                : styles.orderTypeCardUnselected,
            ]}
            onPress={() => handleOrderTypeSelect("STOCKIST_TRANSFER")}
          >
            <MaterialCommunityIcons
              name={orderType === "STOCKIST_TRANSFER" ? "radiobox-marked" : "radiobox-blank"}
              size={20}
              color={orderType === "STOCKIST_TRANSFER" ? "#2563EB" : "#9CA3AF"}
            />
            <Text
              style={[
                styles.orderTypeLabel,
                orderType === "STOCKIST_TRANSFER" && styles.orderTypeLabelSelected,
              ]}
            >
              Stockist Transfer
            </Text>
          </Pressable>
        </View>
      )}

      {/* STEP 2: Choose Stockist (Dealer) OR Source Stockist (Transfer) */}
      {step === 2 && (
        <View style={styles.stepFlex}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredStockists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedStockistId;
              return (
                <Pressable
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  onPress={() => setSelectedStockistId(item.id)}
                >
                  <View style={[styles.itemImageBox, isSelected && styles.itemImageBoxSelected]}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={26}
                      color={isSelected ? "#2563EB" : "#9CA3AF"}
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#2563EB" />
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No stockists found</Text>
              </View>
            }
          />
        </View>
      )}

      {/* STEP 3 in Transfer: Destination Stockist */}
      {isTransfer && step === 3 && (
        <View style={styles.stepFlex}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredDestinationStockists}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedToStockistId;
              return (
                <Pressable
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  onPress={() => setSelectedToStockistId(item.id)}
                >
                  <View style={[styles.itemImageBox, isSelected && styles.itemImageBoxSelected]}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={26}
                      color={isSelected ? "#2563EB" : "#9CA3AF"}
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#2563EB" />
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No destination stockists found</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Choose Products: Step 3 (Dealer) or Step 4 (Transfer) */}
      {((!isTransfer && step === 3) || (isTransfer && step === 4)) && (
        <View style={styles.stepFlex}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor="#9CA3AF"
              clearButtonMode="while-editing"
            />
          </View>

          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const isSelected = (cart[item.id]?.quantity ?? 0) > 0;
              return (
                <Pressable
                  style={[styles.itemCard, isSelected && styles.itemCardSelected]}
                  onPress={() => toggleProduct(item)}
                >
                  <View style={[styles.itemImageBox, isSelected && styles.itemImageBoxSelected]}>
                    <MaterialCommunityIcons
                      name="image-outline"
                      size={26}
                      color={isSelected ? "#2563EB" : "#9CA3AF"}
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.itemSubtitle} numberOfLines={1}>
                      {item.type} • {item.unit}
                    </Text>
                    <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                  </View>
                  {isSelected && (
                    <View style={styles.selectedCheck}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#2563EB" />
                    </View>
                  )}
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products found</Text>
              </View>
            }
          />
        </View>
      )}

      {/* Adjust Quantity: Step 4 (Dealer) or Step 5 (Transfer) */}
      {((!isTransfer && step === 4) || (isTransfer && step === 5)) && (
        <View style={styles.stepFlex}>
          <FlatList
            data={selectedMedicines}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const currentQty = cart[item.id]?.quantity ?? 1;
              const rate = parseFloat(item.price) || 0;
              const subtotal = currentQty * rate;

              return (
                <View style={styles.adjustCard}>
                  <View style={styles.adjustImageBox}>
                    <MaterialCommunityIcons name="image-outline" size={26} color="#9CA3AF" />
                  </View>

                  <View style={{ display: "flex", flexDirection: "column", flexBasis: "auto", flexGrow: 1 }}>
                    <View style={styles.adjustInfo}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View style={{ display: "flex", flexDirection: "row", gap: "60" }}>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          Rs. {item.price}
                        </Text>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          Total: Rs. {subtotal}
                        </Text>
                      </View>
                    </View>
                    {/* Stepper with count, [+], [-] */}
                    <View style={styles.stepperContainer}>
                      <Text style={styles.stepperValue}>{currentQty}</Text>
                      <View style={{ display: "flex", flexDirection: "row", gap: 10, paddingRight: 20 }}>
                        <Pressable
                          style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
                          onPress={() => updateQuantity(item.id, currentQty + 1)}
                          accessibilityLabel="Increase quantity"
                        >
                          <MaterialCommunityIcons name="plus" size={16} color="#000000" />
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [styles.stepperBtn, pressed && { opacity: 0.6 }]}
                          onPress={() => updateQuantity(item.id, Math.max(1, currentQty - 1))}
                          accessibilityLabel="Decrease quantity"
                        >
                          <MaterialCommunityIcons name="minus" size={16} color="#000000" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No products selected</Text>
              </View>
            }
          />
        </View>
      )
      }

      {/* Bottom Bar: "< Back" on left, "Next >" on right */}
      <View style={styles.bottomBar}>
        {step > 1 ? (
          <Pressable
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.6 }]}
            onPress={handleBack}
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="chevron-left" size={20} color="#000000" />
            <Text style={styles.navBtnText}>Back</Text>
          </Pressable>
        ) : (
          <View style={{ width: 60 }} />
        )}

        {isLastStep ? (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryLabel}>Total:</Text>
            <Text style={styles.summaryValue}>Rs. {totalAmount}</Text>
          </View>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.navBtn,
            !canProceedNext && styles.navBtnDisabled,
            pressed && canProceedNext && { opacity: 0.6 },
          ]}
          onPress={handleNext}
          disabled={!canProceedNext || isSubmitting}
          accessibilityLabel={isLastStep ? "Submit Order" : "Next"}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <>
              <Text
                style={[
                  styles.navBtnText,
                  !canProceedNext && styles.navBtnTextDisabled,
                ]}
              >
                {isLastStep ? "Submit" : "Next"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={canProceedNext ? "#000000" : "#9CA3AF"}
              />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  progressBarTrack: {
    width: "100%",
    height: 3.5,
    backgroundColor: "#F3F4F6",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#2563EB",
    borderRadius: 2,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  closeBtn: {
    padding: 6,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 12,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: "300",
    color: "#000000",
    opacity: 0.5,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 26,
    fontWeight: "500",
    color: "#000000",
    letterSpacing: -0.3,
  },
  stepFlex: {
    flex: 1,
  },
  stepOneContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  orderTypeCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  orderTypeCardSelected: {
    backgroundColor: "#DCEBFE",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  orderTypeCardUnselected: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  orderTypeLabel: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000000",
    marginLeft: 10,
  },
  orderTypeLabelSelected: {
    fontWeight: "500",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 14,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
    fontWeight: "400",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 10,
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
  itemCardSelected: {
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
  },
  itemImageBox: {
    width: 68,
    alignSelf: "stretch",
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  itemImageBoxSelected: {
    backgroundColor: "#DBEAFE",
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
  selectedCheck: {
    paddingRight: 14,
  },
  adjustCard: {
    flexDirection: "row",
    minHeight: 68,
  },
  adjustImageBox: {
    width: 94,
    height: 94,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  adjustInfo: {
    flex: 1,
    paddingHorizontal: 12,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 10,
    paddingLeft: 4,
  },
  stepperValue: {
    fontSize: 17,
    fontWeight: "500",
    color: "#000000",
    minWidth: 26,
    textAlign: "center",
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E7EB",
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  navBtnDisabled: {
    opacity: 0.35,
  },
  navBtnText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  navBtnTextDisabled: {
    color: "#9CA3AF",
  },
  summaryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "300",
    color: "#000000",
    opacity: 0.6,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "300",
    color: "#000000",
    opacity: 0.5,
  },
  successContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  successContent: {
    alignItems: "center",
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "500",
    color: "#000000",
    marginTop: 20,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    fontWeight: "300",
    color: "#000000",
    opacity: 0.6,
    marginTop: 8,
    textAlign: "center",
  },
  successOrderNo: {
    fontWeight: "500",
    color: "#000000",
  },
  successBtn: {
    backgroundColor: "#000000",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  successBtnText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
