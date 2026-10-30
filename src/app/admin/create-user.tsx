import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import { FloatingLabelInput } from "../../components/FloatingLabelInput";
import { useAuth } from "../../context/AuthContext";
import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

type RoleOption = "MR" | "MR-head";

export default function CreateUserScreen() {
  const { isSuperAdmin } = useAuth();
  const { gutter, contentMaxWidth } = useResponsive();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<RoleOption>("MR");
  const [branchId, setBranchId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert("Validation", "Full name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Validation", "A valid email address is required.");
      return;
    }
    if (!password.trim() || password.length < 8) {
      Alert.alert("Validation", "Password must be at least 8 characters.");
      return;
    }
    if (role === "MR-head" && !branchId.trim()) {
      Alert.alert("Validation", "Branch ID is required for MR-Head accounts.");
      return;
    }

    try {
      setIsLoading(true);
      await apiRequest(API_ENDPOINTS.users.create, {
        method: "POST",
        body: {
          email: email.trim(),
          name: name.trim(),
          role,
          password: password.trim(),
          ...(branchId.trim() ? { branchId: branchId.trim() } : {}),
        },
      });

      Alert.alert(
        "Account Created",
        `${role} account for ${name} has been created successfully. They can now log in with the provided password.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert("Creation Failed", err?.message || "Could not create account.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="lock-outline" size={48} color={colors.textMuted} />
          <Text style={styles.accessDenied}>Access Restricted</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.innerContainer, { maxWidth: contentMaxWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
              <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Create MR Account</Text>
              <Text style={styles.headerSubtitle}>
                Instantly provision credentials for a new user
              </Text>
            </View>
          </View>

          {/* Role Selector */}
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Account Role</Text>
            <View style={styles.roleRow}>
              {(["MR", "MR-head"] as RoleOption[]).map((r) => (
                <Pressable
                  key={r}
                  style={[
                    styles.rolePill,
                    role === r && styles.rolePillActive,
                  ]}
                  onPress={() => setRole(r)}
                >
                  <MaterialCommunityIcons
                    name={r === "MR" ? "account-outline" : "account-star-outline"}
                    size={18}
                    color={role === r ? "#FFFFFF" : colors.text}
                  />
                  <Text
                    style={[
                      styles.rolePillText,
                      role === r && styles.rolePillTextActive,
                    ]}
                  >
                    {r === "MR" ? "Medical Rep" : "Branch Head"}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Fields */}
          <View style={styles.formCard}>
            <FloatingLabelInput
              label="Full Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <View style={styles.fieldSpacer} />

            <FloatingLabelInput
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />

            <View style={styles.fieldSpacer} />

            <FloatingLabelInput
              label="Password (min. 8 characters)"
              value={password}
              onChangeText={setPassword}
              isPassword
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              returnKeyType="next"
            />

            {role === "MR-head" && (
              <>
                <View style={styles.fieldSpacer} />
                <FloatingLabelInput
                  label="Branch ID (UUID)"
                  value={branchId}
                  onChangeText={setBranchId}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
              </>
            )}
          </View>

          {/* Info notice */}
          <View style={styles.noticeCard}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={colors.text}
            />
            <Text style={styles.noticeText}>
              The user will be able to log in immediately with this email and password. Share the credentials securely.
            </Text>
          </View>

          {/* Submit */}
          <Pressable
            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
            onPress={handleCreate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="account-plus-outline" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Create Account</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingVertical: 16 },
  innerContainer: { width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  backButton: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1,
    borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 20, fontWeight: "500", color: colors.text },
  headerSubtitle: { fontSize: 12, fontWeight: "400", color: colors.textMuted, marginTop: 2 },
  formCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, padding: 16, marginBottom: 14,
  },
  fieldLabel: { fontSize: 13, fontWeight: "500", color: colors.text, marginBottom: 10 },
  roleRow: { flexDirection: "row", gap: 10 },
  rolePill: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rolePillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  rolePillText: { fontSize: 13, fontWeight: "500", color: colors.text },
  rolePillTextActive: { color: "#FFFFFF" },
  fieldSpacer: { height: 12 },
  noticeCard: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: colors.surface, borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, padding: 12, marginBottom: 20,
  },
  noticeText: { flex: 1, fontSize: 12, fontWeight: "400", color: colors.text },
  submitButton: {
    height: 52, borderRadius: 8, backgroundColor: colors.primary,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  submitButtonDisabled: { opacity: 0.55 },
  submitButtonText: { fontSize: 15, fontWeight: "500", color: "#FFFFFF" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  accessDenied: { fontSize: 18, fontWeight: "500", color: colors.text, marginTop: 12 },
});
