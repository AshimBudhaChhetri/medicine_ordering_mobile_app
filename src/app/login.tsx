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

import { ApiError } from "../api/ApiError";
import { useAuth } from "../context/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
import { colors } from "../theme/colors";

export default function LoginScreen() {
  const { isTablet, gutter } = useResponsive();

  const { login } = useAuth();

  // ---------------------------------------------------------
  // FORM STATE
  // ---------------------------------------------------------

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------

  const handleLogin = async () => {
    /**
     * Always normalize the email before
     * sending it to the backend.
     */
    const cleanEmail =
      email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      Alert.alert(
        "Missing information",
        "Please enter your email and password."
      );

      return;
    }

    try {
      setIsSubmitting(true);

      /**
       * AuthContext handles:
       *
       * 1. Calling the backend login endpoint
       * 2. Saving the Better Auth session token
       * 3. Updating the authenticated user
       */
      await login({
        email: cleanEmail,
        password,
      });

      /**
       * Login was successful.
       * Send the MR to the Home dashboard.
       */
      router.replace("/(tabs)/home");
    } catch (error) {
      /**
       * Our API client converts backend
       * failures into ApiError.
       */
      if (error instanceof ApiError) {
        if (error.status === 400) {
          Alert.alert(
            "Sign in failed",
            error.message ||
              "Please check your login details."
          );

          return;
        }

        if (error.status === 401) {
          Alert.alert(
            "Sign in failed",
            "Invalid email or password."
          );

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

        Alert.alert(
          "Unable to sign in",
          error.message
        );

        return;
      }

      /**
       * Usually means:
       * - backend tunnel is offline
       * - wrong base URL in .env
       * - internet/network problem
       */
      Alert.alert(
        "Connection Error",
        "Unable to connect to the server. Please check your internet connection and backend URL."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: gutter,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.page,
              isTablet
                ? styles.pageTablet
                : undefined,
            ]}
          >
            {/* =================================================
                BRAND AREA
            ================================================== */}

            <View
              style={[
                styles.brandSection,
                isTablet
                  ? styles.brandSectionTablet
                  : undefined,
              ]}
            >
              <View style={styles.logoIcon}>
                <MaterialCommunityIcons
                  name="medical-bag"
                  size={34}
                  color="#FFFFFF"
                />
              </View>

              <Text style={styles.logoText}>
                MediFlow
              </Text>

              <Text style={styles.portalText}>
                Medical Representative Portal
              </Text>

              <Text
                style={[
                  styles.brandDescription,
                  isTablet
                    ? styles.brandDescriptionTablet
                    : undefined,
                ]}
              >
                Manage medicine requests and your
                assigned stockists from one place.
              </Text>
            </View>

            {/* =================================================
                LOGIN CARD
            ================================================== */}

            <View
              style={[
                styles.loginCard,
                isTablet
                  ? styles.loginCardTablet
                  : undefined,
              ]}
            >
              <Text style={styles.welcomeText}>
                Welcome back
              </Text>

              <Text style={styles.loginSubtitle}>
                Sign in to continue to MediFlow.
              </Text>

              {/* EMAIL */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Email
                </Text>

                <View
                  style={[
                    styles.inputContainer,
                    isSubmitting &&
                      styles.inputContainerDisabled,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="email-outline"
                    size={20}
                    color={colors.textMuted}
                  />

                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    editable={!isSubmitting}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* PASSWORD */}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>
                  Password
                </Text>

                <View
                  style={[
                    styles.inputContainer,
                    isSubmitting &&
                      styles.inputContainerDisabled,
                  ]}
                >
                  <MaterialCommunityIcons
                    name="lock-outline"
                    size={20}
                    color={colors.textMuted}
                  />

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter your password"
                    placeholderTextColor={
                      colors.textMuted
                    }
                    secureTextEntry={!showPassword}
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
                    style={styles.input}
                  />

                  <Pressable
                    onPress={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    disabled={isSubmitting}
                    hitSlop={10}
                  >
                    <MaterialCommunityIcons
                      name={
                        showPassword
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      size={21}
                      color={colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              {/* FORGOT PASSWORD */}

              <Pressable
                style={styles.forgotPassword}
                disabled={isSubmitting}
                onPress={() =>
                  Alert.alert(
                    "Forgot Password",
                    "Password recovery will be connected next."
                  )
                }
              >
                <Text
                  style={
                    styles.forgotPasswordText
                  }
                >
                  Forgot password?
                </Text>
              </Pressable>

              {/* =================================================
                  SIGN IN BUTTON
              ================================================== */}

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,

                  isSubmitting
                    ? styles.loginButtonDisabled
                    : undefined,

                  pressed && !isSubmitting
                    ? styles.buttonPressed
                    : undefined,
                ]}
                onPress={handleLogin}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator
                      size="small"
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.loginButtonText
                      }
                    >
                      Signing in...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text
                      style={
                        styles.loginButtonText
                      }
                    >
                      Sign In
                    </Text>

                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={20}
                      color="#FFFFFF"
                    />
                  </>
                )}
              </Pressable>

              {/* REAL API MESSAGE */}

              <View style={styles.infoBox}>
                <MaterialCommunityIcons
                  name="shield-check-outline"
                  size={18}
                  color={colors.primary}
                />

                <Text style={styles.infoText}>
                  Sign in using your MediFlow MR
                  account provided or approved by
                  the administrator.
                </Text>
              </View>
            </View>
          </View>

          {/* FOOTER */}

          <Text style={styles.footer}>
            MediFlow MR • v1.0.0
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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

    paddingTop: 30,
    paddingBottom: 30,
  },

  // ---------------------------------------------------------
  // PAGE
  // ---------------------------------------------------------

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

  // ---------------------------------------------------------
  // BRAND
  // ---------------------------------------------------------

  brandSection: {
    alignItems: "center",

    marginBottom: 35,
  },

  brandSectionTablet: {
    flex: 1,

    alignItems: "flex-start",

    marginBottom: 0,

    paddingHorizontal: 25,
  },

  logoIcon: {
    width: 68,
    height: 68,

    borderRadius: 22,

    backgroundColor: colors.primary,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 15,
  },

  logoText: {
    fontSize: 31,

    fontWeight: "800",

    color: colors.text,
  },

  portalText: {
    marginTop: 4,

    fontSize: 13,

    fontWeight: "600",

    color: colors.primary,
  },

  brandDescription: {
    marginTop: 15,

    maxWidth: 370,

    textAlign: "center",

    fontSize: 14,

    lineHeight: 21,

    color: colors.textSecondary,
  },

  brandDescriptionTablet: {
    textAlign: "left",
  },

  // ---------------------------------------------------------
  // LOGIN CARD
  // ---------------------------------------------------------

  loginCard: {
    backgroundColor: colors.card,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: 24,

    padding: 22,
  },

  loginCardTablet: {
    flex: 1,

    maxWidth: 440,

    padding: 30,
  },

  welcomeText: {
    fontSize: 25,

    fontWeight: "700",

    color: colors.text,
  },

  loginSubtitle: {
    marginTop: 6,

    marginBottom: 26,

    fontSize: 13,

    color: colors.textSecondary,
  },

  // ---------------------------------------------------------
  // FORM
  // ---------------------------------------------------------

  fieldGroup: {
    marginBottom: 17,
  },

  label: {
    marginBottom: 7,

    fontSize: 12,

    fontWeight: "600",

    color: colors.text,
  },

  inputContainer: {
    minHeight: 52,

    paddingHorizontal: 14,

    borderRadius: 14,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: "#FAFBFD",

    flexDirection: "row",

    alignItems: "center",
  },

  inputContainerDisabled: {
    opacity: 0.65,
  },

  input: {
    flex: 1,

    marginLeft: 9,

    paddingVertical: 0,

    fontSize: 14,

    color: colors.text,
  },

  // ---------------------------------------------------------
  // FORGOT PASSWORD
  // ---------------------------------------------------------

  forgotPassword: {
    alignSelf: "flex-end",

    marginTop: -4,

    marginBottom: 20,
  },

  forgotPasswordText: {
    fontSize: 12,

    fontWeight: "600",

    color: colors.primary,
  },

  // ---------------------------------------------------------
  // LOGIN BUTTON
  // ---------------------------------------------------------

  loginButton: {
    minHeight: 54,

    borderRadius: 14,

    backgroundColor: colors.primary,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    fontSize: 15,

    fontWeight: "700",

    color: "#FFFFFF",
  },

  buttonPressed: {
    opacity: 0.85,

    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  // ---------------------------------------------------------
  // INFO
  // ---------------------------------------------------------

  infoBox: {
    marginTop: 20,

    padding: 12,

    borderRadius: 12,

    backgroundColor: colors.primarySoft,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 8,
  },

  infoText: {
    flex: 1,

    fontSize: 10,

    lineHeight: 15,

    color: colors.textSecondary,
  },

  // ---------------------------------------------------------
  // FOOTER
  // ---------------------------------------------------------

  footer: {
    marginTop: 25,

    textAlign: "center",

    fontSize: 10,

    color: colors.textMuted,
  },
});