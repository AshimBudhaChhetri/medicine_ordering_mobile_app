import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";

import {
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

import { useRequests } from "../../context/RequestContext";
import { useStockists } from "../../context/StockistContext";
import { useResponsive } from "../../hooks/useResponsive";

import {
  Medicine,
  medicines,
} from "../../mock/medicines";

import { colors } from "../../theme/colors";

export default function NewRequestScreen() {
  const params = useLocalSearchParams<{
    stockistId?: string;
  }>();

  const { approvedStockists } = useStockists();
  const { createRequest } = useRequests();

  const {
    gutter,
    contentMaxWidth,
  } = useResponsive();

  // =========================================================
  // STOCKIST
  // =========================================================

  const [
    stockistSearch,
    setStockistSearch,
  ] = useState("");

  const [
    selectedStockistId,
    setSelectedStockistId,
  ] = useState<string | undefined>(
    typeof params.stockistId === "string"
      ? params.stockistId
      : undefined
  );

  const selectedStockist =
    approvedStockists.find(
      (stockist) =>
        stockist.id === selectedStockistId
    );

  const filteredStockists = useMemo(() => {
    const query =
      stockistSearch
        .trim()
        .toLowerCase();

    if (!query) {
      return [];
    }

    return approvedStockists
      .filter((stockist) => {
        return (
          stockist.name
            .toLowerCase()
            .includes(query) ||
          stockist.location
            .toLowerCase()
            .includes(query) ||
          stockist.contactPerson
            .toLowerCase()
            .includes(query) ||
          stockist.phone
            .toLowerCase()
            .includes(query)
        );
      })
      .slice(0, 10);
  }, [
    stockistSearch,
    approvedStockists,
  ]);

  // =========================================================
  // MEDICINES
  // =========================================================

  const [
    medicineSearch,
    setMedicineSearch,
  ] = useState("");

  /**
   * If a stockist has been selected:
   *
   * - empty search = show ALL medicines
   * - search text = show filtered medicines
   */
  const filteredMedicines = useMemo(() => {
    if (!selectedStockist) {
      return [];
    }

    const query =
      medicineSearch
        .trim()
        .toLowerCase();

    if (!query) {
      return medicines;
    }

    return medicines.filter(
      (medicine) => {
        return (
          medicine.name
            .toLowerCase()
            .includes(query) ||
          medicine.company
            .toLowerCase()
            .includes(query) ||
          medicine.packSize
            .toLowerCase()
            .includes(query)
        );
      }
    );
  }, [
    medicineSearch,
    selectedStockist,
  ]);

  // =========================================================
  // CART
  // =========================================================

  const [cart, setCart] =
    useState<Record<string, number>>(
      {}
    );

  const selectedMedicines =
    medicines.filter(
      (medicine) =>
        (cart[medicine.id] ?? 0) > 0
    );

  const medicineCount =
    selectedMedicines.length;

  const totalQuantity =
    selectedMedicines.reduce(
      (total, medicine) => {
        return (
          total +
          (cart[medicine.id] ?? 0)
        );
      },
      0
    );

  const totalAmount =
    selectedMedicines.reduce(
      (total, medicine) => {
        const quantity =
          cart[medicine.id] ?? 0;

        return (
          total +
          quantity * medicine.price
        );
      },
      0
    );

  // =========================================================
  // QUANTITY MODAL
  // =========================================================

  const [
    selectedMedicine,
    setSelectedMedicine,
  ] = useState<Medicine | null>(
    null
  );

  const [
    quantity,
    setQuantity,
  ] = useState(1);

  const [
    quantityModal,
    setQuantityModal,
  ] = useState(false);

  function openMedicine(
    medicine: Medicine
  ) {
    if (medicine.stock <= 0) {
      Alert.alert(
        "Out of Stock",
        "This medicine is currently unavailable."
      );

      return;
    }

    setSelectedMedicine(
      medicine
    );

    const existingQuantity =
      cart[medicine.id] ?? 1;

    setQuantity(
      existingQuantity
    );

    setQuantityModal(true);
  }

  function addMedicineToCart() {
    if (!selectedMedicine) {
      return;
    }

    if (quantity < 1) {
      Alert.alert(
        "Invalid Quantity",
        "Quantity must be at least 1."
      );

      return;
    }

    if (
      quantity >
      selectedMedicine.stock
    ) {
      Alert.alert(
        "Stock unavailable",
        `Only ${selectedMedicine.stock} units are currently available.`
      );

      return;
    }

    setCart((current) => ({
      ...current,

      [selectedMedicine.id]:
        quantity,
    }));

    setQuantityModal(false);

    setSelectedMedicine(
      null
    );

    setQuantity(1);

    setMedicineSearch("");
  }

  function changeCartQuantity(
    medicine: Medicine,
    amount: number
  ) {
    const currentQuantity =
      cart[medicine.id] ?? 0;

    const newQuantity =
      currentQuantity + amount;

    if (newQuantity <= 0) {
      removeFromCart(
        medicine.id
      );

      return;
    }

    if (
      newQuantity >
      medicine.stock
    ) {
      Alert.alert(
        "Stock unavailable",
        `Only ${medicine.stock} units are currently available.`
      );

      return;
    }

    setCart((current) => ({
      ...current,

      [medicine.id]:
        newQuantity,
    }));
  }

  function removeFromCart(
    medicineId: string
  ) {
    setCart((current) => {
      const updated = {
        ...current,
      };

      delete updated[
        medicineId
      ];

      return updated;
    });
  }

  // =========================================================
  // CART MODAL
  // =========================================================

  const [
    cartModal,
    setCartModal,
  ] = useState(false);

  const [
    note,
    setNote,
  ] = useState("");

  // =========================================================
  // RESET FORM
  // =========================================================

  function resetRequestForm() {
    setSelectedStockistId(
      undefined
    );

    setStockistSearch("");

    setMedicineSearch("");

    setCart({});

    setNote("");

    setSelectedMedicine(
      null
    );

    setQuantity(1);

    setQuantityModal(false);

    setCartModal(false);
  }

  // =========================================================
  // SUBMIT REQUEST
  // =========================================================

  function handleSubmit() {
    if (!selectedStockist) {
      Alert.alert(
        "Select Stockist",
        "Please select a stockist."
      );

      return;
    }

    if (
      selectedMedicines.length ===
      0
    ) {
      Alert.alert(
        "Empty Request",
        "Please add at least one medicine."
      );

      return;
    }

    const items =
      selectedMedicines.map(
        (medicine) => {
          const itemQuantity =
            cart[medicine.id] ?? 0;

          return {
            medicineId:
              medicine.id,

            medicineName:
              medicine.name,

            quantity:
              itemQuantity,

            unitPrice:
              medicine.price,

            subtotal:
              itemQuantity *
              medicine.price,
          };
        }
      );

    const request =
      createRequest({
        stockistId:
          selectedStockist.id,

        stockistName:
          selectedStockist.name,

        items,

        // Existing RequestContext
        // currently uses totalItems.
        // For now we store total quantity here.
        totalItems:
          totalQuantity,

        totalAmount,

        note:
          note.trim() ||
          undefined,
      });

    /**
     * Clear the form before
     * opening Request Details.
     */
    resetRequestForm();

    /**
     * Push instead of replace so
     * navigation history remains valid.
     */
    router.push({
      pathname:
        "/request/[id]",

      params: {
        id: request.id,
      },
    });
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={[
          styles.scrollContent,

          {
            paddingHorizontal:
              gutter,
          },
        ]}
      >
        <View
          style={[
            styles.container,

            contentMaxWidth
              ? {
                  width: "100%",

                  maxWidth: 850,

                  alignSelf:
                    "center",
                }
              : undefined,
          ]}
        >
          {/* =================================================
              HEADER
          ================================================== */}

          <View
            style={styles.header}
          >
            <Text
              style={styles.title}
            >
              New Medicine Request
            </Text>

            <Text
              style={styles.subtitle}
            >
              Choose a stockist
              and add the medicines
              they require.
            </Text>
          </View>

          {/* =================================================
              STEP 1 - STOCKIST
          ================================================== */}

          <View
            style={
              styles.stepHeader
            }
          >
            <View
              style={
                styles.stepNumber
              }
            >
              <Text
                style={
                  styles.stepNumberText
                }
              >
                1
              </Text>
            </View>

            <Text
              style={
                styles.stepTitle
              }
            >
              Select Stockist
            </Text>
          </View>

          {!selectedStockist ? (
            <>
              {/* STOCKIST SEARCH */}

              <View
                style={
                  styles.searchContainer
                }
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={21}
                  color={
                    colors.textMuted
                  }
                />

                <TextInput
                  value={
                    stockistSearch
                  }
                  onChangeText={
                    setStockistSearch
                  }
                  placeholder="Search stockist name, area or contact..."
                  placeholderTextColor={
                    colors.textMuted
                  }
                  style={
                    styles.searchInput
                  }
                  autoCorrect={false}
                />

                {stockistSearch.length >
                  0 && (
                  <Pressable
                    onPress={() =>
                      setStockistSearch(
                        ""
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={19}
                      color={
                        colors.textMuted
                      }
                    />
                  </Pressable>
                )}
              </View>

              {/* STOCKIST RESULTS */}

              {filteredStockists.map(
                (stockist) => (
                  <Pressable
                    key={
                      stockist.id
                    }
                    style={({ pressed }) => [
                      styles.resultCard,

                      pressed &&
                        styles.cardPressed,
                    ]}
                    onPress={() => {
                      setSelectedStockistId(
                        stockist.id
                      );

                      setStockistSearch(
                        ""
                      );
                    }}
                  >
                    <View
                      style={
                        styles.resultIcon
                      }
                    >
                      <MaterialCommunityIcons
                        name="storefront-outline"
                        size={21}
                        color={
                          colors.primary
                        }
                      />
                    </View>

                    <View
                      style={
                        styles.resultInfo
                      }
                    >
                      <Text
                        style={
                          styles.resultName
                        }
                      >
                        {
                          stockist.name
                        }
                      </Text>

                      <Text
                        style={
                          styles.resultMeta
                        }
                      >
                        {
                          stockist.location
                        }
                      </Text>

                      <Text
                        style={
                          styles.contactText
                        }
                      >
                        {
                          stockist.contactPerson
                        }
                      </Text>
                    </View>

                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={22}
                      color={
                        colors.textMuted
                      }
                    />
                  </Pressable>
                )
              )}

              {/* NO RESULTS */}

              {stockistSearch.trim()
                .length > 0 &&
                filteredStockists.length ===
                  0 && (
                  <View
                    style={
                      styles.noResult
                    }
                  >
                    <MaterialCommunityIcons
                      name="store-search-outline"
                      size={36}
                      color={
                        colors.textMuted
                      }
                    />

                    <Text
                      style={
                        styles.noResultTitle
                      }
                    >
                      No stockist found
                    </Text>

                    <Text
                      style={
                        styles.noResultText
                      }
                    >
                      Try another
                      stockist name or
                      location.
                    </Text>

                    <Pressable
                      style={
                        styles.addStockistButton
                      }
                      onPress={() =>
                        router.push(
                          "/stockist/add"
                        )
                      }
                    >
                      <MaterialCommunityIcons
                        name="store-plus-outline"
                        size={18}
                        color={
                          colors.primary
                        }
                      />

                      <Text
                        style={
                          styles.addStockistText
                        }
                      >
                        Request New
                        Stockist
                      </Text>
                    </Pressable>
                  </View>
                )}
            </>
          ) : (
            /* SELECTED STOCKIST */

            <View
              style={
                styles.selectedStockistCard
              }
            >
              <View
                style={
                  styles.resultIcon
                }
              >
                <MaterialCommunityIcons
                  name="storefront-outline"
                  size={21}
                  color={
                    colors.primary
                  }
                />
              </View>

              <View
                style={
                  styles.resultInfo
                }
              >
                <Text
                  style={
                    styles.selectedLabel
                  }
                >
                  SELECTED STOCKIST
                </Text>

                <Text
                  style={
                    styles.resultName
                  }
                >
                  {
                    selectedStockist.name
                  }
                </Text>

                <Text
                  style={
                    styles.resultMeta
                  }
                >
                  {
                    selectedStockist.location
                  }
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  if (
                    selectedMedicines.length >
                    0
                  ) {
                    Alert.alert(
                      "Change Stockist?",
                      "Changing the stockist will clear the medicines currently in your cart.",
                      [
                        {
                          text: "Cancel",

                          style:
                            "cancel",
                        },

                        {
                          text: "Change",

                          style:
                            "destructive",

                          onPress: () => {
                            setSelectedStockistId(
                              undefined
                            );

                            setCart({});

                            setMedicineSearch(
                              ""
                            );
                          },
                        },
                      ]
                    );
                  } else {
                    setSelectedStockistId(
                      undefined
                    );
                  }
                }}
              >
                <Text
                  style={
                    styles.changeText
                  }
                >
                  Change
                </Text>
              </Pressable>
            </View>
          )}

          {/* =================================================
              STEP 2 - MEDICINES
          ================================================== */}

          {selectedStockist && (
            <>
              <View
                style={[
                  styles.stepHeader,

                  styles.medicineStep,
                ]}
              >
                <View
                  style={
                    styles.stepNumber
                  }
                >
                  <Text
                    style={
                      styles.stepNumberText
                    }
                  >
                    2
                  </Text>
                </View>

                <Text
                  style={
                    styles.stepTitle
                  }
                >
                  Add Medicines
                </Text>
              </View>

              {/* MEDICINE SEARCH */}

              <View
                style={
                  styles.searchContainer
                }
              >
                <MaterialCommunityIcons
                  name="magnify"
                  size={20}
                  color={
                    colors.textMuted
                  }
                />

                <TextInput
                  value={
                    medicineSearch
                  }
                  onChangeText={
                    setMedicineSearch
                  }
                  placeholder="Search medicine or company..."
                  placeholderTextColor={
                    colors.textMuted
                  }
                  style={
                    styles.searchInput
                  }
                  autoCorrect={false}
                />

                {medicineSearch.length >
                  0 && (
                  <Pressable
                    onPress={() =>
                      setMedicineSearch(
                        ""
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      size={19}
                      color={
                        colors.textMuted
                      }
                    />
                  </Pressable>
                )}
              </View>

              {/* MEDICINE LIST HEADER */}

              <View
                style={
                  styles.medicineListHeader
                }
              >
                <Text
                  style={
                    styles.medicineListTitle
                  }
                >
                  {medicineSearch.trim()
                    ? "Search Results"
                    : "All Medicines"}
                </Text>

                <Text
                  style={
                    styles.medicineCount
                  }
                >
                  {
                    filteredMedicines.length
                  }
                </Text>
              </View>

              {/* MEDICINES */}

              {filteredMedicines.map(
                (medicine) => {
                  const added =
                    cart[
                      medicine.id
                    ] ?? 0;

                  const outOfStock =
                    medicine.stock ===
                    0;

                  const lowStock =
                    medicine.stock >
                      0 &&
                    medicine.stock <=
                      10;

                  return (
                    <Pressable
                      key={
                        medicine.id
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.medicineResult,

                        outOfStock &&
                          styles.medicineDisabled,

                        pressed &&
                          !outOfStock &&
                          styles.cardPressed,
                      ]}
                      onPress={() =>
                        openMedicine(
                          medicine
                        )
                      }
                    >
                      <View
                        style={
                          styles.medicineIcon
                        }
                      >
                        <MaterialCommunityIcons
                          name="pill"
                          size={21}
                          color={
                            outOfStock
                              ? colors.textMuted
                              : colors.primary
                          }
                        />
                      </View>

                      <View
                        style={
                          styles.resultInfo
                        }
                      >
                        <Text
                          style={[
                            styles.resultName,

                            outOfStock &&
                              styles.disabledText,
                          ]}
                        >
                          {
                            medicine.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.resultMeta
                          }
                        >
                          {
                            medicine.company
                          }{" "}
                          •{" "}
                          {
                            medicine.packSize
                          }
                        </Text>

                        <View
                          style={
                            styles.medicineMetaRow
                          }
                        >
                          <Text
                            style={
                              styles.price
                            }
                          >
                            Rs.{" "}
                            {
                              medicine.price
                            }
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
                              ? `Low Stock (${medicine.stock})`
                              : `In Stock (${medicine.stock})`}
                          </Text>
                        </View>
                      </View>

                      {added > 0 ? (
                        <View
                          style={
                            styles.addedBadge
                          }
                        >
                          <Text
                            style={
                              styles.addedText
                            }
                          >
                            ✓ {added} added
                          </Text>
                        </View>
                      ) : (
                        <MaterialCommunityIcons
                          name="plus-circle-outline"
                          size={26}
                          color={
                            outOfStock
                              ? colors.textMuted
                              : colors.primary
                          }
                        />
                      )}
                    </Pressable>
                  );
                }
              )}

              {/* NO MEDICINE RESULTS */}

              {filteredMedicines.length ===
                0 && (
                <View
                  style={
                    styles.noResult
                  }
                >
                  <MaterialCommunityIcons
                    name="pill-off"
                    size={36}
                    color={
                      colors.textMuted
                    }
                  />

                  <Text
                    style={
                      styles.noResultTitle
                    }
                  >
                    No medicines found
                  </Text>

                  <Text
                    style={
                      styles.noResultText
                    }
                  >
                    Try another
                    medicine or company
                    name.
                  </Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* =====================================================
          FLOATING CART
      ====================================================== */}

      {medicineCount > 0 && (
        <Pressable
          style={[
            styles.cartBar,

            {
              marginHorizontal:
                gutter,
            },
          ]}
          onPress={() =>
            setCartModal(true)
          }
        >
          <View
            style={styles.cartIcon}
          >
            <MaterialCommunityIcons
              name="cart-outline"
              size={23}
              color="#FFFFFF"
            />

            <View
              style={
                styles.cartCountBadge
              }
            >
              <Text
                style={
                  styles.cartCountText
                }
              >
                {medicineCount}
              </Text>
            </View>
          </View>

          <View
            style={styles.cartInfo}
          >
            <Text
              style={styles.cartTitle}
            >
              {medicineCount}{" "}
              {medicineCount === 1
                ? "medicine"
                : "medicines"}
            </Text>

            <Text
              style={styles.cartUnits}
            >
              {totalQuantity} total
              units
            </Text>
          </View>

          <View
            style={
              styles.cartAmountArea
            }
          >
            <Text
              style={
                styles.cartAmount
              }
            >
              Rs.{" "}
              {totalAmount.toFixed(
                2
              )}
            </Text>

            <Text
              style={
                styles.viewCartText
              }
            >
              View Cart →
            </Text>
          </View>
        </Pressable>
      )}

      {/* =====================================================
          QUANTITY MODAL
      ====================================================== */}

      <Modal
        visible={quantityModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setQuantityModal(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={
              styles.bottomSheet
            }
          >
            {selectedMedicine && (
              <>
                <View
                  style={
                    styles.modalHandle
                  }
                />

                <View
                  style={
                    styles.modalMedicineHeader
                  }
                >
                  <View
                    style={
                      styles.largeMedicineIcon
                    }
                  >
                    <MaterialCommunityIcons
                      name="pill"
                      size={26}
                      color={
                        colors.primary
                      }
                    />
                  </View>

                  <View
                    style={
                      styles.modalMedicineInfo
                    }
                  >
                    <Text
                      style={
                        styles.modalTitle
                      }
                    >
                      {
                        selectedMedicine.name
                      }
                    </Text>

                    <Text
                      style={
                        styles.modalSubtitle
                      }
                    >
                      {
                        selectedMedicine.company
                      }{" "}
                      •{" "}
                      {
                        selectedMedicine.packSize
                      }
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setQuantityModal(
                        false
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="close"
                      size={24}
                      color={
                        colors.textMuted
                      }
                    />
                  </Pressable>
                </View>

                {/* PRODUCT INFO */}

                <View
                  style={
                    styles.productInfoRow
                  }
                >
                  <View
                    style={
                      styles.productInfoBox
                    }
                  >
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      PRICE
                    </Text>

                    <Text
                      style={
                        styles.productInfoValue
                      }
                    >
                      Rs.{" "}
                      {
                        selectedMedicine.price
                      }
                    </Text>
                  </View>

                  <View
                    style={
                      styles.productInfoBox
                    }
                  >
                    <Text
                      style={
                        styles.smallLabel
                      }
                    >
                      AVAILABLE
                    </Text>

                    <Text
                      style={
                        styles.productInfoValue
                      }
                    >
                      {
                        selectedMedicine.stock
                      }
                    </Text>
                  </View>
                </View>

                {/* QUANTITY */}

                <Text
                  style={
                    styles.quantityLabel
                  }
                >
                  Enter Quantity
                </Text>

                <View
                  style={
                    styles.quantityPicker
                  }
                >
                  <Pressable
                    style={
                      styles.quantityButton
                    }
                    onPress={() =>
                      setQuantity(
                        Math.max(
                          1,

                          quantity - 1
                        )
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="minus"
                      size={22}
                      color={
                        colors.primary
                      }
                    />
                  </Pressable>

                  <TextInput
                    value={String(
                      quantity
                    )}
                    onChangeText={(
                      value
                    ) => {
                      const clean =
                        value.replace(
                          /\D/g,

                          ""
                        );

                      if (!clean) {
                        setQuantity(
                          1
                        );

                        return;
                      }

                      setQuantity(
                        Number(clean)
                      );
                    }}
                    keyboardType="number-pad"
                    selectTextOnFocus
                    style={
                      styles.quantityInput
                    }
                  />

                  <Pressable
                    style={
                      styles.quantityButton
                    }
                    onPress={() =>
                      setQuantity(
                        Math.min(
                          selectedMedicine.stock,

                          quantity + 1
                        )
                      )
                    }
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      size={22}
                      color={
                        colors.primary
                      }
                    />
                  </Pressable>
                </View>

                {/* TOTAL */}

                <View
                  style={
                    styles.modalTotal
                  }
                >
                  <Text
                    style={
                      styles.totalLabel
                    }
                  >
                    Total
                  </Text>

                  <Text
                    style={
                      styles.totalValue
                    }
                  >
                    Rs.{" "}
                    {(
                      quantity *
                      selectedMedicine.price
                    ).toFixed(2)}
                  </Text>
                </View>

                {/* ADD CART */}

                <Pressable
                  style={
                    styles.primaryButton
                  }
                  onPress={
                    addMedicineToCart
                  }
                >
                  <MaterialCommunityIcons
                    name="cart-plus"
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text
                    style={
                      styles.primaryButtonText
                    }
                  >
                    {cart[
                      selectedMedicine.id
                    ]
                      ? "Update Cart"
                      : "Add to Cart"}
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* =====================================================
          CART MODAL
      ====================================================== */}

      <Modal
        visible={cartModal}
        transparent
        animationType="slide"
        onRequestClose={() =>
          setCartModal(false)
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <View
            style={[
              styles.bottomSheet,

              styles.cartSheet,
            ]}
          >
            <View
              style={
                styles.modalHandle
              }
            />

            {/* CART HEADER */}

            <View
              style={
                styles.cartHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.modalTitle
                  }
                >
                  Your Request
                </Text>

                <Text
                  style={
                    styles.modalSubtitle
                  }
                >
                  {
                    selectedStockist?.name
                  }
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setCartModal(false)
                }
              >
                <MaterialCommunityIcons
                  name="close"
                  size={25}
                  color={colors.text}
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
            >
              {/* CART ITEMS */}

              {selectedMedicines.map(
                (medicine) => {
                  const itemQuantity =
                    cart[
                      medicine.id
                    ] ?? 0;

                  return (
                    <View
                      key={
                        medicine.id
                      }
                      style={
                        styles.cartItem
                      }
                    >
                      <View
                        style={
                          styles.cartItemInfo
                        }
                      >
                        <Text
                          style={
                            styles.cartMedicineName
                          }
                        >
                          {
                            medicine.name
                          }
                        </Text>

                        <Text
                          style={
                            styles.resultMeta
                          }
                        >
                          {
                            medicine.company
                          }
                        </Text>

                        <Text
                          style={
                            styles.cartPriceText
                          }
                        >
                          Rs.{" "}
                          {
                            medicine.price
                          }{" "}
                          each
                        </Text>
                      </View>

                      {/* CART QUANTITY */}

                      <View
                        style={
                          styles.cartQuantity
                        }
                      >
                        <Pressable
                          onPress={() =>
                            changeCartQuantity(
                              medicine,

                              -1
                            )
                          }
                        >
                          <MaterialCommunityIcons
                            name="minus-circle-outline"
                            size={24}
                            color={
                              colors.primary
                            }
                          />
                        </Pressable>

                        <Text
                          style={
                            styles.cartQuantityText
                          }
                        >
                          {
                            itemQuantity
                          }
                        </Text>

                        <Pressable
                          onPress={() =>
                            changeCartQuantity(
                              medicine,

                              1
                            )
                          }
                        >
                          <MaterialCommunityIcons
                            name="plus-circle-outline"
                            size={24}
                            color={
                              colors.primary
                            }
                          />
                        </Pressable>
                      </View>

                      {/* AMOUNT */}

                      <Text
                        style={
                          styles.cartItemAmount
                        }
                      >
                        Rs.{" "}
                        {(
                          itemQuantity *
                          medicine.price
                        ).toFixed(2)}
                      </Text>

                      {/* DELETE */}

                      <Pressable
                        onPress={() =>
                          removeFromCart(
                            medicine.id
                          )
                        }
                      >
                        <MaterialCommunityIcons
                          name="delete-outline"
                          size={22}
                          color={
                            colors.danger
                          }
                        />
                      </Pressable>
                    </View>
                  );
                }
              )}

              {/* CART TOTALS */}

              <View
                style={
                  styles.cartTotals
                }
              >
                <View
                  style={
                    styles.totalLine
                  }
                >
                  <Text
                    style={
                      styles.totalLabel
                    }
                  >
                    Medicines
                  </Text>

                  <Text
                    style={
                      styles.totalText
                    }
                  >
                    {medicineCount}
                  </Text>
                </View>

                <View
                  style={
                    styles.totalLine
                  }
                >
                  <Text
                    style={
                      styles.totalLabel
                    }
                  >
                    Total Units
                  </Text>

                  <Text
                    style={
                      styles.totalText
                    }
                  >
                    {totalQuantity}
                  </Text>
                </View>

                <View
                  style={[
                    styles.totalLine,

                    styles.finalTotal,
                  ]}
                >
                  <Text
                    style={
                      styles.finalTotalLabel
                    }
                  >
                    Total Amount
                  </Text>

                  <Text
                    style={
                      styles.finalTotalValue
                    }
                  >
                    Rs.{" "}
                    {totalAmount.toFixed(
                      2
                    )}
                  </Text>
                </View>
              </View>

              {/* NOTE */}

              <Text
                style={
                  styles.noteLabel
                }
              >
                Additional Note
              </Text>

              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="Optional instructions..."
                placeholderTextColor={
                  colors.textMuted
                }
                multiline
                textAlignVertical="top"
                style={
                  styles.noteInput
                }
              />

              {/* SUBMIT */}

              <Pressable
                style={[
                  styles.primaryButton,

                  styles.submitButton,
                ]}
                onPress={
                  handleSubmit
                }
              >
                <MaterialCommunityIcons
                  name="send-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Submit Request
                </Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor:
      colors.background,
  },

  scrollContent: {
    paddingTop: 12,

    // Space for floating cart
    paddingBottom: 150,
  },

  container: {
    flex: 1,
  },

  // =========================================================
  // HEADER
  // =========================================================

  header: {
    marginBottom: 26,
  },

  title: {
    fontSize: 28,

    fontWeight: "700",

    color: colors.text,
  },

  subtitle: {
    marginTop: 6,

    fontSize: 13,

    lineHeight: 19,

    color:
      colors.textSecondary,
  },

  // =========================================================
  // STEPS
  // =========================================================

  stepHeader: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: 12,
  },

  medicineStep: {
    marginTop: 30,
  },

  stepNumber: {
    width: 29,

    height: 29,

    borderRadius: 15,

    backgroundColor:
      colors.primary,

    justifyContent: "center",

    alignItems: "center",

    marginRight: 9,
  },

  stepNumberText: {
    fontSize: 12,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  stepTitle: {
    fontSize: 17,

    fontWeight: "700",

    color: colors.text,
  },

  // =========================================================
  // SEARCH
  // =========================================================

  searchContainer: {
    minHeight: 52,

    paddingHorizontal: 14,

    borderRadius: 14,

    borderWidth: 1,

    borderColor:
      colors.border,

    backgroundColor:
      colors.card,

    flexDirection: "row",

    alignItems: "center",
  },

  searchInput: {
    flex: 1,

    marginLeft: 8,

    marginRight: 8,

    fontSize: 14,

    color: colors.text,
  },

  // =========================================================
  // STOCKIST
  // =========================================================

  resultCard: {
    marginTop: 8,

    padding: 13,

    backgroundColor:
      colors.card,

    borderWidth: 1,

    borderColor:
      colors.border,

    borderRadius: 14,

    flexDirection: "row",

    alignItems: "center",
  },

  selectedStockistCard: {
    padding: 15,

    backgroundColor:
      colors.primarySoft,

    borderWidth: 1,

    borderColor:
      colors.primary,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",
  },

  resultIcon: {
    width: 43,

    height: 43,

    borderRadius: 13,

    backgroundColor:
      colors.primarySoft,

    alignItems: "center",

    justifyContent: "center",
  },

  resultInfo: {
    flex: 1,

    marginLeft: 11,
  },

  resultName: {
    fontSize: 14,

    fontWeight: "700",

    color: colors.text,
  },

  resultMeta: {
    marginTop: 3,

    fontSize: 11,

    color:
      colors.textSecondary,
  },

  contactText: {
    marginTop: 3,

    fontSize: 10,

    color:
      colors.textMuted,
  },

  selectedLabel: {
    marginBottom: 3,

    fontSize: 8,

    fontWeight: "700",

    letterSpacing: 0.7,

    color:
      colors.textSecondary,
  },

  changeText: {
    fontSize: 12,

    fontWeight: "700",

    color:
      colors.primary,
  },

  // =========================================================
  // MEDICINE
  // =========================================================

  medicineListHeader: {
    marginTop: 19,

    marginBottom: 3,

    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",
  },

  medicineListTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: colors.text,
  },

  medicineCount: {
    fontSize: 11,

    fontWeight: "600",

    color:
      colors.textSecondary,
  },

  medicineResult: {
    marginTop: 9,

    padding: 13,

    borderRadius: 15,

    borderWidth: 1,

    borderColor:
      colors.border,

    backgroundColor:
      colors.card,

    flexDirection: "row",

    alignItems: "center",
  },

  medicineDisabled: {
    opacity: 0.55,
  },

  medicineIcon: {
    width: 44,

    height: 44,

    borderRadius: 13,

    backgroundColor:
      colors.primarySoft,

    alignItems: "center",

    justifyContent: "center",
  },

  medicineMetaRow: {
    marginTop: 7,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  price: {
    fontSize: 11,

    fontWeight: "700",

    color: colors.text,
  },

  stock: {
    fontSize: 10,

    fontWeight: "600",
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

  disabledText: {
    color:
      colors.textSecondary,
  },

  addedBadge: {
    paddingHorizontal: 9,

    paddingVertical: 6,

    borderRadius: 13,

    backgroundColor:
      colors.successSoft,
  },

  addedText: {
    fontSize: 10,

    fontWeight: "700",

    color: colors.success,
  },

  // =========================================================
  // EMPTY STATES
  // =========================================================

  noResult: {
    paddingVertical: 45,

    alignItems: "center",
  },

  noResultTitle: {
    marginTop: 10,

    fontSize: 15,

    fontWeight: "700",

    color: colors.text,
  },

  noResultText: {
    marginTop: 4,

    maxWidth: 260,

    textAlign: "center",

    fontSize: 11,

    lineHeight: 17,

    color:
      colors.textSecondary,
  },

  addStockistButton: {
    marginTop: 16,

    paddingHorizontal: 15,

    paddingVertical: 10,

    borderRadius: 12,

    backgroundColor:
      colors.primarySoft,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  addStockistText: {
    fontSize: 12,

    fontWeight: "700",

    color:
      colors.primary,
  },

  // =========================================================
  // CART BAR
  // =========================================================

  cartBar: {
    position: "absolute",

    left: 0,

    right: 0,

    bottom: 88,

    minHeight: 68,

    paddingHorizontal: 15,

    borderRadius: 18,

    backgroundColor:
      colors.primary,

    flexDirection: "row",

    alignItems: "center",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,

      height: 5,
    },

    shadowOpacity: 0.18,

    shadowRadius: 10,

    elevation: 10,
  },

  cartIcon: {
    position: "relative",
  },

  cartCountBadge: {
    position: "absolute",

    top: -9,

    right: -10,

    minWidth: 18,

    height: 18,

    paddingHorizontal: 4,

    borderRadius: 9,

    backgroundColor:
      "#FFFFFF",

    alignItems: "center",

    justifyContent: "center",
  },

  cartCountText: {
    fontSize: 9,

    fontWeight: "800",

    color:
      colors.primary,
  },

  cartInfo: {
    flex: 1,

    marginLeft: 15,
  },

  cartTitle: {
    fontSize: 13,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  cartUnits: {
    marginTop: 2,

    fontSize: 10,

    color: "#DCE8FF",
  },

  cartAmountArea: {
    alignItems: "flex-end",
  },

  cartAmount: {
    fontSize: 14,

    fontWeight: "800",

    color: "#FFFFFF",
  },

  viewCartText: {
    marginTop: 2,

    fontSize: 10,

    color: "#DCE8FF",
  },

  // =========================================================
  // MODAL
  // =========================================================

  modalOverlay: {
    flex: 1,

    backgroundColor:
      "rgba(15,23,42,0.45)",

    justifyContent:
      "flex-end",
  },

  bottomSheet: {
    backgroundColor:
      colors.card,

    borderTopLeftRadius: 26,

    borderTopRightRadius: 26,

    padding: 22,

    paddingBottom: 32,
  },

  cartSheet: {
    maxHeight: "88%",
  },

  modalHandle: {
    width: 45,

    height: 5,

    alignSelf: "center",

    marginBottom: 20,

    borderRadius: 4,

    backgroundColor:
      colors.border,
  },

  modalMedicineHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  largeMedicineIcon: {
    width: 50,

    height: 50,

    borderRadius: 15,

    backgroundColor:
      colors.primarySoft,

    alignItems: "center",

    justifyContent: "center",
  },

  modalMedicineInfo: {
    flex: 1,

    marginLeft: 12,

    marginRight: 10,
  },

  modalTitle: {
    fontSize: 20,

    fontWeight: "700",

    color: colors.text,
  },

  modalSubtitle: {
    marginTop: 4,

    fontSize: 11,

    color:
      colors.textSecondary,
  },

  productInfoRow: {
    marginTop: 22,

    flexDirection: "row",

    gap: 10,
  },

  productInfoBox: {
    flex: 1,

    padding: 15,

    borderRadius: 14,

    backgroundColor:
      colors.background,
  },

  smallLabel: {
    fontSize: 9,

    fontWeight: "700",

    color:
      colors.textSecondary,
  },

  productInfoValue: {
    marginTop: 4,

    fontSize: 15,

    fontWeight: "700",

    color: colors.text,
  },

  // =========================================================
  // QUANTITY
  // =========================================================

  quantityLabel: {
    marginTop: 22,

    marginBottom: 10,

    fontSize: 13,

    fontWeight: "700",

    color: colors.text,
  },

  quantityPicker: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 22,
  },

  quantityButton: {
    width: 46,

    height: 46,

    borderRadius: 14,

    borderWidth: 1,

    borderColor:
      colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  quantityInput: {
    minWidth: 80,

    height: 52,

    textAlign: "center",

    borderWidth: 1,

    borderColor:
      colors.border,

    borderRadius: 14,

    fontSize: 18,

    fontWeight: "700",

    color: colors.text,
  },

  // =========================================================
  // TOTAL
  // =========================================================

  modalTotal: {
    marginTop: 24,

    paddingTop: 16,

    borderTopWidth: 1,

    borderTopColor:
      colors.border,

    flexDirection: "row",

    justifyContent:
      "space-between",
  },

  totalLabel: {
    fontSize: 12,

    color:
      colors.textSecondary,
  },

  totalValue: {
    fontSize: 18,

    fontWeight: "800",

    color:
      colors.primary,
  },

  // =========================================================
  // BUTTON
  // =========================================================

  primaryButton: {
    minHeight: 54,

    marginTop: 22,

    borderRadius: 14,

    backgroundColor:
      colors.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,
  },

  primaryButtonText: {
    fontSize: 14,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  // =========================================================
  // CART MODAL
  // =========================================================

  cartHeader: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "flex-start",

    marginBottom: 18,
  },

  cartItem: {
    paddingVertical: 14,

    borderBottomWidth: 1,

    borderBottomColor:
      colors.border,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  cartItemInfo: {
    flex: 1,
  },

  cartMedicineName: {
    fontSize: 13,

    fontWeight: "700",

    color: colors.text,
  },

  cartPriceText: {
    marginTop: 3,

    fontSize: 10,

    color:
      colors.textMuted,
  },

  cartQuantity: {
    flexDirection: "row",

    alignItems: "center",

    gap: 7,
  },

  cartQuantityText: {
    minWidth: 20,

    textAlign: "center",

    fontWeight: "700",

    color: colors.text,
  },

  cartItemAmount: {
    minWidth: 75,

    textAlign: "right",

    fontSize: 11,

    fontWeight: "700",

    color: colors.text,
  },

  cartTotals: {
    marginTop: 18,

    padding: 15,

    borderRadius: 14,

    backgroundColor:
      colors.background,
  },

  totalLine: {
    flexDirection: "row",

    justifyContent:
      "space-between",

    marginBottom: 9,
  },

  totalText: {
    fontSize: 12,

    fontWeight: "700",

    color: colors.text,
  },

  finalTotal: {
    marginTop: 7,

    paddingTop: 13,

    borderTopWidth: 1,

    borderTopColor:
      colors.border,
  },

  finalTotalLabel: {
    fontSize: 14,

    fontWeight: "700",

    color: colors.text,
  },

  finalTotalValue: {
    fontSize: 18,

    fontWeight: "800",

    color:
      colors.primary,
  },

  // =========================================================
  // NOTE
  // =========================================================

  noteLabel: {
    marginTop: 20,

    marginBottom: 8,

    fontSize: 12,

    fontWeight: "700",

    color: colors.text,
  },

  noteInput: {
    minHeight: 90,

    padding: 12,

    borderRadius: 13,

    borderWidth: 1,

    borderColor:
      colors.border,

    backgroundColor:
      colors.background,

    fontSize: 13,

    color: colors.text,
  },

  submitButton: {
    marginBottom: 20,
  },

  // =========================================================
  // PRESS
  // =========================================================

  cardPressed: {
    opacity: 0.75,
  },
});