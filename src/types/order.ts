export type OrderStatus = "pending" | "approved" | "rejected";

export type OrderType = "DEALER_ORDER" | "STOCKIST_TRANSFER";

export interface OrderItemInput {
  productName: string;
  quantity: number;
  bonus: number;
  rate: number;
  productId?: string;
}

export interface CreateOrderInput {
  orderType?: OrderType;
  /** Source stockist for a transfer, the ordering stockist otherwise. */
  stockistId: string;
  /** Destination stockist. Required for STOCKIST_TRANSFER only. */
  toStockistId?: string;
  items: OrderItemInput[];
}

export interface OrderItem {
  id: string;
  productName: string;
  productId: string | null;
  productType: string | null;
  quantity: number;
  bonus: number;
  rate: number;
  amount: number;
}

export interface OrderCreator {
  id: string;
  name: string;
  email: string;
  role: string | null;
  image: string | null;
}

export interface Order {
  id: string;
  orderNo: string;
  orderType: OrderType;
  stockist: {
    id: string;
    name: string;
    location: string;
  };
  toStockist: {
    id: string;
    name: string;
    location: string;
  } | null;
  items: OrderItem[];
  grandTotal: number;
  itemCount: number;
  totalQuantity: number;
  status: OrderStatus;
  createdBy: OrderCreator;
  branchId: string | null;
  approvedBy: OrderCreator | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderListResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderQueryParams {
  status?: OrderStatus;
  createdBy?: string;
  dateFrom?: string;
  dateTo?: string;
  minTotal?: number;
  maxTotal?: number;
  minProducts?: number;
  maxProducts?: number;
  typeId?: string;
  sort?: "createdAt" | "grandTotal" | "totalQuantity";
  direction?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/** Author of a remark, document or approval event. */
export interface OrderTimelineAuthor {
  id: string;
  name: string;
  email: string;
  role: string | null;
  image: string | null;
}

/** A document attached to a remark or uploaded standalone. */
export interface OrderTimelineDocument {
  id: string;
  name: string;
  url: string;
  deletedAt: string | null;
  createdAt: string;
  createdBy: OrderTimelineAuthor;
}

/** A comment on an order, optionally with documents and nested replies. */
export interface OrderTimelineRemark {
  id: string;
  content: string;
  orderId: string;
  repliedToId: string | null;
  author: OrderTimelineAuthor;
  documents: OrderTimelineDocument[];
  replies?: OrderTimelineRemark[];
  isRejectionReason: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderTimelineRemarkItem extends OrderTimelineRemark {
  kind: "remark";
  replies: OrderTimelineRemark[];
}

export interface OrderTimelineDocumentItem {
  id: string;
  kind: "document_upload";
  orderId: string;
  author: OrderTimelineAuthor;
  documents: OrderTimelineDocument[];
  createdAt: string;
}

export interface OrderTimelineApprovalItem {
  id: string;
  kind: "approval";
  orderId: string;
  author: OrderTimelineAuthor;
  createdAt: string;
}

export type OrderTimelineItem =
  | OrderTimelineRemarkItem
  | OrderTimelineDocumentItem
  | OrderTimelineApprovalItem;

export interface OrderRemarkInput {
  content: string;
  repliedToId?: string;
  documentIds?: string[];
}

