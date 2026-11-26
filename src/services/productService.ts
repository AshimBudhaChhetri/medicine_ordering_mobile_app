import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  CatalogOptions,
  CreateProductInput,
  Product,
  ProductQueryParams,
} from "../types/product";

export const productService = {
  /**
   * Fetch catalogue products with optional filters.
   * Note: mrp, sales, and price arrive as strings (Prisma Decimals).
   */
  async getProducts(params?: ProductQueryParams): Promise<Product[]> {
    const searchParams = new URLSearchParams();
    if (params?.name) {
      searchParams.append("name", params.name);
    }
    if (params?.batch) {
      searchParams.append("batch", params.batch);
    }

    const query = searchParams.toString();
    const url = query
      ? `${API_ENDPOINTS.products.list}?${query}`
      : API_ENDPOINTS.products.list;

    const res = await apiRequest<any>(url, {
      method: "GET",
    });

    if (Array.isArray(res)) return res;
    if (Array.isArray(res?.products)) return res.products;
    if (Array.isArray(res?.data)) return res.data;
    return [];
  },

  /**
   * Fetch catalog units and types for filters or selectors.
   */
  async getCatalogOptions(): Promise<CatalogOptions> {
    return apiRequest<CatalogOptions>(
      API_ENDPOINTS.catalog.options,
      {
        method: "GET",
      }
    );
  },

  /**
   * Add a new product to the catalogue.
   */
  async createProduct(input: CreateProductInput): Promise<Product> {
    return apiRequest<Product>(API_ENDPOINTS.products.create, {
      method: "POST",
      body: input,
    });
  },
};
