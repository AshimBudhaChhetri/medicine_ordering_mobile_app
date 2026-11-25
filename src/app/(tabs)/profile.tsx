import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as DocumentPicker from "expo-document-picker";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMediaUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";

export default function ProfileScreen() {
  const { user, logout, isSuperAdmin, refreshSession } = useAuth();
  const [uploading, setUploading] = useState(false);

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

  const handlePickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      setUploading(true);

      const formData = new FormData();
      formData.append("image", {
        uri: asset.uri,
        name: asset.name ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as any);

      await authService.updateAvatar(formData);
      await refreshSession();
    } catch (err: any) {
      Alert.alert("Upload failed", err?.message ?? "Could not update profile picture.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
              router.replace("/login");
            } catch (error: any) {
              Alert.alert("Error", error?.message ?? "Failed to log out.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <Pressable
            onPress={handlePickAvatar}
            disabled={uploading}
            style={styles.avatarWrapper}
            accessibilityLabel="Change profile picture"
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}

            {/* Camera overlay */}
            <View style={styles.cameraOverlay}>
              {uploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons name="camera-outline" size={16} color="#FFFFFF" />
              )}
            </View>
          </Pressable>

          <Text style={styles.userName}>{user?.name ?? "—"}</Text>
          <Text style={styles.userRole}>{roleText}</Text>
          {user?.email ? (
            <Text style={styles.userEmail}>{user.email}</Text>
          ) : null}
        </View>

        {/* Info Card */}
        <View style={styles.card}>
          <InfoRow icon="account-outline" label="Full Name" value={user?.name ?? "—"} />
          <View style={styles.divider} />
          <InfoRow icon="email-outline" label="Email" value={user?.email ?? "—"} />
          {user?.phoneNumber ? (
            <>
              <View style={styles.divider} />
              <InfoRow icon="phone-outline" label="Phone" value={user.phoneNumber} />
            </>
          ) : null}
          <View style={styles.divider} />
          <InfoRow icon="badge-account-outline" label="Role" value={roleText} />
        </View>

        {/* Admin section */}
        {isSuperAdmin && (
          <>
            <Text style={styles.sectionLabel}>Administration</Text>
            <View style={styles.card}>
              <NavRow
                icon="account-group-outline"
                title="Manage Users"
                subtitle="View, ban, and create MR accounts"
                onPress={() => router.push("/admin/users")}
              />
              <View style={styles.divider} />
              <NavRow
                icon="account-plus-outline"
                title="MR Registrations"
                subtitle="Review and approve pending applications"
                onPress={() => router.push("/admin/registrations")}
              />
            </View>
          </>
        )}

        {/* Log Out */}
        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.versionText}>MediFlow MR • v1.0.0</Text>
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
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons name={icon} size={19} color="#2563EB" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function NavRow({
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
      style={({ pressed }) => [styles.navRow, pressed && { opacity: 0.65 }]}
      onPress={onPress}
    >
      <View style={styles.infoIconWrap}>
        <MaterialCommunityIcons name={icon} size={19} color="#2563EB" />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.navTitle}>{title}</Text>
        <Text style={styles.infoLabel}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 48,
  },
  /* Avatar */
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  avatarWrapper: {
    marginBottom: 14,
  },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#111827",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 20,
    fontWeight: "500",
    color: "#000000",
  },
  userRole: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
  userEmail: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "300",
    color: "#9CA3AF",
  },
  /* Card */
  card: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 18,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  /* Info rows */
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "400",
    color: "#9CA3AF",
  },
  infoValue: {
    marginTop: 2,
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  navTitle: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
  },
  /* Section label */
  sectionLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 10,
    marginLeft: 2,
  },
  /* Logout */
  logoutBtn: {
    marginTop: 8,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#EF4444",
  },
  versionText: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "300",
    color: "#D1D5DB",
  },
});
