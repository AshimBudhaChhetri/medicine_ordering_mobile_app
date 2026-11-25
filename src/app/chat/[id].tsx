import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getMediaUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { ChatMessageView, chatService } from "../../services/chatService";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMine,
  showSender,
}: {
  msg: ChatMessageView;
  isMine: boolean;
  showSender: boolean;
}) {
  const senderAvatar = getMediaUrl(msg.sender.image);

  return (
    <View style={[styles.bubbleRow, isMine && styles.bubbleRowMine]}>
      {/* Avatar (other side only) */}
      {!isMine && (
        <View style={styles.senderAvatarWrap}>
          {showSender ? (
            senderAvatar ? (
              <Image
                source={{ uri: senderAvatar }}
                style={styles.senderAvatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.senderAvatar, styles.senderAvatarPlaceholder]}>
                <Text style={styles.senderAvatarText}>
                  {getInitials(msg.sender.name)}
                </Text>
              </View>
            )
          ) : (
            <View style={styles.senderAvatar} />
          )}
        </View>
      )}

      <View style={[styles.bubbleCol, isMine && styles.bubbleColMine]}>
        {/* Sender name for group chats */}
        {!isMine && showSender && (
          <Text style={styles.senderName}>{msg.sender.name}</Text>
        )}

        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
          {msg.body ? (
            <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>
              {msg.body}
            </Text>
          ) : null}

          {msg.attachments.length > 0 && (
            <View style={styles.attachments}>
              {msg.attachments.map((att) => (
                <View key={att.id} style={styles.attachmentPill}>
                  <MaterialCommunityIcons
                    name={att.kind === "IMAGE" ? "image-outline" : "file-outline"}
                    size={14}
                    color="#6B7280"
                  />
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {att.name}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={[styles.msgTime, isMine && styles.msgTimeMine]}>
          {formatMessageTime(msg.createdAt)}
        </Text>
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 4000;

export default function ChatScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const { user } = useAuth();

  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const listRef = useRef<FlatList<ChatMessageView>>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestIdRef = useRef<string | null>(null);

  // ── Load page of messages ──────────────────────────────────────────────────
  const loadMessages = useCallback(async () => {
    if (!id) return;
    try {
      const page = await chatService.getMessages(id, 30);
      setMessages(page.messages);
      setHasMore(page.hasMore);
      setCursor(page.nextCursor ?? undefined);
      if (page.messages.length > 0) {
        latestIdRef.current = page.messages[page.messages.length - 1].id;
        // mark read
        void chatService.markRead(id, latestIdRef.current);
      }
    } catch {
      // keep existing state
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // ── Poll for new messages ──────────────────────────────────────────────────
  const pollNewMessages = useCallback(async () => {
    if (!id) return;
    try {
      // Fetch the latest page; compare the newest message
      const page = await chatService.getMessages(id, 30);
      const newest = page.messages[page.messages.length - 1];
      if (newest && newest.id !== latestIdRef.current) {
        setMessages(page.messages);
        latestIdRef.current = newest.id;
        void chatService.markRead(id, newest.id);
      }
    } catch {
      // silent
    }
  }, [id]);

  useEffect(() => {
    loadMessages();
    pollRef.current = setInterval(pollNewMessages, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadMessages, pollNewMessages]);

  // ── Load older messages ────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || !cursor || !id) return;
    setIsLoadingMore(true);
    try {
      const page = await chatService.getMessages(id, 30, cursor);
      setMessages((prev) => [...page.messages, ...prev]);
      setHasMore(page.hasMore);
      setCursor(page.nextCursor ?? undefined);
    } catch {
      // silent
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, isLoadingMore, cursor, id]);

  // ── Send ───────────────────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || isSending || !id) return;
    setDraft("");
    setIsSending(true);
    try {
      const clientId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const msg = await chatService.sendMessage(id, text, clientId);
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      latestIdRef.current = msg.id;
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setDraft(text); // restore on failure
    } finally {
      setIsSending(false);
    }
  }, [draft, isSending, id]);

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderMessage = useCallback(
    ({ item, index }: { item: ChatMessageView; index: number }) => {
      const isMine = item.senderId === user?.id;
      const prev = messages[index - 1];
      const showSender = !isMine && (!prev || prev.senderId !== item.senderId);
      return (
        <MessageBubble msg={item} isMine={isMine} showSender={showSender} />
      );
    },
    [messages, user?.id]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#000000" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title ?? "Chat"}
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* Message list */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#000000" />
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: false })
            }
            onStartReached={loadMore}
            onStartReachedThreshold={0.1}
            ListHeaderComponent={
              isLoadingMore ? (
                <View style={styles.loadMoreWrap}>
                  <ActivityIndicator size="small" color="#9CA3AF" />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.center}>
                <MaterialCommunityIcons
                  name="chat-outline"
                  size={40}
                  color="#E5E7EB"
                />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySub}>Send the first message!</Text>
              </View>
            }
          />
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={4000}
            returnKeyType="default"
          />
          <Pressable
            style={[styles.sendBtn, (!draft.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!draft.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#FFFFFF" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  backBtn: { marginRight: 12 },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "500",
    color: "#000000",
  },
  /* Messages */
  messageList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexGrow: 1,
    justifyContent: "flex-end",
  },
  loadMoreWrap: { paddingVertical: 10, alignItems: "center" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "500",
    color: "#000000",
  },
  emptySub: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "400",
    color: "#9CA3AF",
  },
  /* Bubble row */
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  bubbleRowMine: { justifyContent: "flex-end" },
  senderAvatarWrap: { marginRight: 8 },
  senderAvatar: { width: 32, height: 32, borderRadius: 16 },
  senderAvatarPlaceholder: {
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  senderAvatarText: { fontSize: 11, fontWeight: "500", color: "#2563EB" },
  bubbleCol: { maxWidth: "72%" },
  bubbleColMine: { alignItems: "flex-end" },
  senderName: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginBottom: 2,
    marginLeft: 2,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleTheirs: {
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderBottomLeftRadius: 4,
  },
  bubbleMine: {
    backgroundColor: "#2563EB",
    borderBottomRightRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#111827",
    lineHeight: 21,
  },
  bubbleTextMine: { color: "#FFFFFF" },
  /* Attachments */
  attachments: { marginTop: 6, gap: 4 },
  attachmentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  attachmentName: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
    flex: 1,
  },
  msgTime: {
    fontSize: 10,
    fontWeight: "300",
    color: "#9CA3AF",
    marginTop: 3,
    marginLeft: 2,
  },
  msgTimeMine: { marginLeft: 0, marginRight: 2 },
  /* Composer */
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    backgroundColor: "#FFFFFF",
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: 15,
    fontWeight: "400",
    color: "#000000",
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: { backgroundColor: "#BFDBFE" },
});
