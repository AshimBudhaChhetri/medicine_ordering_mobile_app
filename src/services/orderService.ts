import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  CreateOrderInput,
  Order,
  OrderListResponse,
  OrderQueryParams,
} from "../types/order";

export const orderService = {
  /**
   * Fetch medicine orders with filtering, sorting, and pagination.
   */
  async getOrders(params?: OrderQueryParams): Promise<OrderListResponse> {
    const searchParams = new URLSearchParams();

    if (params?.status) {
      searchParams.append("status", params.status);
    }
    if (params?.page) {
      searchParams.append("page", String(params.page));
    }
    if (params?.limit) {
      searchParams.append("limit", String(params.limit));
    }
    if (params?.createdBy) {
      searchParams.append("createdBy", params.createdBy);
    }
    if (params?.dateFrom) {
      searchParams.append("dateFrom", params.dateFrom);
    }
    if (params?.dateTo) {
      searchParams.append("dateTo", params.dateTo);
    }
    if (params?.sort) {
      searchParams.append("sort", params.sort);
    }
    if (params?.direction) {
      searchParams.append("direction", params.direction);
    }
    if (params?.typeId) {
      searchParams.append("typeId", params.typeId);
    }

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.orders.list}?${query}`
      : API_ENDPOINTS.orders.list;

    return apiRequest<OrderListResponse>(url, {
      method: "GET",
    });
  },

  /**
   * Fetch single order details by UUID.
   */
  async getOrder(id: string): Promise<Order> {
    return apiRequest<Order>(API_ENDPOINTS.orders.details(id), {
      method: "GET",
    });
  },

  /**
   * Create a new medicine request order.
   */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    return apiRequest<Order>(API_ENDPOINTS.orders.create, {
      method: "POST",
      body: input,
    });
  },

  /**
   * Approve a pending order (Superadmin only).
   */
  async approveOrder(id: string): Promise<Order> {
    return apiRequest<Order>(API_ENDPOINTS.orders.approve(id), {
      method: "PATCH",
    });
  },

  /**
   * Reject a pending order (Superadmin only).
   */
  async rejectOrder(id: string, reason?: string): Promise<Order> {
    return apiRequest<Order>(API_ENDPOINTS.orders.reject(id), {
      method: "PATCH",
      body: reason ? { reason } : {},
    });
  },
};
