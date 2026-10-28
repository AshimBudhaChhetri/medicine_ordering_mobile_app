export type OrderStatus = "pending" | "approved" | "rejected";

export interface OrderItemInput {
  productName: string;
  quantity: number;
  bonus: number;
  rate: number;
  productId?: string;
}

export interface CreateOrderInput {
  stockistId: string;
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
  stockist: {
    id: string;
    name: string;
    location: string;
  };
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

