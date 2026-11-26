import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import { DashboardStats } from "../types/dashboard";

export const dashboardService = {
  /**
   * Retrieve analytical summary statistics.
   * Total orders, pending orders, and approved revenue are scoped to the MR.
   */
  async getStats(): Promise<DashboardStats> {
    return apiRequest<DashboardStats>(API_ENDPOINTS.dashboard.stats, {
      method: "GET",
    });
  },
};

