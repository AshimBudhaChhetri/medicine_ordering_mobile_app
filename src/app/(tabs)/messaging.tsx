import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMediaUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { ChatConversation, chatService } from "../../services/chatService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  if (diffDays < 7) {
    return d.toLocaleDateString("en-GB", { weekday: "short" });
  }
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Conversation card ────────────────────────────────────────────────────────

function ConversationCard({ item, myId }: { item: ChatConversation; myId: string }) {
  const isGroup = item.type === "GROUP";

  // For direct convos, the counterpart name + avatar; for groups, the group title
  const displayName = isGroup
    ? (item.title ?? "Group Chat")
    : (item.counterpart?.name ?? "Chat");

  const avatarImage = isGroup
    ? null
    : getMediaUrl(item.counterpart?.image ?? null);

  const preview = item.lastMessagePreview ?? "No messages yet";
  const timeStr =
    item.lastMessageAt && item.lastMessageAt !== "1970-01-01T00:00:00.000Z"
      ? formatTime(item.lastMessageAt)
      : "";

  const hasUnread = item.unreadCount > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: "#F9FAFB" }]}
      onPress={() =>
        router.push({
          pathname: "/chat/[id]",
          params: { id: item.id, title: displayName },
        })
      }
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {avatarImage ? (
          <Image
            source={{ uri: avatarImage }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : isGroup ? (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialCommunityIcons name="account-group-outline" size={22} color="#2563EB" />
          </View>
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarInitials}>{getInitials(displayName)}</Text>
          </View>
        )}

        {/* Unread dot */}
        {hasUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.cardName, hasUnread && styles.cardNameUnread]} numberOfLines={1}>
            {displayName}
          </Text>
          {timeStr ? (
            <Text style={[styles.cardTime, hasUnread && styles.cardTimeUnread]}>
              {timeStr}
            </Text>
          ) : null}
        </View>
        <Text style={[styles.cardPreview, hasUnread && styles.cardPreviewUnread]} numberOfLines={1}>
          {preview}
        </Text>
      </View>

      {/* Unread badge */}
      {hasUnread && item.unreadCount > 1 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.unreadCount > 99 ? "99+" : item.unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MessagingScreen() {
  const { user, isMR } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const hasEnsuredSuperadminDM = useRef(false);

  /**
   * For MR accounts: ensure they always have an open DM with the superadmin.
   * The backend `POST /chat/conversations` with type=DIRECT is idempotent.
   */
  const ensureSuperadminDM = useCallback(async (): Promise<void> => {
    if (!isMR || hasEnsuredSuperadminDM.current) return;
    try {
      const users = await chatService.getChatUsers();
      const superadmin = users.find((u) => u.role === "superadmin");
      if (superadmin) {
        await chatService.openDirect(superadmin.id);
        hasEnsuredSuperadminDM.current = true;
      }
    } catch {
      // Non-fatal — the conversation list will still load
    }
  }, [isMR]);

  const load = useCallback(async () => {
    try {
      await ensureSuperadminDM();
      const data = await chatService.getConversations();
      setConversations(data ?? []);
    } catch {
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [ensureSuperadminDM]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const filtered = conversations.filter((c) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const name = (
      c.type === "GROUP"
        ? c.title ?? ""
        : c.counterpart?.name ?? ""
    ).toLowerCase();
    const preview = (c.lastMessagePreview ?? "").toLowerCase();
    return name.includes(q) || preview.includes(q);
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Messaging</Text>
        <View style={styles.searchBar}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} hitSlop={8}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="small" color="#000000" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationCard item={item} myId={user?.id ?? ""} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={["#2563EB"]} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="chat-outline" size={44} color="#E5E7EB" />
              <Text style={styles.emptyTitle}>No conversations</Text>
              <Text style={styles.emptySub}>
                {search
                  ? "No conversations match your search."
                  : "Your conversations will appear here."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 34,
    fontWeight: "500",
    color: "#000000",
    letterSpacing: -0.5,
    marginBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: "#000000",
    fontWeight: "400",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  separator: { height: 1, backgroundColor: "#F3F4F6", marginLeft: 72 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 56,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    fontWeight: "400",
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  /* Card */
  card: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  avatarWrap: { position: "relative", marginRight: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: { fontSize: 16, fontWeight: "500", color: "#2563EB" },
  unreadDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#2563EB",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  cardContent: { flex: 1 },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  cardName: {
    fontSize: 15,
    fontWeight: "400",
    color: "#111827",
    flex: 1,
    marginRight: 8,
  },
  cardNameUnread: { fontWeight: "500" },
  cardTime: { fontSize: 11, fontWeight: "400", color: "#9CA3AF" },
  cardTimeUnread: { color: "#2563EB" },
  cardPreview: { fontSize: 13, fontWeight: "300", color: "#9CA3AF" },
  cardPreviewUnread: { fontWeight: "400", color: "#6B7280" },
  badge: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    marginLeft: 8,
  },
  badgeText: { fontSize: 11, fontWeight: "500", color: "#FFFFFF" },
});
