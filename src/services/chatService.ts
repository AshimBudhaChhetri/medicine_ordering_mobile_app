import { apiRequest } from "../api/client";
import { API_BASE_URL } from "../config/api";

// ─── Types matching backend ChatConversationView / ChatMessageView ────────────

export interface ChatUserSummary {
  id: string;
  name: string;
  email?: string;
  image: string | null;
  role: string | null;
}

export interface ChatParticipantView {
  userId: string;
  name: string;
  image: string | null;
  role: string | null;
  isAdmin: boolean;
  unreadCount: number;
  lastReadAt: string | null;
}

export interface ChatAttachmentView {
  id: string;
  kind: "IMAGE" | "DOCUMENT";
  name: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface ChatMessageView {
  id: string;
  conversationId: string;
  senderId: string;
  sender: ChatUserSummary;
  body: string | null;
  clientId: string | null;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  attachments: ChatAttachmentView[];
  readBy: Array<{ userId: string; readAt: string }>;
}

export interface ChatMessagePage {
  messages: ChatMessageView[];
  hasMore: boolean;
  nextCursor: string | null;
}

/** Backend `ChatConversationView` */
export interface ChatConversation {
  id: string;
  type: "DIRECT" | "GROUP";
  /** Group title; null for direct conversations */
  title: string | null;
  createdById: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ChatParticipantView[];
  unreadCount: number;
  /** The other participant in a DIRECT thread; null for groups. */
  counterpart: ChatParticipantView | null;
}

export interface ChatUser {
  id: string;
  name: string;
  email: string;
  role: string;
  image: string | null;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const chatService = {
  /** List all conversations the current user is in. */
  async getConversations(): Promise<ChatConversation[]> {
    return apiRequest<ChatConversation[]>(`${API_BASE_URL}/chat/conversations`);
  },

  /** Get a single conversation by id. */
  async getConversation(id: string): Promise<ChatConversation> {
    return apiRequest<ChatConversation>(`${API_BASE_URL}/chat/conversations/${id}`);
  },

  /**
   * Open (or return the existing) DIRECT conversation with `userId`.
   * The backend upserts, so this is safe to call repeatedly.
   */
  async openDirect(userId: string): Promise<ChatConversation> {
    return apiRequest<ChatConversation>(`${API_BASE_URL}/chat/conversations`, {
      method: "POST",
      body: { type: "DIRECT", userId },
    });
  },

  /** Page through messages (newest first from backend, returned oldest-first here). */
  async getMessages(
    conversationId: string,
    limit = 30,
    cursor?: string
  ): Promise<ChatMessagePage> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    return apiRequest<ChatMessagePage>(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages?${params}`
    );
  },

  /**
   * Send a text message. Uses multipart/form-data because the endpoint
   * uses `FilesInterceptor`. We send no files here — text only.
   */
  async sendMessage(
    conversationId: string,
    body: string,
    clientId?: string
  ): Promise<ChatMessageView> {
    const form = new FormData();
    form.append("body", body);
    if (clientId) form.append("clientId", clientId);
    return apiRequest<ChatMessageView>(
      `${API_BASE_URL}/chat/conversations/${conversationId}/messages`,
      { method: "POST", body: form }
    );
  },

  /** Mark all incoming messages read up to (and including) the latest. */
  async markRead(conversationId: string, upToMessageId?: string): Promise<void> {
    await apiRequest(`${API_BASE_URL}/chat/conversations/${conversationId}/read`, {
      method: "POST",
      body: upToMessageId ? { upToMessageId } : {},
    });
  },

  /** People the current user may message. */
  async getChatUsers(search?: string): Promise<ChatUser[]> {
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    return apiRequest<ChatUser[]>(`${API_BASE_URL}/chat/users${params}`);
  },

  /** Total unread count across all conversations. */
  async getUnreadCount(): Promise<number> {
    const data = await apiRequest<{ count: number }>(
      `${API_BASE_URL}/chat/unread-count`
    );
    return data.count;
  },
};
