import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as DocumentPicker from "expo-document-picker";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
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

import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import { TimelineSkeleton } from "./Skeleton";
import { documentService } from "../services/documentService";
import { orderService } from "../services/orderService";
import { colors } from "../theme/colors";
import {
  OrderTimelineAuthor,
  OrderTimelineDocument,
  OrderTimelineItem,
  OrderTimelineRemark,
  OrderTimelineRemarkItem,
} from "../types/order";

type Props = {
  visible: boolean;
  orderId: string;
  orderNo: string;
  onClose: () => void;
};

function initials(name?: string) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return (
    parts[0].slice(0, 1) + parts[parts.length - 1].slice(0, 1)
  ).toUpperCase();
}

const AVATAR_COLORS = [
  "#3B82F6",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#F43F5E",
  "#06B6D4",
  "#6366F1",
  "#F97316",
];

function avatarColor(name?: string) {
  let hash = 0;
  const value = name ?? "";
  for (let i = 0; i < value.length; i += 1) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatWhen(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  })} · ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function resolveDocUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url.replace(/^\/api\/backend/, "")}`;
}

function Avatar({ author }: { author?: OrderTimelineAuthor }) {
  if (author?.image) {
    return (
      <Image source={{ uri: author.image }} style={styles.avatarImage} />
    );
  }

  return (
    <View
      style={[
        styles.avatarFallback,
        { backgroundColor: avatarColor(author?.name) },
      ]}
    >
      <Text style={styles.avatarInitials}>{initials(author?.name)}</Text>
    </View>
  );
}

function DocumentChip({ doc }: { doc: OrderTimelineDocument }) {
  if (doc.deletedAt) {
    return (
      <View style={styles.deletedDocChip}>
        <MaterialCommunityIcons
          name="file-remove-outline"
          size={15}
          color={colors.textMuted}
        />
        <Text style={styles.deletedDocText}>deleted document</Text>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.docChip}
      onPress={() => Linking.openURL(resolveDocUrl(doc.url)).catch(() => {})}
    >
      <MaterialCommunityIcons
        name="file-document-outline"
        size={15}
        color={colors.primary}
      />
      <Text style={styles.docChipName} numberOfLines={1}>
        {doc.name}
      </Text>
      <MaterialCommunityIcons
        name="open-in-new"
        size={13}
        color={colors.textMuted}
      />
    </Pressable>
  );
}

export function OrderReviewSheet({ visible, orderId, orderNo, onClose }: Props) {
  const { user, isSuperAdmin } = useAuth();

  const [items, setItems] = useState<OrderTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const [comment, setComment] = useState("");
  const [stagedFiles, setStagedFiles] = useState<
    DocumentPicker.DocumentPickerAsset[]
  >([]);
  const [replyTo, setReplyTo] = useState<OrderTimelineRemark | null>(null);

  const loadTimeline = useCallback(async () => {
    if (!orderId) return;

    try {
      setIsLoading(true);
      setLoadError(null);
      const timeline = await orderService.getOrderTimeline(orderId);
      setItems(timeline);
    } catch {
      try {
        const remarks = await orderService.getOrderRemarks(orderId);
        setItems(
          remarks.map((remark) => ({
            ...remark,
            kind: "remark" as const,
            replies: remark.replies ?? [],
          }))
        );
      } catch (err: any) {
        setLoadError(err?.message || "Could not load the review timeline.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (visible && orderId) {
      loadTimeline();
    }
  }, [visible, orderId, loadTimeline]);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!result.canceled && result.assets?.length) {
        setStagedFiles((prev) => [...prev, ...result.assets]);
      }
    } catch (err: any) {
      Alert.alert("Picker Error", err?.message || "Failed to select document");
    }
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const trimmed = comment.trim();
    const hasFiles = stagedFiles.length > 0;
    if (!trimmed && !hasFiles) return;

    try {
      setIsSending(true);

      if (hasFiles && !trimmed) {
        for (const file of stagedFiles) {
          await documentService.uploadDocument({
            uri: file.uri,
            name: file.name,
            mimeType: file.mimeType ?? undefined,
            orderId,
          });
        }
      } else {
        const documentIds: string[] = [];

        for (const file of stagedFiles) {
          const doc = await documentService.uploadDocument({
            uri: file.uri,
            name: file.name,
            mimeType: file.mimeType ?? undefined,
            orderId,
          });
          if (doc?.id) documentIds.push(doc.id);
        }

        await orderService.addOrderRemark(orderId, {
          content: trimmed,
          ...(replyTo ? { repliedToId: replyTo.id } : {}),
          ...(documentIds.length > 0 ? { documentIds } : {}),
        });
      }

      setComment("");
      setStagedFiles([]);
      setReplyTo(null);
      await loadTimeline();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Could not post your comment.");
    } finally {
      setIsSending(false);
    }
  };

  const canSubmit =
    !isSending && (comment.trim().length > 0 || stagedFiles.length > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialCommunityIcons
                name="message-text-outline"
                size={20}
                color={colors.primary}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Review</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                Comments & timeline · {orderNo}
              </Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="close"
                size={22}
                color={colors.text}
              />
            </Pressable>
          </View>

          {/* Composer */}
          <View style={styles.composer}>
            {replyTo && (
              <View style={styles.replyBanner}>
                <MaterialCommunityIcons
                  name="reply"
                  size={15}
                  color={colors.primary}
                />
                <Text style={styles.replyBannerText} numberOfLines={1}>
                  Replying to {replyTo.author?.name ?? "comment"}
                </Text>
                <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
                  <MaterialCommunityIcons
                    name="close"
                    size={16}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            )}

            {stagedFiles.length > 0 && (
              <View style={styles.stagedRow}>
                {stagedFiles.map((file, index) => (
                  <View key={`${file.uri}-${index}`} style={styles.stagedChip}>
                    <MaterialCommunityIcons
                      name="paperclip"
                      size={13}
                      color={colors.textMuted}
                    />
                    <Text style={styles.stagedChipName} numberOfLines={1}>
                      {file.name}
                    </Text>
                    <Pressable
                      onPress={() => removeStagedFile(index)}
                      hitSlop={6}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        size={14}
                        color={colors.textSecondary}
                      />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            <TextInput
              style={styles.composerInput}
              placeholder={replyTo ? "Write a reply..." : "Add a comment..."}
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
            />

            <View style={styles.composerToolbar}>
              <Pressable
                style={styles.attachButton}
                onPress={pickFiles}
                disabled={isSending}
                hitSlop={6}
              >
                <MaterialCommunityIcons
                  name="paperclip"
                  size={19}
                  color={colors.textSecondary}
                />
              </Pressable>

              <Pressable
                style={[
                  styles.sendButton,
                  !canSubmit && styles.sendButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialCommunityIcons
                      name="send"
                      size={15}
                      color="#FFFFFF"
                    />
                    <Text style={styles.sendButtonText}>
                      {stagedFiles.length > 0 && !comment.trim()
                        ? "Attach"
                        : replyTo
                          ? "Reply"
                          : "Comment"}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Timeline */}
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.timelineContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <TimelineSkeleton rows={4} />
            ) : loadError ? (
              <View style={styles.timelineState}>
                <MaterialCommunityIcons
                  name="alert-circle-outline"
                  size={30}
                  color={colors.danger}
                />
                <Text style={styles.timelineStateText}>{loadError}</Text>
                <Pressable style={styles.retryButton} onPress={loadTimeline}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>
              </View>
            ) : items.length === 0 ? (
              <View style={styles.timelineState}>
                <MaterialCommunityIcons
                  name="message-outline"
                  size={34}
                  color={colors.textMuted}
                />
                <Text style={styles.timelineStateText}>
                  No comments or documents yet.
                </Text>
              </View>
            ) : (
              items.map((item) => {
                if (item.kind === "remark") {
                  if (
                    item.isRejectionReason &&
                    !item.content.trim()
                  ) {
                    return (
                      <EventRow
                        key={item.id}
                        author={item.author}
                        createdAt={item.createdAt}
                        verb="rejected the order"
                        label="Order rejected"
                        tone="red"
                      />
                    );
                  }

                  return (
                    <RemarkItem
                      key={item.id}
                      item={item}
                      currentUserId={user?.id}
                      isSuperAdmin={isSuperAdmin}
                      onReply={() => setReplyTo(item)}
                      onChanged={loadTimeline}
                    />
                  );
                }

                if (item.kind === "approval") {
                  return (
                    <EventRow
                      key={item.id}
                      author={item.author}
                      createdAt={item.createdAt}
                      verb="approved the order"
                      label="Order approved"
                      tone="green"
                    />
                  );
                }

                return (
                  <DocumentUploadRow key={item.id} item={item} />
                );
              })
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function RemarkItem({
  item,
  currentUserId,
  isSuperAdmin,
  onReply,
  onChanged,
}: {
  item: OrderTimelineRemarkItem;
  currentUserId?: string;
  isSuperAdmin: boolean;
  onReply: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [isSaving, setIsSaving] = useState(false);

  const isDeleted = Boolean(item.deletedAt);
  const isAuthor = Boolean(currentUserId && item.author?.id === currentUserId);
  const canEdit = !isDeleted && (isAuthor || isSuperAdmin);
  const isEdited =
    !isDeleted &&
    Boolean(item.updatedAt && item.createdAt) &&
    new Date(item.updatedAt).getTime() -
      new Date(item.createdAt).getTime() >
      1000;

  const docs = item.documents ?? [];
  const hasFiles = !isDeleted && docs.length > 0;

  const headerLabel = isDeleted
    ? "deleted a message"
    : item.isRejectionReason
      ? "rejected the order"
      : hasFiles
        ? "left a comment and files"
        : "left a comment";

  const saveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === item.content) {
      setEditing(false);
      setEditContent(item.content);
      return;
    }

    try {
      setIsSaving(true);
      await orderService.updateOrderRemark(item.id, trimmed);
      setEditing(false);
      onChanged();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message || "Could not update the comment."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete comment",
      "Delete this comment? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await orderService.deleteOrderRemark(item.id);
              onChanged();
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.message || "Could not delete the comment."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.threadRow}>
      <View style={styles.avatarColumn}>
        <Avatar author={item.author} />
        {(item.replies?.length ?? 0) > 0 && <View style={styles.threadLine} />}
      </View>

      <View style={styles.threadContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {item.author?.name ?? "User"}
            </Text>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {headerLabel}
            </Text>
          </View>
          <Text style={styles.itemTime}>{formatWhen(item.createdAt)}</Text>
        </View>

        {isDeleted ? (
          <View style={styles.deletedBubble}>
            <MaterialCommunityIcons
              name="message-off-outline"
              size={15}
              color={colors.textMuted}
            />
            <Text style={styles.deletedBubbleText}>deleted message</Text>
          </View>
        ) : editing ? (
          <View style={styles.editBox}>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <Pressable
                onPress={() => {
                  setEditing(false);
                  setEditContent(item.content);
                }}
                disabled={isSaving}
              >
                <Text style={styles.editCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.editSaveButton}
                onPress={saveEdit}
                disabled={isSaving || !editContent.trim()}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.editSaveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View>
            <View
              style={[
                styles.bubble,
                item.isRejectionReason && styles.rejectionBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  item.isRejectionReason && styles.rejectionBubbleText,
                ]}
              >
                {item.content}
              </Text>

              {hasFiles && (
                <View style={styles.docList}>
                  {docs.map((doc) => (
                    <DocumentChip key={doc.id} doc={doc} />
                  ))}
                </View>
              )}
            </View>

            {isEdited && (
              <Text style={styles.editedLabel}>(edited)</Text>
            )}

            <View style={styles.remarkActions}>
              <Pressable style={styles.remarkAction} onPress={onReply}>
                <MaterialCommunityIcons
                  name="reply-outline"
                  size={15}
                  color={colors.textSecondary}
                />
                <Text style={styles.remarkActionText}>Reply</Text>
              </Pressable>

              {canEdit && (
                <Pressable
                  style={styles.remarkAction}
                  onPress={() => {
                    setEditContent(item.content);
                    setEditing(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={15}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.remarkActionText}>Edit</Text>
                </Pressable>
              )}

              {canEdit && (
                <Pressable style={styles.remarkAction} onPress={confirmDelete}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={15}
                    color={colors.danger}
                  />
                  <Text
                    style={[
                      styles.remarkActionText,
                      { color: colors.danger },
                    ]}
                  >
                    Delete
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {(item.replies?.length ?? 0) > 0 && (
          <View style={styles.replies}>
            {item.replies.map((reply) => (
              <ReplyItem
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                isSuperAdmin={isSuperAdmin}
                onChanged={onChanged}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

function ReplyItem({
  reply,
  currentUserId,
  isSuperAdmin,
  onChanged,
}: {
  reply: OrderTimelineRemark;
  currentUserId?: string;
  isSuperAdmin: boolean;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(reply.content);

  const isDeleted = Boolean(reply.deletedAt);
  const isAuthor = Boolean(currentUserId && reply.author?.id === currentUserId);
  const canEdit = !isDeleted && (isAuthor || isSuperAdmin);
  const hasFiles = !isDeleted && (reply.documents?.length ?? 0) > 0;

  const saveEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed || trimmed === reply.content) {
      setEditing(false);
      setEditContent(reply.content);
      return;
    }

    try {
      await orderService.updateOrderRemark(reply.id, trimmed);
      setEditing(false);
      onChanged();
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message || "Could not update the reply."
      );
    }
  };

  const confirmDelete = () => {
    Alert.alert("Delete reply", "Delete this reply?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await orderService.deleteOrderRemark(reply.id);
            onChanged();
          } catch (err: any) {
            Alert.alert(
              "Error",
              err?.message || "Could not delete the reply."
            );
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.replyRow}>
      <Avatar author={reply.author} />
      <View style={styles.replyContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.authorName} numberOfLines={1}>
            {reply.author?.name ?? "User"}
          </Text>
          <Text style={styles.itemTime}>{formatWhen(reply.createdAt)}</Text>
        </View>

        {isDeleted ? (
          <View style={styles.deletedBubble}>
            <MaterialCommunityIcons
              name="message-off-outline"
              size={14}
              color={colors.textMuted}
            />
            <Text style={styles.deletedBubbleText}>deleted message</Text>
          </View>
        ) : editing ? (
          <View style={styles.editBox}>
            <TextInput
              style={styles.editInput}
              value={editContent}
              onChangeText={setEditContent}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <Pressable
                onPress={() => {
                  setEditing(false);
                  setEditContent(reply.content);
                }}
              >
                <Text style={styles.editCancel}>Cancel</Text>
              </Pressable>
              <Pressable
                style={styles.editSaveButton}
                onPress={saveEdit}
                disabled={!editContent.trim()}
              >
                <Text style={styles.editSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View>
            <View
              style={[
                styles.bubble,
                reply.isRejectionReason && styles.rejectionBubble,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  reply.isRejectionReason && styles.rejectionBubbleText,
                ]}
              >
                {reply.content}
              </Text>

              {hasFiles && (
                <View style={styles.docList}>
                  {reply.documents.map((doc) => (
                    <DocumentChip key={doc.id} doc={doc} />
                  ))}
                </View>
              )}
            </View>

            {canEdit && (
              <View style={styles.remarkActions}>
                <Pressable
                  style={styles.remarkAction}
                  onPress={() => {
                    setEditContent(reply.content);
                    setEditing(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="pencil-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                  <Text style={styles.remarkActionText}>Edit</Text>
                </Pressable>
                <Pressable style={styles.remarkAction} onPress={confirmDelete}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={14}
                    color={colors.danger}
                  />
                  <Text
                    style={[
                      styles.remarkActionText,
                      { color: colors.danger },
                    ]}
                  >
                    Delete
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

function EventRow({
  author,
  createdAt,
  verb,
  label,
  tone,
}: {
  author?: OrderTimelineAuthor;
  createdAt: string;
  verb: string;
  label: string;
  tone: "green" | "red";
}) {
  const isApproval = tone === "green";

  return (
    <View style={styles.eventRow}>
      <Avatar author={author} />
      <View style={styles.eventContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {author?.name ?? "User"}
            </Text>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {verb}
            </Text>
          </View>
          <Text style={styles.itemTime}>{formatWhen(createdAt)}</Text>
        </View>

        <View
          style={[
            styles.eventPill,
            isApproval ? styles.eventPillGreen : styles.eventPillRed,
          ]}
        >
          <MaterialCommunityIcons
            name={isApproval ? "check-circle-outline" : "close-circle-outline"}
            size={15}
            color={isApproval ? colors.success : colors.danger}
          />
          <Text
            style={[
              styles.eventPillText,
              { color: isApproval ? colors.success : colors.danger },
            ]}
          >
            {label}
          </Text>
        </View>
      </View>
    </View>
  );
}

function DocumentUploadRow({
  item,
}: {
  item: Extract<OrderTimelineItem, { kind: "document_upload" }>;
}) {
  const activeDocs = item.documents.filter((doc) => !doc.deletedAt);
  const allDeleted = item.documents.length > 0 && activeDocs.length === 0;
  const label = allDeleted
    ? "deleted a document"
    : activeDocs.length === 1
      ? "uploaded a document"
      : `uploaded ${activeDocs.length} documents`;

  return (
    <View style={styles.eventRow}>
      <Avatar author={item.author} />
      <View style={styles.eventContent}>
        <View style={styles.itemHeader}>
          <View style={styles.itemHeaderText}>
            <Text style={styles.authorName} numberOfLines={1}>
              {item.author?.name ?? "User"}
            </Text>
            <Text style={styles.actionLabel} numberOfLines={1}>
              {label}
            </Text>
          </View>
          <Text style={styles.itemTime}>{formatWhen(item.createdAt)}</Text>
        </View>

        <View style={styles.docList}>
          {item.documents.map((doc) => (
            <DocumentChip key={doc.id} doc={doc} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  headerIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  composer: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 8,
  },
  replyBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "500",
    color: colors.primary,
  },
  stagedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 8,
  },
  stagedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    maxWidth: 200,
  },
  stagedChipName: {
    flexShrink: 1,
    fontSize: 11,
    color: colors.text,
  },
  composerInput: {
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: "top",
  },
  composerToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 9,
    paddingHorizontal: 14,
    height: 36,
    minWidth: 96,
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  timelineContent: {
    padding: 16,
    gap: 18,
    paddingBottom: 40,
  },
  timelineState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    gap: 10,
  },
  timelineStateText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  retryButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  threadRow: {
    flexDirection: "row",
    gap: 10,
  },
  avatarColumn: {
    alignItems: "center",
    width: 34,
  },
  avatarImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  threadLine: {
    width: 1,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: 6,
  },
  threadContent: {
    flex: 1,
    minWidth: 0,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  itemHeaderText: {
    flex: 1,
    flexDirection: "row",
    alignItems: "baseline",
    flexWrap: "wrap",
    gap: 5,
  },
  authorName: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
    flexShrink: 1,
  },
  actionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  itemTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },
  rejectionBubble: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#FECACA",
  },
  rejectionBubbleText: {
    color: "#991B1B",
  },
  docList: {
    marginTop: 8,
    gap: 6,
  },
  docChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  docChipName: {
    flexShrink: 1,
    fontSize: 11,
    color: colors.text,
  },
  deletedDocChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    alignSelf: "flex-start",
  },
  deletedDocText: {
    fontSize: 11,
    fontStyle: "italic",
    color: colors.textMuted,
  },
  editedLabel: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "right",
    marginTop: 2,
  },
  remarkActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 6,
    paddingLeft: 2,
  },
  remarkAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  remarkActionText: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  deletedBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  deletedBubbleText: {
    fontSize: 12,
    fontStyle: "italic",
    color: colors.textMuted,
  },
  editBox: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    overflow: "hidden",
  },
  editInput: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.text,
    textAlignVertical: "top",
  },
  editActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 12,
    paddingBottom: 9,
  },
  editCancel: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  editSaveButton: {
    backgroundColor: colors.primary,
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minWidth: 54,
    alignItems: "center",
  },
  editSaveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  replies: {
    marginTop: 12,
    gap: 12,
    paddingLeft: 4,
  },
  replyRow: {
    flexDirection: "row",
    gap: 8,
  },
  replyContent: {
    flex: 1,
    minWidth: 0,
  },
  eventRow: {
    flexDirection: "row",
    gap: 10,
  },
  eventContent: {
    flex: 1,
    minWidth: 0,
  },
  eventPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  eventPillGreen: {
    backgroundColor: colors.successSoft,
    borderColor: "#BBF7D0",
  },
  eventPillRed: {
    backgroundColor: colors.dangerSoft,
    borderColor: "#FECACA",
  },
  eventPillText: {
    fontSize: 12,
    fontWeight: "500",
  },
});
