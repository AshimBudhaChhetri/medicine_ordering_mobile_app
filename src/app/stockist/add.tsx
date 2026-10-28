import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useState } from "react";
import { useStockists } from "../../context/StockistContext";

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

import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function AddStockistScreen() {
  const { addStockist } = useStockists();
  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  const [stockistName, setStockistName] = useState("");
  const [area, setArea] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const cleanName = stockistName.trim();
    const cleanLocation = area.trim();

    if (!cleanName || !cleanLocation) {
      Alert.alert(
        "Missing information",
        "Please provide a stockist name and location / area."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await addStockist({
        name: cleanName,
        location: cleanLocation,
      });

      Alert.alert(
        "Stockist Created",
        `${cleanName} has been added to your territory.`,
        [
          {
            text: "View Stockists",
            onPress: () => router.replace("/(tabs)/stockists"),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Creation Failed", err?.message || "Failed to add stockist.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    width: "100%",
                    maxWidth: 900,
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

              <View style={styles.headerText}>
                <Text style={styles.title}>Add New Stockist</Text>
                <Text style={styles.subtitle}>
                  Register a pharmacy or stockist in your territory.
                </Text>
              </View>
            </View>

            {/* Information Banner */}
            <View style={styles.infoBanner}>
              <View style={styles.infoIcon}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.infoText}>
                Stockists added here become immediately active in your territory,
                allowing you to create medicine requests right away.
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>Stockist Information</Text>
              <Text style={styles.sectionDescription}>
                Enter the business and location details below.
              </Text>

              <View
                style={[
                  styles.formGrid,
                  isTablet && styles.formGridTablet,
                ]}
              >
                {/* Stockist name */}
                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>
                    Stockist / Pharmacy Name
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <TextInput
                    value={stockistName}
                    onChangeText={setStockistName}
                    placeholder="e.g. Sunrise Pharmacy"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Location / Area */}
                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>
                    Area / Location
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <TextInput
                    value={area}
                    onChangeText={setArea}
                    placeholder="e.g. Bagbazar, Kathmandu"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Contact person (Optional) */}
                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>Contact Person</Text>

                  <TextInput
                    value={contactPerson}
                    onChangeText={setContactPerson}
                    placeholder="e.g. Ram Sharma (optional)"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    editable={!isSubmitting}
                  />
                </View>

                {/* Phone (Optional) */}
                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>Phone Number</Text>

                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="98XXXXXXXX (optional)"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    keyboardType="phone-pad"
                    editable={!isSubmitting}
                  />
                </View>
              </View>
            </View>

            {/* Preview Card */}
            {stockistName.trim().length > 0 && (
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>STOCKIST PREVIEW</Text>

                <View style={styles.previewContent}>
                  <View style={styles.stockistIcon}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>{stockistName}</Text>
                    <Text style={styles.previewLocation}>
                      {area || "Location not provided"}
                    </Text>
                  </View>

                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>Active</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Actions */}
            <View
              style={[
                styles.actions,
                isTablet && styles.actionsTablet,
              ]}
            >
              <Pressable
                style={styles.cancelButton}
                onPress={() => router.back()}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.submitButton, isSubmitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="plus"
                      size={19}
                      color="#FFFFFF"
                    />
                    <Text style={styles.submitText}>Save Stockist</Text>
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
    paddingTop: 8,
    paddingBottom: 50,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  infoBanner: {
    backgroundColor: colors.primarySoft,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
  },
  formCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  sectionDescription: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 20,
    fontWeight: "400",
  },
  formGrid: {
    gap: 16,
  },
  formGridTablet: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
  },
  fieldGroup: {
    width: "100%",
  },
  halfField: {
    width: "48.8%",
  },
  label: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  required: {
    color: colors.danger,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FAFBFD",
    fontSize: 14,
    color: colors.text,
    fontWeight: "400",
  },
  previewCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewLabel: {
    marginBottom: 10,
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  stockistIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  previewName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
  },
  previewLocation: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    backgroundColor: colors.successSoft,
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  actions: {
    marginTop: 22,
    gap: 10,
  },
  actionsTablet: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  cancelButton: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  submitButton: {
    minHeight: 50,
    paddingHorizontal: 25,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  submitText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
