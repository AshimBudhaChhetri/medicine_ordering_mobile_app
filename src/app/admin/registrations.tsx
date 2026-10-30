import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useResponsive } from "../../hooks/useResponsive";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import { colors } from "../../theme/colors";

interface RegistrationItem {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedBranchId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

type RegResponse = { registrations: RegistrationItem[]; total: number };

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "Pending", color: colors.warning, bg: colors.warningSoft },
  APPROVED: { label: "Approved", color: colors.success, bg: colors.successSoft },
  REJECTED: { label: "Rejected", color: colors.danger, bg: colors.dangerSoft },
};

export default function AdminRegistrationsScreen() {
  const { isSuperAdmin } = useAuth();
  const { gutter, contentMaxWidth } = useResponsive();

  const [registrations, setRegistrations] = useState<RegistrationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");

  const loadRegistrations = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const res = await apiRequest<RegResponse>(
        `${API_ENDPOINTS.registrations.list}?status=${activeTab}`
      );
      setRegistrations(res.registrations || []);
    } catch {
      setRegistrations([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isSuperAdmin, activeTab]);

  useFocusEffect(
    useCallback(() => {
      loadRegistrations();
    }, [loadRegistrations])
  );

  const handleApprove = (item: RegistrationItem) => {
    Alert.alert(
      "Approve Registration",
      `Approve ${item.name}'s application? This will create an active MR account and send them an email to set their password.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: async () => {
            try {
              await apiRequest(API_ENDPOINTS.registrations.approve(item.id), {
                method: "PATCH",
                body: { role: "MR", branchId: item.requestedBranchId || undefined },
              });
              Alert.alert("Approved", `${item.name}'s application was approved.`);
              loadRegistrations();
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to approve registration");
            }
          },
        },
      ]
    );
  };

  const handleReject = (item: RegistrationItem) => {
    Alert.alert(
      "Reject Registration",
      `Enter the reason for rejecting ${item.name}'s application:`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await apiRequest(API_ENDPOINTS.registrations.reject(item.id), {
                method: "PATCH",
                body: { reason: "Application did not meet requirements." },
              });
              Alert.alert("Rejected", `${item.name}'s application was rejected.`);
              loadRegistrations();
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to reject registration");
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: RegistrationItem }) => {
    const statusConfig = STATUS_LABELS[item.status] || STATUS_LABELS.PENDING;
    const createdDate = new Date(item.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return (
      <View style={styles.regCard}>
        <View style={styles.regCardTop}>
          <View style={styles.regAvatar}>
            <Text style={styles.regAvatarText}>
              {(item.name || "A")[0].toUpperCase()}
            </Text>
          </View>

          <View style={styles.regInfo}>
            <Text style={styles.regName}>{item.name}</Text>
            <Text style={styles.regEmail} numberOfLines={1}>{item.email}</Text>
            {item.phoneNumber && (
              <Text style={styles.regPhone}>{item.phoneNumber}</Text>
            )}
            <Text style={styles.regDate}>Applied {createdDate}</Text>
          </View>

          <View style={[styles.regStatusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.regStatusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </View>

        {item.rejectionReason && (
          <View style={styles.rejectionBanner}>
            <Text style={styles.rejectionBannerText}>
              Reason: {item.rejectionReason}
            </Text>
          </View>
        )}

        {item.status === "PENDING" && (
          <View style={styles.regActions}>
            <Pressable
              style={styles.approveBtn}
              onPress={() => handleApprove(item)}
            >
              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
              <Text style={styles.approveBtnText}>Approve</Text>
            </Pressable>
            <Pressable
              style={styles.rejectBtn}
              onPress={() => handleReject(item)}
            >
              <MaterialCommunityIcons name="close" size={16} color={colors.danger} />
              <Text style={styles.rejectBtnText}>Reject</Text>
            </Pressable>
          </View>
        )}
      </View>
    );
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
      <View
        style={[
          styles.container,
          { paddingHorizontal: gutter, maxWidth: contentMaxWidth, alignSelf: "center", width: "100%" },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>MR Registrations</Text>
            <Text style={styles.headerSubtitle}>Review and approve MR applications</Text>
          </View>
        </View>

        {/* Tab Filter */}
        <View style={styles.tabRow}>
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => {
            const cfg = STATUS_LABELS[tab];
            return (
              <Pressable
                key={tab}
                style={[
                  styles.tabItem,
                  activeTab === tab && styles.tabItemActive,
                ]}
                onPress={() => {
                  setActiveTab(tab);
                  setIsLoading(true);
                }}
              >
                <Text
                  style={[
                    styles.tabItemText,
                    activeTab === tab && { color: cfg.color },
                  ]}
                >
                  {cfg.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isLoading && !isRefreshing ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={registrations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => { setIsRefreshing(true); loadRegistrations(); }}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="account-clock-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyTitle}>
                  No {activeTab.toLowerCase()} registrations
                </Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === "PENDING"
                    ? "All applications have been reviewed"
                    : `No ${activeTab.toLowerCase()} applications to show`}
                </Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingTop: 16 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 12 },
  backButton: {
    width: 40, height: 40, borderRadius: 8, borderWidth: 1,
    borderColor: colors.border, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF",
  },
  headerTitle: { fontSize: 20, fontWeight: "500", color: colors.text },
  headerSubtitle: { fontSize: 12, fontWeight: "400", color: colors.textMuted, marginTop: 2 },
  tabRow: {
    flexDirection: "row", borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, backgroundColor: "#FFFFFF", marginBottom: 16, overflow: "hidden",
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: "center" },
  tabItemActive: { backgroundColor: colors.surface },
  tabItemText: { fontSize: 13, fontWeight: "500", color: colors.textMuted },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 24, gap: 12 },
  regCard: {
    backgroundColor: "#FFFFFF", borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, padding: 14,
  },
  regCardTop: { flexDirection: "row", gap: 12 },
  regAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  regAvatarText: { fontSize: 18, fontWeight: "500", color: colors.text },
  regInfo: { flex: 1 },
  regName: { fontSize: 15, fontWeight: "500", color: colors.text, marginBottom: 2 },
  regEmail: { fontSize: 12, fontWeight: "400", color: colors.textMuted },
  regPhone: { fontSize: 12, fontWeight: "400", color: colors.textMuted },
  regDate: { fontSize: 11, fontWeight: "300", color: colors.textMuted, marginTop: 3 },
  regStatusBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border,
  },
  regStatusText: { fontSize: 11, fontWeight: "500" },
  rejectionBanner: {
    marginTop: 10, backgroundColor: colors.surface, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: colors.border,
  },
  rejectionBannerText: { fontSize: 12, fontWeight: "400", color: colors.text },
  regActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  approveBtn: {
    flex: 1, height: 38, borderRadius: 8, backgroundColor: colors.success,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
  },
  approveBtnText: { fontSize: 13, fontWeight: "500", color: "#FFFFFF" },
  rejectBtn: {
    flex: 1, height: 38, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    backgroundColor: colors.surface,
  },
  rejectBtnText: { fontSize: 13, fontWeight: "500", color: colors.danger },
  accessDenied: { fontSize: 18, fontWeight: "500", color: colors.text, marginTop: 12 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "500", color: colors.text, marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, fontWeight: "400", color: colors.textMuted },
});

