import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useProducts } from "../../context/ProductContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function AddProductScreen() {
  const { isSuperAdmin } = useAuth();
  const { addProduct, catalogOptions } = useProducts();
  const { gutter, contentMaxWidth } = useResponsive();

  const [name, setName] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [price, setPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [sales, setSales] = useState("");
  const [amount, setAmount] = useState("100");
  const [batch, setBatch] = useState("");
  const [expiry, setExpiry] = useState("");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const units = catalogOptions?.units || [];
  const types = catalogOptions?.types || [];

  const handleReset = () => {
    setName("");
    setSelectedTypeId("");
    setSelectedUnitId("");
    setPrice("");
    setMrp("");
    setSales("");
    setAmount("100");
    setBatch("");
    setExpiry("");
    setRemarks("");
  };

  const handleSubmit = async () => {
    const cleanName = name.trim();
    const numPrice = parseFloat(price);

    if (!cleanName) {
      Alert.alert("Missing Name", "Please provide a product or medicine name.");
      return;
    }

    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert(
        "Invalid Price",
        "Please provide a valid unit price/rate greater than zero."
      );
      return;
    }

    const numMrp = mrp.trim() ? parseFloat(mrp) : undefined;
    const numSales = sales.trim() ? parseFloat(sales) : undefined;
    const numAmount = amount.trim() ? parseInt(amount, 10) : 100;

    try {
      setIsSubmitting(true);
      const created = await addProduct({
        name: cleanName,
        typeId: selectedTypeId || undefined,
        unitId: selectedUnitId || undefined,
        price: numPrice,
        mrp: numMrp,
        sales: numSales,
        amount: isNaN(numAmount) ? 100 : numAmount,
        batch: batch.trim() || undefined,
        expiry: expiry.trim() || undefined,
        remarks: remarks.trim() || undefined,
      });

      Alert.alert(
        "Product Added",
        `"${created.name}" has been successfully added to the catalogue.`,
        [
          {
            text: "Add Another",
            style: "default",
            onPress: handleReset,
          },
          {
            text: "Done",
            style: "default",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert(
        "Failed to Add Product",
        err?.message || "Could not save the product. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.restrictedContainer}>
          <MaterialCommunityIcons name="lock-outline" size={48} color={colors.text} />
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedSub}>Only superadmins can add new products.</Text>
          <Pressable style={styles.restrictedBackButton} onPress={() => router.back()}>
            <Text style={styles.restrictedBackButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                    maxWidth: 680,
                    width: "100%",
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

              <View>
                <Text style={styles.title}>Add New Product</Text>
                <Text style={styles.subtitle}>
                  Register a new medicine into the company catalogue.
                </Text>
              </View>
            </View>

            {/* Form Card */}
            <View style={styles.formCard}>
              {/* Product Name */}
              <View style={styles.field}>
                <Text style={styles.label}>
                  Medicine / Product Name <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Amoxicillin 500mg Capsule"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  autoCapitalize="words"
                />
              </View>

              {/* Category / Type Selector */}
              {types.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.label}>Medicine Category</Text>
                  <View style={styles.chipsContainer}>
                    {types.map((type) => {
                      const isSelected = selectedTypeId === type.id;
                      return (
                        <Pressable
                          key={type.id}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() =>
                            setSelectedTypeId((curr) =>
                              curr === type.id ? "" : type.id
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {type.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Unit / Packaging Selector */}
              {units.length > 0 && (
                <View style={styles.field}>
                  <Text style={styles.label}>Packaging / Unit</Text>
                  <View style={styles.chipsContainer}>
                    {units.map((unit) => {
                      const isSelected = selectedUnitId === unit.id;
                      return (
                        <Pressable
                          key={unit.id}
                          style={[
                            styles.chip,
                            isSelected && styles.chipSelected,
                          ]}
                          onPress={() =>
                            setSelectedUnitId((curr) =>
                              curr === unit.id ? "" : unit.id
                            )
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextSelected,
                            ]}
                          >
                            {unit.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* Pricing Row */}
              <View style={styles.row}>
                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>
                    Price / Rate (Rs.) <Text style={styles.required}>*</Text>
                  </Text>
                  <TextInput
                    value={price}
                    onChangeText={setPrice}
                    placeholder="e.g. 95.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>

                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>MRP (Rs.)</Text>
                  <TextInput
                    value={mrp}
                    onChangeText={setMrp}
                    placeholder="e.g. 120.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Stock and Sales */}
              <View style={styles.row}>
                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>Stock Quantity</Text>
                  <TextInput
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="e.g. 100"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    style={styles.input}
                  />
                </View>

                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>Sales Rate (Rs.)</Text>
                  <TextInput
                    value={sales}
                    onChangeText={setSales}
                    placeholder="e.g. 105.00"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Batch & Expiry */}
              <View style={styles.row}>
                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>Batch Number</Text>
                  <TextInput
                    value={batch}
                    onChangeText={setBatch}
                    placeholder="e.g. AMX-2026-A"
                    placeholderTextColor={colors.textMuted}
                    autoCapitalize="characters"
                    style={styles.input}
                  />
                </View>

                <View style={[styles.field, styles.flex1]}>
                  <Text style={styles.label}>Expiry (YYYY-MM-DD)</Text>
                  <TextInput
                    value={expiry}
                    onChangeText={setExpiry}
                    placeholder="e.g. 2027-12-31"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Storage Remarks */}
              <View style={styles.field}>
                <Text style={styles.label}>Storage & Remarks</Text>
                <TextInput
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="e.g. Store below 25°C in a dry place"
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={2}
                  style={[styles.input, styles.multilineInput]}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="check"
                      size={20}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitButtonText}>Save Product</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 40,
  },
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    fontWeight: "400",
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
  },
  field: {
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flex1: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 6,
  },
  required: {
    color: colors.danger,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    color: colors.text,
    fontWeight: "400",
  },
  multilineInput: {
    minHeight: 64,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: "top",
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: "500",
  },
  submitButton: {
    marginTop: 10,
    minHeight: 50,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.65,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  restrictedTitle: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.text,
    marginTop: 16,
  },
  restrictedSub: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  restrictedBackButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
  },
  restrictedBackButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
});