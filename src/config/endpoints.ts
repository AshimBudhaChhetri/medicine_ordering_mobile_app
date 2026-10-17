import {
  API_BASE_URL,
  AUTH_BASE_URL,
} from "../config/api";

/**
 * All backend routes belong here.
 *
 * If the backend route structure changes later,
 * update this file instead of changing every screen.
 */
export const API_ENDPOINTS = {
  auth: {
    login:
      `${AUTH_BASE_URL}/sign-in/email`,

    session:
      `${AUTH_BASE_URL}/get-session`,

    logout:
      `${AUTH_BASE_URL}/sign-out`,
  },

  products: {
    list:
      `${API_BASE_URL}/products`,
  },

  stockists: {
    list:
      `${API_BASE_URL}/stockists`,

    create:
      `${API_BASE_URL}/stockists`,
  },

  orders: {
    list:
      `${API_BASE_URL}/orders`,

    create:
      `${API_BASE_URL}/orders`,

    details: (id: string) =>
      `${API_BASE_URL}/orders/${id}`,
  },

  dashboard: {
    stats:
      `${API_BASE_URL}/dashboard/stats`,
  },

  passwordReset: {
    request:
      `${API_BASE_URL}/password-reset/request`,

    confirm:
      `${API_BASE_URL}/password-reset/confirm`,
  },
};