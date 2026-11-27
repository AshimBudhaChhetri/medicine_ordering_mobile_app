import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
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

import { useAuth } from "../../context/AuthContext";
import { useRequests } from "../../context/RequestContext";
import { useResponsive } from "../../hooks/useResponsive";
import { documentService } from "../../services/documentService";
import { colors } from "../../theme/colors";

export default function DocumentUploadScreen() {
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNo?: string;
  }>();

  const { isSuperAdmin } = useAuth();
  const { orders } = useRequests();
  const { gutter, contentMaxWidth } = useResponsive();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string>(params.orderId || "");
  const [isUploading, setIsUploading] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);

  const handlePickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        setSelectedFile(res.assets[0]);
      }
    } catch (err: any) {
      Alert.alert("Picker Error", err?.message || "Failed to select document");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert("Document Required", "Please choose a document to upload.");
      return;
    }

    if (!isSuperAdmin && !selectedOrderId) {
      Alert.alert(
        "Order Required",
        "Medical Representatives must link uploaded documents to an order."
      );
      return;
    }

    try {
      setIsUploading(true);
      await documentService.uploadDocument({
        uri: selectedFile.uri,
        name: selectedFile.name,
        mimeType: selectedFile.mimeType ?? undefined,
        orderId: selectedOrderId || undefined,
      });

      Alert.alert("Success", "Document uploaded successfully.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (err: any) {
      Alert.alert("Upload Failed", err?.message || "Could not upload document.");
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const selectedOrderObj = orders.find((o) => o.id === selectedOrderId);
  const orderDisplayLabel = selectedOrderObj
    ? `${selectedOrderObj.orderNo} - ${selectedOrderObj.stockist?.name || "Order"}`
    : params.orderNo
    ? `${params.orderNo}`
    : "Select Order (Optional for Superadmin)";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: gutter },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.innerContainer, { maxWidth: contentMaxWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              hitSlop={8}
            >
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={colors.text}
              />
            </Pressable>
            <View style={styles.headerTitleWrap}>
              <Text style={styles.headerTitle}>Upload Document</Text>
            </View>
          </View>

          {/* Document Picker Box */}
          <Pressable
            style={styles.pickerBox}
            onPress={handlePickDocument}
          >
            {selectedFile ? (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileIconWrap}>
                  <MaterialCommunityIcons
                    name="file-check-outline"
                    size={36}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.fileName} numberOfLines={2}>
                  {selectedFile.name}
                </Text>
                <Text style={styles.fileMeta}>
                  {formatFileSize(selectedFile.size)} • {selectedFile.mimeType || "Document"}
                </Text>
                <View style={styles.changePill}>
                  <Text style={styles.changePillText}>Tap to change file</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyPickerContainer}>
                <View style={styles.uploadIconWrap}>
                  <MaterialCommunityIcons
                    name="cloud-upload-outline"
                    size={42}
                    color={colors.primary}
                  />
                </View>
                <Text style={styles.pickerTitle}>Choose Document</Text>
                <Text style={styles.pickerSubtitle}>
                  Supports PDF, DOCX, XLSX, JPEG, PNG (max 20 MB)
                </Text>
                <View style={styles.browseButton}>
                  <Text style={styles.browseButtonText}>Browse Files</Text>
                </View>
              </View>
            )}
          </Pressable>

          {/* Link to Order Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionHeading}>Linked Order</Text>
            <Pressable
              style={styles.orderSelectBox}
              onPress={() => setShowOrderPicker(!showOrderPicker)}
            >
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={20}
                color={colors.text}
              />
              <Text
                style={[
                  styles.orderSelectText,
                  !selectedOrderId && styles.orderSelectPlaceholder,
                ]}
                numberOfLines={1}
              >
                {orderDisplayLabel}
              </Text>
              <MaterialCommunityIcons
                name={showOrderPicker ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>

            {/* Dropdown Options */}
            {showOrderPicker && (
              <View style={styles.orderDropdown}>
                {isSuperAdmin && (
                  <Pressable
                    style={[
                      styles.orderDropdownItem,
                      !selectedOrderId && styles.orderDropdownItemActive,
                    ]}
                    onPress={() => {
                      setSelectedOrderId("");
                      setShowOrderPicker(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.orderDropdownText,
                        !selectedOrderId && styles.orderDropdownTextActive,
                      ]}
                    >
                      None (General Library Document)
                    </Text>
                  </Pressable>
                )}

                {orders.length === 0 ? (
                  <View style={styles.orderDropdownEmpty}>
                    <Text style={styles.orderDropdownEmptyText}>
                      No active orders found.
                    </Text>
                  </View>
                ) : (
                  orders.slice(0, 15).map((order) => {
                    const isSelected = selectedOrderId === order.id;
                    return (
                      <Pressable
                        key={order.id}
                        style={[
                          styles.orderDropdownItem,
                          isSelected && styles.orderDropdownItemActive,
                        ]}
                        onPress={() => {
                          setSelectedOrderId(order.id);
                          setShowOrderPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.orderDropdownText,
                            isSelected && styles.orderDropdownTextActive,
                          ]}
                          numberOfLines={1}
                        >
                          {order.orderNo} • {order.stockist?.name || "Order"} (Rs. {order.grandTotal.toFixed(2)})
                        </Text>
                      </Pressable>
                    );
                  })
                )}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Pressable
              style={styles.cancelButton}
              onPress={() => router.back()}
              disabled={isUploading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={[
                styles.uploadButton,
                (!selectedFile || isUploading) && styles.uploadButtonDisabled,
              ]}
              onPress={handleUpload}
              disabled={!selectedFile || isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="cloud-upload"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.uploadButtonText}>Upload Document</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingVertical: 16,
  },
  innerContainer: {
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: 2,
  },
  pickerBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    borderStyle: "dashed",
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyPickerContainer: {
    alignItems: "center",
  },
  uploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  pickerSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 16,
    maxWidth: 260,
  },
  browseButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  browseButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  selectedFileContainer: {
    alignItems: "center",
    width: "100%",
  },
  fileIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    textAlign: "center",
    marginBottom: 4,
  },
  fileMeta: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted,
    marginBottom: 12,
  },
  changePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  changePillText: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.text,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted,
    marginBottom: 12,
  },
  orderSelectBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 8,
  },
  orderSelectText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: colors.text,
  },
  orderSelectPlaceholder: {
    color: colors.textMuted,
  },
  orderDropdown: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    maxHeight: 220,
  },
  orderDropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  orderDropdownItemActive: {
    backgroundColor: colors.surface,
  },
  orderDropdownText: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.text,
  },
  orderDropdownTextActive: {
    fontWeight: "500",
    color: colors.primary,
  },
  orderDropdownEmpty: {
    padding: 12,
    alignItems: "center",
  },
  orderDropdownEmptyText: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
  uploadButton: {
    flex: 2,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});

