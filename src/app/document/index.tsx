import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
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
import { documentService } from "../../services/documentService";
import { colors } from "../../theme/colors";
import { DocumentItem } from "../../types/document";
import { API_BASE_URL } from "../../config/api";
import { DocumentRowSkeleton } from "../../components/Skeleton";

export default function DocumentListScreen() {
  const { isSuperAdmin } = useAuth();
  const { gutter, contentMaxWidth } = useResponsive();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await documentService.getDocuments({ search: searchQuery });
      setDocuments(res.documents || []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [loadDocuments])
  );

  const handleOpenDoc = (url: string) => {
    if (!url) return;
    const fullUrl = url.startsWith("http")
      ? url
      : `${API_BASE_URL}${url.replace(/^\/api\/backend/, "")}`;
    Linking.openURL(fullUrl).catch(() => {});
  };

  const renderItem = ({ item }: { item: DocumentItem }) => {
    const formattedDate = new Date(item.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const isPdf = item.name.toLowerCase().endsWith(".pdf");
    const isImage = /\.(jpe?g|png|webp)$/i.test(item.name);

    if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="lock-outline" size={48} color={colors.textMuted} />
          <Text style={styles.accessDenied}>Access Restricted</Text>
          <Text style={styles.accessDeniedSub}>Only administrators can view the full document library.</Text>
          <Pressable style={styles.backLink} onPress={() => router.back()}>
            <Text style={styles.backLinkText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
      <Pressable
        style={styles.docCard}
        onPress={() => handleOpenDoc(item.url)}
      >
        <View style={styles.docIconWrap}>
          <MaterialCommunityIcons
            name={isPdf ? "file-pdf-box" : isImage ? "file-image-outline" : "file-document-outline"}
            size={28}
            color={isPdf ? "#DC2626" : colors.primary}
          />
        </View>

        <View style={styles.docContent}>
          <Text style={styles.docName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.docMetaRow}>
            {item.order && (
              <Text style={styles.docOrderBadge}>
                {item.order.orderNo}
              </Text>
            )}
            <Text style={styles.docDate}>{formattedDate}</Text>
          </View>
          {item.createdByUser && (
            <Text style={styles.docAuthor}>
              By {item.createdByUser.name}
            </Text>
          )}
        </View>

        <MaterialCommunityIcons
          name="open-in-new"
          size={18}
          color={colors.textMuted}
        />
      </Pressable>
    );
  };

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
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.text}
            />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Document Library</Text>
            <Text style={styles.headerSubtitle}>
              Invoices, prescriptions & licenses
            </Text>
          </View>
          <Pressable
            style={styles.uploadHeaderButton}
            onPress={() => router.push("/document/upload")}
          >
            <MaterialCommunityIcons
              name="plus"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.uploadHeaderText}>Upload</Text>
          </Pressable>
        </View>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color="#9CA3AF"
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={loadDocuments}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <MaterialCommunityIcons
                name="close-circle"
                size={18}
                color="#9CA3AF"
              />
            </Pressable>
          ) : null}
        </View>

        {/* List */}
        {isLoading && !isRefreshing ? (
          <View style={styles.listContent}>
            {Array.from({ length: 6 }).map((_, index) => (
              <DocumentRowSkeleton key={index} />
            ))}
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={() => {
                  setIsRefreshing(true);
                  loadDocuments();
                }}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons
                  name="file-document-outline"
                  size={48}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyTitle}>No documents found</Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? "Try a different search term"
                    : "No documents have been uploaded yet"}
                </Text>
                <Pressable
                  style={styles.emptyUploadBtn}
                  onPress={() => router.push("/document/upload")}
                >
                  <Text style={styles.emptyUploadBtnText}>Upload First Document</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "500",
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted,
    marginTop: 2,
  },
  uploadHeaderButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  uploadHeaderText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#FFFFFF",
  },
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 24,
    gap: 10,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    gap: 12,
  },
  docIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  docContent: {
    flex: 1,
  },
  docName: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 2,
  },
  docMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  docOrderBadge: {
    fontSize: 11,
    fontWeight: "500",
    color: colors.primary,
    backgroundColor: colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  docDate: {
    fontSize: 12,
    fontWeight: "400",
    color: colors.textMuted,
  },
  docAuthor: {
    fontSize: 11,
    fontWeight: "300",
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    fontWeight: "400",
    color: colors.textMuted,
    marginBottom: 16,
  },
  emptyUploadBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.surface,
  },
  emptyUploadBtnText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.primary,
  },
  accessDenied: {
    fontSize: 18,
    fontWeight: "500",
    color: colors.text,
    marginTop: 16,
  },
  accessDeniedSub: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  backLink: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
  },
});