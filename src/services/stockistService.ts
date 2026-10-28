import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import { CreateStockistInput, Stockist } from "../types/stockist";

export const stockistService = {
  /**
   * Fetch approved stockists.
   */
  async getStockists(): Promise<Stockist[]> {
    return apiRequest<Stockist[]>(API_ENDPOINTS.stockists.list, {
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

