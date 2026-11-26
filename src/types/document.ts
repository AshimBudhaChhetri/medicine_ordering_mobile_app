export interface DocumentUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export interface DocumentOrder {
  id: string;
  orderNo: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  orderId?: string | null;
  createdBy: string;
  createdAt: string;
  createdByUser?: DocumentUser;
  order?: DocumentOrder | null;
}

export interface DocumentListResponse {
  documents: DocumentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UploadDocumentParams {
  uri: string;
  name: string;
  mimeType?: string;
  orderId?: string;
}

