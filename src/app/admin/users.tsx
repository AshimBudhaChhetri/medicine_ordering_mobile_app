import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../../context/AuthContext";
import { useResponsive } from "../../hooks/useResponsive";
import { apiRequest } from "../../api/client";
import { API_ENDPOINTS } from "../../api/endpoints";
import { ListRowSkeleton } from "../../components/Skeleton";
import { colors } from "../../theme/colors";
import { AuthUser } from "../../types/auth";

type UsersResponse = { users: AuthUser[]; total: number };

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Superadmin",
  MR: "Medical Rep",
  "MR-head": "Branch Head",
};

export default function AdminUsersScreen() {
  const { isSuperAdmin } = useAuth();
  const { gutter, contentMaxWidth } = useResponsive();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadUsers = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}` : "";
      const res = await apiRequest<UsersResponse>(`${API_ENDPOINTS.users.list}${query}`);
      setUsers(res.users || []);
    } catch {
      setUsers([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isSuperAdmin, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  const handleBan = (user: AuthUser) => {
    Alert.alert(
      user.banned ? "Unban User" : "Ban User",
      user.banned
        ? `Are you sure you want to restore access for ${user.name}?`
        : `Are you sure you want to ban ${user.name}? They will be immediately signed out.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: user.banned ? "Unban" : "Ban",
          style: user.banned ? "default" : "destructive",
          onPress: async () => {
            try {
              const url = `${API_ENDPOINTS.users.list}/${user.id}/${user.banned ? "unban" : "ban"}`;
              await apiRequest(url, {
                method: "POST",
                body: user.banned ? {} : { reason: "Account suspended by administrator" },
              });
              loadUsers();
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Operation failed");
            }
          },
        },
      ]
    );
  };

  const getRoleColor = (role?: string) => {
    if (role === "superadmin") return colors.danger;
    if (role === "MR-head") return colors.warning;
    return colors.primary;
  };

  const renderUser = ({ item }: { item: AuthUser }) => (
    <View style={[styles.userCard, item.banned && styles.userCardBanned]}>
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {(item.name || "U")[0].toUpperCase()}
        </Text>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.rolePill,
              { borderColor: getRoleColor(item.role) },
            ]}
          >
            <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>
              {ROLE_LABELS[item.role] || item.role}
            </Text>
          </View>
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.email}
        </Text>
        {item.banned && (
          <Text style={styles.bannedLabel}>Account suspended</Text>
        )}
      </View>

      <Pressable
        style={styles.banButton}
        onPress={() => handleBan(item)}
        hitSlop={8}
      >
        <MaterialCommunityIcons
          name={item.banned ? "account-check-outline" : "account-cancel-outline"}
          size={20}
          color={item.banned ? colors.success : colors.textMuted}
        />
      </Pressable>
    </View>
  );

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="lock-outline" size={48} color={colors.textMuted} />
          <Text style={styles.accessDenied}>Access Restricted</Text>
          <Text style={styles.accessDeniedSub}>This area is for superadmins only.</Text>
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
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>User Management</Text>
            <Text style={styles.headerSubtitle}>{users.length} total accounts</Text>
          </View>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push("/admin/create-user")}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Create MR</Text>
          </Pressable>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadUsers}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          ) : null}
        </View>

        {isLoading && !isRefreshing ? (
          <View style={styles.listContent}>
            {Array.from({ length: 6 }).map((_, index) => (
              <ListRowSkeleton key={index} />
            ))}
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderUser}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => { setIsRefreshing(true); loadUsers(); }}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="account-group-outline" size={48} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>No users found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery ? "Try a different search" : "Create an MR account to get started"}
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
  createButton: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
  },
  createButtonText: { fontSize: 13, fontWeight: "500", color: "#FFFFFF" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
    fontWeight: "400",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  listContent: { paddingBottom: 24, gap: 10 },
  userCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 10, borderWidth: 1,
    borderColor: colors.border, padding: 12, gap: 12,
  },
  userCardBanned: { opacity: 0.6 },
  userAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  userAvatarText: { fontSize: 18, fontWeight: "500", color: colors.text },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  userName: { fontSize: 14, fontWeight: "500", color: colors.text, flex: 1 },
  rolePill: {
    borderWidth: 1, borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  roleText: { fontSize: 10, fontWeight: "500" },
  userEmail: { fontSize: 12, fontWeight: "400", color: colors.textMuted },
  bannedLabel: { fontSize: 11, fontWeight: "400", color: colors.danger, marginTop: 2 },
  banButton: { padding: 4 },
  accessDenied: { fontSize: 18, fontWeight: "500", color: colors.text, marginTop: 12 },
  accessDeniedSub: { fontSize: 13, fontWeight: "400", color: colors.textMuted, marginTop: 4 },
  emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "500", color: colors.text, marginTop: 12, marginBottom: 4 },
  emptySubtitle: { fontSize: 13, fontWeight: "400", color: colors.textMuted },
});

