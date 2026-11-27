import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { API_BASE_URL } from "../config/api";
import { documentService } from "../services/documentService";
import { colors } from "../theme/colors";
import { DocumentItem } from "../types/document";

interface Props {
  visible: boolean;
  orderId: string | null;
  orderNo: string | null;
  onClose: () => void;
}

function resolveDocUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function OrderDocumentsModal({ visible, orderId, orderNo, onClose }: Props) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible || !orderId) return;
    setIsLoading(true);
    documentService
      .getOrderDocuments(orderId)
      .then((docs) => setDocuments(docs || []))
      .catch(() => setDocuments([]))
      .finally(() => setIsLoading(false));
  }, [visible, orderId]);

  const handleOpenDoc = (url: string) => {
    Linking.openURL(resolveDocUrl(url)).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={styles.dismissArea} onPress={onClose} />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetTitle}>Attached Documents</Text>
              <Text style={styles.sheetSubtitle}>Order: {orderNo}</Text>
            </View>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={20} color="#000000" />
            </Pressable>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#000000" />
              <Text style={styles.loadingText}>Loading documents…</Text>
            </View>
          ) : documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="file-document-outline" size={40} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No documents attached</Text>
            </View>
          ) : (
            <View style={styles.docList}>
              {documents.map((doc) => (
                <Pressable
                  key={doc.id}
                  style={styles.docRow}
                  onPress={() => handleOpenDoc(doc.url)}
                >
                  <View style={styles.docIconBox}>
                    <MaterialCommunityIcons name="file-document-outline" size={20} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.docName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={styles.docDate}>
                      {new Date(doc.createdAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="open-in-new" size={18} color="#9CA3AF" />
                </Pressable>
              ))}
            </View>
          )}

          <Pressable
            style={styles.uploadButton}
            onPress={() => {
              onClose();
              if (orderId && orderNo) {
                router.push({
                  pathname: "/document/upload",
                  params: { orderId, orderNo },
                });
              }
            }}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#000000" />
            <Text style={styles.uploadButtonText}>Attach New Document</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-end",
  },
  dismissArea: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: "80%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E5E7EB",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  sheetSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "#6B7280",
    marginTop: 2,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  docList: {
    paddingVertical: 8,
  },
  docRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  docIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  docName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
  docDate: {
    fontSize: 11,
    fontWeight: "400",
    color: "#9CA3AF",
    marginTop: 2,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    gap: 6,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
  },
});
