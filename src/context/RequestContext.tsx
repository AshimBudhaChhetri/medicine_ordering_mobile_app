import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { orderService } from "../services/orderService";
import {
  CreateOrderInput,
  Order,
  OrderQueryParams,
  OrderStatus,
} from "../types/order";
import { useAuth } from "./AuthContext";

export type RequestStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED" | OrderStatus;

export type MedicineRequestItem = {
  medicineId: string;
  medicineName: string;
  quantity: number;
  bonus?: number;
  unitPrice: number;
  subtotal: number;
};

export interface MedicineRequestCompatibility {
  id: string;
  requestNumber: string;
  stockistId: string;
  stockistName: string;
  items: MedicineRequestItem[];
  totalItems: number;
  totalAmount: number;
  note?: string;
  status: RequestStatus;
  createdAt: string;
  rawOrder: Order;
}

export type RequestContextType = {
  orders: Order[];
  /** Alias mapped to UI-friendly format for backwards compatibility */
  requests: MedicineRequestCompatibility[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refreshOrders: (params?: OrderQueryParams) => Promise<void>;
  createOrder: (input: CreateOrderInput) => Promise<Order>;
  getOrderById: (id: string) => Promise<Order | undefined>;
  createRequest: (input: {
    stockistId: string;
    stockistName?: string;
    items: {
      medicineId?: string;
      medicineName: string;
      quantity: number;
      bonus?: number;
      unitPrice: number;
      subtotal?: number;
    }[];
    note?: string;
  }) => Promise<Order>;
};

const RequestContext = createContext<RequestContextType | undefined>(undefined);

function mapOrderToRequest(order: Order): MedicineRequestCompatibility {
  return {
    id: order.id,
    requestNumber: order.orderNo,
    stockistId: order.stockist?.id || "",
    stockistName: order.stockist?.name || "Unknown Stockist",
    items: order.items.map((item) => ({
      medicineId: item.productId || item.id,
      medicineName: item.productName,
      quantity: item.quantity,
      bonus: item.bonus,
      unitPrice: item.rate,
      subtotal: item.amount,
    })),
    totalItems: order.totalQuantity || order.itemCount || order.items.length,
    totalAmount: order.grandTotal,
    note: order.rejectionReason || undefined,
    status: order.status,
    createdAt: new Date(order.createdAt).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    rawOrder: order,
  };
}

export function RequestProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (params?: OrderQueryParams) => {
    if (!isAuthenticated) {
      setOrders([]);
      setTotal(0);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await orderService.getOrders(params);
      setOrders(res.orders || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.warn("Failed to load orders:", err);
      setError(err?.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setOrders([]);
      setTotal(0);
    }
  }, [isAuthenticated, fetchOrders]);

  const createOrder = async (input: CreateOrderInput): Promise<Order> => {
    const newOrder = await orderService.createOrder(input);
    setOrders((prev) => [newOrder, ...prev]);
    setTotal((prev) => prev + 1);
    return newOrder;
  };

  const getOrderById = async (id: string): Promise<Order | undefined> => {
    const existing = orders.find((o) => o.id === id);
    if (existing) {
      return existing;
    }
    try {
      const fetched = await orderService.getOrder(id);
      return fetched;
    } catch {
      return undefined;
    }
  };

  const createRequest = async (input: {
    stockistId: string;
    stockistName?: string;
    items: {
      medicineId?: string;
      medicineName: string;
      quantity: number;
      bonus?: number;
      unitPrice: number;
      subtotal?: number;
    }[];
    note?: string;
  }): Promise<Order> => {
    const payload: CreateOrderInput = {
      stockistId: input.stockistId,
      items: input.items.map((item) => ({
        productName: item.medicineName,
        quantity: item.quantity,
        bonus: item.bonus ?? 0,
        rate: item.unitPrice,
        productId: item.medicineId,
      })),
    };
    return createOrder(payload);
  };

  const requests = orders.map(mapOrderToRequest);

  return (
    <RequestContext.Provider
      value={{
        orders,
        requests,
        total,
        isLoading,
        error,
        refreshOrders: fetchOrders,
        createOrder,
        getOrderById,
        createRequest,
      }}
    >
      {children}
    </RequestContext.Provider>
  );
}

export function useRequests() {
  const context = useContext(RequestContext);
  if (!context) {
    throw new Error("useRequests must be used inside RequestProvider");
  }
  return context;
}
