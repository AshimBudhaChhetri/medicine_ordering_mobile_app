import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ApiError } from "../api/ApiError";
import { FloatingLabelInput } from "../components/FloatingLabelInput";
import { useAuth } from "../context/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
import { authService } from "../services/authService";
import { colors } from "../theme/colors";

export default function LoginScreen() {
  const { isTablet, gutter } = useResponsive();
  const { login } = useAuth();

  // ---------------------------------------------------------
  // REFS & KEYBOARD AVOIDANCE
  // ---------------------------------------------------------

  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, () => {
      setIsKeyboardVisible(true);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ---------------------------------------------------------
  // FORM STATE
  // ---------------------------------------------------------

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------
  // FORGOT PASSWORD STATE
  // ---------------------------------------------------------

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetStep, setResetStep] = useState<"REQUEST" | "CONFIRM">("REQUEST");
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------

  const handleLogin = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await login({
        email: cleanEmail,
        password,
      });

      router.replace("/(tabs)/orders" as any);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 400) {
          Alert.alert(
            "Sign in failed",
            error.message || "Please check your login details."
          );
          return;
        }

        if (error.status === 401) {
          Alert.alert("Sign in failed", "Invalid email or password.");
          return;
        }

        if (error.status === 403) {
          Alert.alert(
            "Access denied",
            error.message ||
            "Your account does not have access to this application."
          );
          return;
        }

        if (error.status === 429) {
          Alert.alert(
            "Too many attempts",
            "Please wait a moment and try again."
          );
          return;
        }

        if (error.status >= 500) {
          Alert.alert(
            "Server Error",
            "The server is currently unable to process your request. Please try again."
          );
          return;
        }

        Alert.alert("Unable to sign in", error.message);
        return;
      }

      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and backend URL."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // PASSWORD RESET HANDLERS
  // ---------------------------------------------------------

  const handleRequestResetOtp = async () => {
    const clean = resetEmail.trim().toLowerCase();
    if (!clean) {
      Alert.alert("Email required", "Please enter your registered email address.");
      return;
    }

    try {
      setIsResetSubmitting(true);
      await authService.requestPasswordReset(clean);
      Alert.alert(
        "Code Sent",
        "A 6-digit verification code has been sent to your email."
      );
      setResetStep("CONFIRM");
    } catch (err: any) {
      Alert.alert("Request Failed", err?.message || "Failed to send reset code.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleConfirmReset = async () => {
    const clean = resetEmail.trim().toLowerCase();
    const otp = resetOtp.trim();
    if (!otp || !resetNewPassword) {
      Alert.alert(
        "Missing Information",
        "Please enter the OTP code and your new password."
      );
      return;
    }

    try {
      setIsResetSubmitting(true);
      await authService.confirmPasswordReset(clean, otp, resetNewPassword);
      Alert.alert(
        "Password Reset",
        "Your password has been reset successfully. Please sign in with your new password.",
        [
          {
            text: "Sign In",
            onPress: () => {
              setResetModalVisible(false);
              setEmail(clean);
              setPassword("");
              setResetStep("REQUEST");
              setResetOtp("");
              setResetNewPassword("");
            },
          },
        ]
      );
    } catch (err: any) {
      Alert.alert("Reset Failed", err?.message || "Failed to reset password.");
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const showCompactBrand = isKeyboardVisible && !isTablet;

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: gutter,
              paddingTop: showCompactBrand ? 12 : 28,
              paddingBottom: showCompactBrand ? 14 : 28,
              justifyContent: showCompactBrand ? "flex-start" : "center",
            },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, isTablet ? styles.pageTablet : undefined]}>
            {/* BRAND AREA */}
            {showCompactBrand ? (
              <View style={styles.brandSectionCompact}>
                <View style={styles.logoIconCompact}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={20}
                    color="#FFFFFF"
                  />
                </View>
                <View>
                  <Text style={styles.logoTextCompact}>MediFlow</Text>
                  <Text style={styles.portalTextCompact}>
                    MR Portal
                  </Text>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.brandSection,
                  isTablet ? styles.brandSectionTablet : undefined,
                ]}
              >
                <View style={styles.logoIcon}>
                  <MaterialCommunityIcons
                    name="medical-bag"
                    size={34}
                    color="#FFFFFF"
                  />
                </View>

                <Text style={styles.logoText}>MediFlow</Text>

                <Text style={styles.portalText}>
                  MR Portal
                </Text>
              </View>
            )}

            {/* LOGIN CARD */}
            <View
              style={[
                styles.loginCard,
                showCompactBrand && styles.loginCardCompact,
                isTablet ? styles.loginCardTablet : undefined,
              ]}
            >
              {/* EMAIL WITH FLOATING LABEL */}
              <View style={showCompactBrand ? styles.fieldGroupCompact : styles.fieldGroup}>
                <FloatingLabelInput
                  inputRef={emailInputRef}
                  label="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  returnKeyType="next"
                  editable={!isSubmitting}
                  onSubmitEditing={() => passwordInputRef.current?.focus()}
                />
              </View>

              {/* PASSWORD WITH FLOATING LABEL */}
              <View style={showCompactBrand ? styles.fieldGroupCompact : styles.fieldGroup}>
                <FloatingLabelInput
                  inputRef={passwordInputRef}
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((current) => !current)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  returnKeyType="done"
                  editable={!isSubmitting}
                  onSubmitEditing={() => {
                    if (!isSubmitting) {
                      handleLogin();
                    }
                  }}
                />
              </View>

              {/* SIGN IN BUTTON */}
              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  showCompactBrand && styles.loginButtonCompact,
                  isSubmitting ? styles.loginButtonDisabled : undefined,
                  pressed && !isSubmitting ? styles.buttonPressed : undefined,
                ]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Logging in...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.loginButtonText}>Log In</Text>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </Pressable>

              {/* FORGOT PASSWORD */}
              <Pressable
                style={[
                  styles.forgotPassword,
                  showCompactBrand && styles.forgotPasswordCompact,
                ]}
                disabled={isSubmitting}
                onPress={() => {
                  setResetEmail(email.trim());
                  setResetStep("REQUEST");
                  setResetModalVisible(true);
                }}
              >
                <Text style={styles.forgotPasswordText}>Forgot password?</Text>
              </Pressable>
            </View>
          </View>

          {/* FOOTER */}
          {!showCompactBrand && (
            <Text style={styles.footer}>MediFlow MR • v1.0.0</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FORGOT PASSWORD MODAL */}
      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {resetStep === "REQUEST" ? "Reset Password" : "Enter Verification Code"}
              </Text>
              <Pressable
                onPress={() => setResetModalVisible(false)}
                hitSlop={10}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>

            {resetStep === "REQUEST" ? (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter your email address and we will send you a 6-digit verification code.
                </Text>
                <View style={styles.modalField}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    placeholder="rep@example.com"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.modalInput}
                  />
                </View>
                <Pressable
                  style={[
                    styles.modalButton,
                    isResetSubmitting && styles.loginButtonDisabled,
                  ]}
                  onPress={handleRequestResetOtp}
                  disabled={isResetSubmitting}
                >
                  {isResetSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Send Code</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.modalSubtitle}>
                  Enter the 6-digit code sent to {resetEmail} and your new password.
                </Text>
                <View style={styles.modalField}>
                  <Text style={styles.label}>6-Digit OTP</Text>
                  <TextInput
                    value={resetOtp}
                    onChangeText={setResetOtp}
                    placeholder="123456"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    style={styles.modalInput}
                  />
                </View>
                <View style={styles.modalField}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    value={resetNewPassword}
                    onChangeText={setResetNewPassword}
                    placeholder="New secure password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    style={styles.modalInput}
                  />
                </View>
                <Pressable
                  style={[
                    styles.modalButton,
                    isResetSubmitting && styles.loginButtonDisabled,
                  ]}
                  onPress={handleConfirmReset}
                  disabled={isResetSubmitting}
                >
                  {isResetSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Confirm & Reset</Text>
                  )}
                </Pressable>
                <Pressable
                  style={styles.modalBackLink}
                  onPress={() => setResetStep("REQUEST")}
                >
                  <Text style={styles.modalBackLinkText}>← Back to email</Text>
                </Pressable>
              </>
            )}
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
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 28,
    paddingBottom: 28,
  },
  page: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  pageTablet: {
    maxWidth: 950,
    flexDirection: "row",
    alignItems: "center",
    gap: 50,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  brandSectionCompact: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  brandSectionTablet: {
    flex: 1,
    alignItems: "flex-start",
    marginBottom: 0,
    paddingHorizontal: 25,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoIconCompact: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 28,
    fontWeight: "600",
    color: colors.text,
  },
  logoTextCompact: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  portalText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  portalTextCompact: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.primary,
  },
  loginCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  loginCardCompact: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderRadius: 20,
  },
  loginCardTablet: {
    flex: 1,
    maxWidth: 440,
    padding: 30,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldGroupCompact: {
    marginBottom: 12,
  },
  label: {
    marginLeft: 14,
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  forgotPassword: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    minHeight: 46,
    marginTop: 10,
    marginBottom: 6,
  },
  forgotPasswordCompact: {
    minHeight: 40,
    marginTop: 8,
    marginBottom: 2,
    borderRadius: 12,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  loginButton: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  loginButtonCompact: {
    minHeight: 46,
    borderRadius: 12,
    marginTop: 2,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  footer: {
    marginTop: 22,
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "400",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 18,
    fontWeight: "400",
  },
  modalField: {
    marginBottom: 14,
  },
  modalInput: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    fontSize: 14,
    color: colors.text,
  },
  modalButton: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackLink: {
    alignSelf: "center",
    marginTop: 14,
  },
  modalBackLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "500",
  },
});
