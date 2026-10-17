import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useState } from "react";
import { useStockists } from "../../context/StockistContext";

import {
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
  const { addStockistRequest } = useStockists();
  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  const [stockistName, setStockistName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

const handleSubmit = () => {
  if (
    !stockistName.trim() ||
    !contactPerson.trim() ||
    !phone.trim() ||
    !address.trim()
  ) {
    Alert.alert(
      "Missing information",
      "Please complete all required fields."
    );

    return;
  }

  addStockistRequest({
    name: stockistName.trim(),

    contactPerson: contactPerson.trim(),

    phone: phone.trim(),

    email: email.trim() || undefined,

    location:
      area.trim() || "Location not provided",

    address: address.trim(),

    notes: notes.trim() || undefined,
  });

  Alert.alert(
    "Request Submitted",
    `${stockistName} has been sent to Admin for approval.`,
    [
      {
        text: "View Request",
        onPress: () =>
          router.replace("/(tabs)/stockists"),
      },
    ]
  );
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
            {
              paddingHorizontal: gutter,
            },
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
                <Text style={styles.title}>
                  Add New Stockist
                </Text>

                <Text style={styles.subtitle}>
                  Submit a new stockist for admin approval.
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
                The stockist will not become active immediately.
                After Admin approves the request, it will be
                registered and automatically assigned to you.
              </Text>
            </View>

            {/* Form */}

            <View style={styles.formCard}>
              <Text style={styles.sectionTitle}>
                Stockist Information
              </Text>

              <Text style={styles.sectionDescription}>
                Enter the business and contact information below.
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
                    Stockist Name
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <TextInput
                    value={stockistName}
                    onChangeText={setStockistName}
                    placeholder="e.g. Sunrise Pharmacy"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>

                {/* Contact person */}

                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>
                    Contact Person
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <TextInput
                    value={contactPerson}
                    onChangeText={setContactPerson}
                    placeholder="Enter contact person's name"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>

                {/* Phone */}

                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>
                    Phone Number
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="98XXXXXXXX"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    keyboardType="phone-pad"
                  />
                </View>

                {/* Email */}

                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>
                    Email
                  </Text>

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* Area */}

                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>
                    Area / Location
                  </Text>

                  <TextInput
                    value={area}
                    onChangeText={setArea}
                    placeholder="e.g. Kathmandu"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>

                {/* Address */}

                <View
                  style={[
                    styles.fieldGroup,
                    isTablet && styles.halfField,
                  ]}
                >
                  <Text style={styles.label}>
                    Address
                    <Text style={styles.required}> *</Text>
                  </Text>

                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Enter full address"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Notes */}

              <View style={styles.notesGroup}>
                <Text style={styles.label}>
                  Notes
                </Text>

                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Additional information about the stockist..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    styles.notesInput,
                  ]}
                  multiline
                  textAlignVertical="top"
                />

                <Text style={styles.optionalText}>
                  Optional
                </Text>
              </View>
            </View>

            {/* Preview */}

            {stockistName.trim().length > 0 && (
              <View style={styles.previewCard}>
                <Text style={styles.previewLabel}>
                  REQUEST PREVIEW
                </Text>

                <View style={styles.previewContent}>
                  <View style={styles.stockistIcon}>
                    <MaterialCommunityIcons
                      name="storefront-outline"
                      size={24}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>
                      {stockistName}
                    </Text>

                    <Text style={styles.previewLocation}>
                      {area || "Location not provided"}
                    </Text>
                  </View>

                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingText}>
                      Pending Approval
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Buttons */}

            <View
              style={[
                styles.actions,
                isTablet && styles.actionsTablet,
              ]}
            >
              <Pressable
                style={styles.cancelButton}
                onPress={() => router.back()}
              >
                <Text style={styles.cancelText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={styles.submitButton}
                onPress={handleSubmit}
              >
                <MaterialCommunityIcons
                  name="send-outline"
                  size={19}
                  color="#FFFFFF"
                />

                <Text style={styles.submitText}>
                  Submit for Approval
                </Text>
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
    fontSize: 25,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textSecondary,
  },

  infoBanner: {
    backgroundColor: colors.primarySoft,

    borderRadius: 16,

    padding: 14,

    flexDirection: "row",
    alignItems: "flex-start",

    marginBottom: 18,
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
  },

  formCard: {
    backgroundColor: colors.card,

    borderWidth: 1,
    borderColor: colors.border,

    borderRadius: 20,

    padding: 18,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  sectionDescription: {
    marginTop: 4,

    fontSize: 12,
    color: colors.textSecondary,

    marginBottom: 20,
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
    fontWeight: "600",

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
  },

  notesGroup: {
    marginTop: 18,
  },

  notesInput: {
    minHeight: 110,

    paddingTop: 13,
    paddingBottom: 13,
  },

  optionalText: {
    marginTop: 5,

    fontSize: 10,
    color: colors.textMuted,
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
    marginBottom: 12,

    fontSize: 10,
    fontWeight: "700",

    letterSpacing: 0.8,

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
    fontWeight: "700",

    color: colors.text,
  },

  previewLocation: {
    marginTop: 3,

    fontSize: 11,

    color: colors.textSecondary,
  },

  pendingBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,

    borderRadius: 15,

    backgroundColor: colors.warningSoft,
  },

  pendingText: {
    fontSize: 9,
    fontWeight: "700",

    color: colors.warning,
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
    minHeight: 52,

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
    fontWeight: "700",

    color: colors.textSecondary,
  },

  submitButton: {
    minHeight: 52,

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
    fontWeight: "700",

    color: "#FFFFFF",
  },
});