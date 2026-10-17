import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsive } from "../../hooks/useResponsive";
import { colors } from "../../theme/colors";

export default function AccountScreen() {
  const { isTablet, gutter, contentMaxWidth } = useResponsive();

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Log Out",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Frontend Prototype",
              "Authentication will be connected when the backend is ready."
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
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
                  maxWidth: 1000,
                  alignSelf: "center",
                }
              : undefined,
          ]}
        >
          {/* Header */}

          <View style={styles.header}>
            <Text style={styles.title}>Account</Text>

            <Text style={styles.subtitle}>
              Manage your profile and app settings.
            </Text>
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
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>SS</Text>
                </View>

                <Text style={styles.name}>
                  Sushma Shrestha
                </Text>

                <Text style={styles.role}>
                  Medical Representative
                </Text>

                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />

                  <Text style={styles.activeText}>
                    Active
                  </Text>
                </View>
              </View>

              {/* Basic Information */}

              <Text style={styles.sectionTitle}>
                Personal Information
              </Text>

              <View style={styles.infoCard}>
                <InfoRow
                  icon="account-outline"
                  label="Full Name"
                  value="Sushma Shrestha"
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="email-outline"
                  label="Email"
                  value="sushma.mr@mediflow.com"
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="phone-outline"
                  label="Phone"
                  value="98XXXXXXXX"
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="badge-account-outline"
                  label="Designation"
                  value="Medical Representative"
                />

                <View style={styles.divider} />

                <InfoRow
                  icon="map-marker-outline"
                  label="Territory / Area"
                  value="Kathmandu Valley"
                />
              </View>
            </View>

            {/* RIGHT / SETTINGS */}

            <View
              style={[
                styles.settingsColumn,
                isTablet && styles.settingsColumnTablet,
              ]}
            >
              <Text style={styles.sectionTitle}>
                Account Settings
              </Text>

              <View style={styles.settingsCard}>
                <SettingsRow
                  icon="account-edit-outline"
                  title="Edit Profile"
                  subtitle="Update your personal information"
                  onPress={() =>
                    Alert.alert(
                      "Edit Profile",
                      "We can build the Edit Profile screen next."
                    )
                  }
                />

                <View style={styles.divider} />

                <SettingsRow
                  icon="lock-outline"
                  title="Change Password"
                  subtitle="Update your account password"
                  onPress={() =>
                    Alert.alert(
                      "Change Password",
                      "Password management will be connected with authentication later."
                    )
                  }
                />

                <View style={styles.divider} />

                <SettingsRow
                  icon="bell-outline"
                  title="Notifications"
                  subtitle="Manage request notifications"
                  onPress={() =>
                    Alert.alert(
                      "Notifications",
                      "Notification settings will be added later."
                    )
                  }
                />
              </View>

              <Text style={styles.sectionTitle}>
                Support
              </Text>

              <View style={styles.settingsCard}>
                <SettingsRow
                  icon="help-circle-outline"
                  title="Help & Support"
                  subtitle="Get help using MediFlow"
                  onPress={() =>
                    Alert.alert(
                      "Help & Support",
                      "Support information will be connected later."
                    )
                  }
                />

                <View style={styles.divider} />

                <SettingsRow
                  icon="information-outline"
                  title="About MediFlow"
                  subtitle="Version 1.0.0"
                  onPress={() =>
                    Alert.alert(
                      "MediFlow",
                      "Medical Representative Portal\nVersion 1.0.0"
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

                <Text style={styles.logoutText}>
                  Log Out
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.versionText}>
            MediFlow MR • v1.0.0
          </Text>
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
        <Text style={styles.infoLabel}>
          {label}
        </Text>

        <Text style={styles.infoValue}>
          {value}
        </Text>
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
        <Text style={styles.settingTitle}>
          {title}
        </Text>

        <Text style={styles.settingSubtitle}>
          {subtitle}
        </Text>
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
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textSecondary,
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

    paddingVertical: 28,
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

  avatarText: {
    fontSize: 25,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  name: {
    marginTop: 15,

    fontSize: 20,
    fontWeight: "700",

    color: colors.text,
  },

  role: {
    marginTop: 4,

    fontSize: 12,

    color: colors.textSecondary,
  },

  activeBadge: {
    marginTop: 13,

    paddingHorizontal: 11,
    paddingVertical: 6,

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
    fontSize: 10,
    fontWeight: "700",

    color: colors.success,
  },

  sectionTitle: {
    marginTop: 25,
    marginBottom: 11,

    fontSize: 16,
    fontWeight: "700",

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
    fontSize: 10,

    color: colors.textSecondary,
  },

  infoValue: {
    marginTop: 3,

    fontSize: 13,
    fontWeight: "600",

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
    minHeight: 72,

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
    fontWeight: "700",

    color: colors.text,
  },

  settingSubtitle: {
    marginTop: 3,

    fontSize: 10,

    color: colors.textSecondary,
  },

  logoutButton: {
    marginTop: 25,

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
    fontWeight: "700",

    color: colors.danger,
  },

  buttonPressed: {
    opacity: 0.8,
  },

  versionText: {
    marginTop: 30,

    textAlign: "center",

    fontSize: 10,

    color: colors.textMuted,
  },
});