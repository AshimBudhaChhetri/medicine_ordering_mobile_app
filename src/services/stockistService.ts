import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import { CreateStockistInput, Stockist } from "../types/stockist";

export const stockistService = {
  /**
   * Fetch approved stockists from backend.
   */
  async getStockists(): Promise<Stockist[]> {
    const res = await apiRequest<any>(API_ENDPOINTS.stockists.list, {
      method: "GET",
    });

    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.stockists)) return res.stockists;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  /**
   * Fetch a single stockist by ID.
   */
  async getStockist(id: string): Promise<Stockist> {
    return apiRequest<Stockist>(API_ENDPOINTS.stockists.details(id), {
      method: "GET",
    });
  },

  /**
   * Add a new stockist (created directly without requiring approval for MRs).
   */
  async createStockist(input: CreateStockistInput): Promise<Stockist> {
    return apiRequest<Stockist>(API_ENDPOINTS.stockists.create, {
      method: "POST",
      body: {
        name: input.name.trim(),
        location: input.location.trim(),
      },
    });
  },
};
