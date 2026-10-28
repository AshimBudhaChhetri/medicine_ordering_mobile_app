export type NotificationType =
  | "ORDER_CREATED"
  | "ORDER_APPROVED"
  | "ORDER_REJECTED"
  | "REGISTRATION_CREATED"
  | "REGISTRATION_APPROVED"
  | "PRODUCT_CREATED"
  | "PRODUCT_UPDATED"
  | "PRODUCT_TYPE_CREATED"
  | "PRODUCT_TYPE_UPDATED";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  unread?: boolean;
}

