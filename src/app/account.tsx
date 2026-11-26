import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMediaUrl } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useResponsive } from "../hooks/useResponsive";
import { colors } from "../theme/colors";

export default function AccountScreen() {
  const { user, logout, isSuperAdmin } = useAuth();
  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of your session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/login");
            } catch (error: any) {
              Alert.alert("Logout Error", error?.message || "Failed to log out cleanly.");
            }
          },
        },
      ]
    );
  };

  const initials = (user?.name || "MR")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const avatarUrl = getMediaUrl(user?.image);

  const roleText =
    user?.role === "MR"
      ? "Medical Representative"
      : user?.role === "MR-head"
        ? "Branch Head"
        : user?.role === "superadmin"
          ? "Super Administrator"
          : "Medical Representative";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
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
                maxWidth: 1000,
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
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.text}
              />
            </Pressable>

            <View style={styles.headerText}>
              <Text style={styles.title}>Account Settings</Text>
              <Text style={styles.subtitle}>
                Manage your profile and app settings.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.mainLayout,
              isTablet && styles.mainLayoutTablet,
            ]}
          >
            {/* LEFT / PROFILE */}
            <View
              style={[
                styles.profileColumn,
                isTablet && styles.profileColumnTablet,
              ]}
            >
              <View style={styles.profileCard}>
                {avatarUrl ? (
                  <Image
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}

                <Text style={styles.name}>{user?.name || "Medical Representative"}</Text>
                <Text style={styles.role}>{roleText}</Text>

                {/* <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeText}>Active</Text>
                </View> */}
              </View>

              {/* Personal Information */}
              <Text style={styles.sectionTitle}>Personal Information</Text>

              <View style={styles.infoCard}>
                <InfoRow
                  icon="account-outline"
                  label="Full Name"
                  value={user?.name || "—"}
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="email-outline"
                  label="Email"
                  value={user?.email || "—"}
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="phone-outline"
                  label="Phone"
                  value={user?.phoneNumber || "Not provided"}
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="badge-account-outline"
                  label="Role"
                  value={roleText}
                />

                {user?.branchId && (
                  <>
                    <View style={styles.divider} />
                    <InfoRow
                      icon="office-building-outline"
                      label="Branch ID"
                      value={user.branchId}
                    />
                  </>
                )}
              </View>
            </View>

            {/* RIGHT / SETTINGS */}
            <View
              style={[
                styles.settingsColumn,
                isTablet && styles.settingsColumnTablet,
              ]}
            >

              {/* Admin Management Section */}
              {isSuperAdmin && (
                <>
                  <Text style={styles.sectionTitle}>Administration</Text>

                  <View style={styles.settingsCard}>
                    <SettingsRow
                      icon="account-group-outline"
                      title="Manage Users"
                      subtitle="View, ban, and create MR accounts"
                      onPress={() => router.push("/admin/users")}
                    />

                    <View style={styles.divider} />

                    <SettingsRow
                      icon="account-plus-outline"
                      title="MR Registrations"
                      subtitle="Review and approve pending applications"
                      onPress={() => router.push("/admin/registrations")}
                    />

                    <View style={styles.divider} />

                    <SettingsRow
                      icon="folder-open-outline"
                      title="Document Library"
                      subtitle="View and manage all uploaded documents"
                      onPress={() => router.push("/document" as any)}
                    />
                  </View>
                </>
              )}

              <Text style={styles.sectionTitle}>Account Settings</Text>

              <View style={styles.settingsCard}>
                <SettingsRow
                  icon="account-circle-outline"
                  title="Profile ID"
                  subtitle={user?.id || "—"}
                  onPress={() => { }}
                />

                <View style={styles.divider} />

                <SettingsRow
                  icon="bell-outline"
                  title="Notifications"
                  subtitle="Push notifications & alert preferences"
                  onPress={() => router.push("/(tabs)/notifications")}
                />
              </View>

              <Text style={styles.sectionTitle}>Support</Text>

              <View style={styles.settingsCard}>
                <SettingsRow
                  icon="information-outline"
                  title="About MediFlow"
                  subtitle="MediFlow MR Mobile App • v1.0.0"
                  onPress={() =>
                    Alert.alert(
                      "MediFlow",
                      "Medical Representative Mobile Portal\nVersion 1.0.0\nBackend Integration Active"
                    )
                  }
                />
              </View>

              {/* Logout */}
              <Pressable
                style={({ pressed }) => [
                  styles.logoutButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleLogout}
              >
                <MaterialCommunityIcons
                  name="logout"
                  size={20}
                  color={colors.danger}
                />
                <Text style={styles.logoutText}>Log Out</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.versionText}>MediFlow MR • v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={20}
          color={colors.primary}
        />
      </View>

      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: any;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && styles.settingsPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.settingIcon}>
        <MaterialCommunityIcons
          name={icon}
          size={21}
          color={colors.primary}
        />
      </View>

      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>

      <MaterialCommunityIcons
        name="chevron-right"
        size={22}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 120,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 23,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  mainLayout: {
    gap: 24,
  },
  mainLayoutTablet: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileColumn: {
    width: "100%",
  },
  profileColumnTablet: {
    flex: 1,
  },
  settingsColumn: {
    width: "100%",
  },
  settingsColumnTablet: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  name: {
    marginTop: 14,
    fontSize: 19,
    fontWeight: "600",
    color: colors.text,
  },
  role: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  activeBadge: {
    marginTop: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
    backgroundColor: colors.successSoft,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  activeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.success,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 11,
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    marginLeft: 11,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  infoValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  settingsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    paddingHorizontal: 14,
  },
  settingsRow: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  settingsPressed: {
    opacity: 0.65,
  },
  settingIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  settingContent: {
    flex: 1,
    marginLeft: 11,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  settingSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: "400",
  },
  logoutButton: {
    marginTop: 24,
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FECACA",
    backgroundColor: colors.dangerSoft,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.danger,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  versionText: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "400",
  },
});
