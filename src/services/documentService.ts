import { Platform } from "react-native";
import { File } from "expo-file-system";
import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  DocumentItem,
  DocumentListResponse,
  UploadDocumentParams,
} from "../types/document";

export const documentService = {
  async getDocuments(params?: {
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<DocumentListResponse> {
    const query = new URLSearchParams();
    if (params?.search) query.append("search", params.search);
    if (params?.page) query.append("page", String(params.page));
    if (params?.limit) query.append("limit", String(params.limit));

    const qs = query.toString();
    const url = `${API_ENDPOINTS.documents.list}${qs ? `?${qs}` : ""}`;
    return apiRequest<DocumentListResponse>(url);
  },

  async getOrderDocuments(orderId: string): Promise<DocumentItem[]> {
    return apiRequest<DocumentItem[]>(API_ENDPOINTS.documents.byOrder(orderId));
  },

  async uploadDocument(params: UploadDocumentParams): Promise<DocumentItem> {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const response = await fetch(params.uri);
      const blob = await response.blob();
      formData.append("file", blob, params.name || "document.pdf");
    } else {
      const file = new File(params.uri);
      const filePart = {
        name: params.name || file.name || "document.pdf",
        type: params.mimeType || file.type || "application/octet-stream",
        bytes: () => file.bytes(),
        uri: params.uri,
      };
      formData.append("file", filePart as any);
    }

    if (params.orderId) {
      formData.append("orderId", params.orderId);
    }

    return apiRequest<DocumentItem>(API_ENDPOINTS.documents.upload, {
      method: "POST",
      body: formData,
    });
  },
};

