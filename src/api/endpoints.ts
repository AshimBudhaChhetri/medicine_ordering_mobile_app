import { API_BASE_URL, AUTH_BASE_URL } from "../config/api";

/**
 * Central registry of backend API routes.
 *
 * Base URL is configured via EXPO_PUBLIC_API_BASE_URL in .env.
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: `${AUTH_BASE_URL}/sign-in/email`,
    session: `${AUTH_BASE_URL}/get-session`,
    logout: `${AUTH_BASE_URL}/sign-out`,
    googleLogin: `${AUTH_BASE_URL}/sign-in/social`,
  },

  // Password Reset
  passwordReset: {
    request: `${API_BASE_URL}/password-reset/request`,
    confirm: `${API_BASE_URL}/password-reset/confirm`,
  },

  // MR Self-Registration & Approvals
  registrations: {
    requestCode: `${API_BASE_URL}/registrations/request-code`,
    create: `${API_BASE_URL}/registrations`,
    passwordSetup: `${API_BASE_URL}/registrations/password-setup`,
    list: `${API_BASE_URL}/registrations`,
    approve: (id: string) => `${API_BASE_URL}/registrations/${id}/approve`,
    reject: (id: string) => `${API_BASE_URL}/registrations/${id}/reject`,
  },

  // Dashboard
  dashboard: {
    stats: `${API_BASE_URL}/dashboard/stats`,
  },

  // Catalog Metadata
  catalog: {
    options: `${API_BASE_URL}/catalog/options`,
    units: `${API_BASE_URL}/catalog/units`,
    types: `${API_BASE_URL}/catalog/types`,
  },

  // Products
  products: {
    list: `${API_BASE_URL}/products`,
    search: `${API_BASE_URL}/products`,
    create: `${API_BASE_URL}/products`,
    image: `${API_BASE_URL}/products/image`,
  },

  // Stockists
  stockists: {
    list: `${API_BASE_URL}/stockists`,
    create: `${API_BASE_URL}/stockists`,
    details: (id: string) => `${API_BASE_URL}/stockists/${id}`,
  },

  // Orders / Medicine Requests
  orders: {
    list: `${API_BASE_URL}/orders`,
    create: `${API_BASE_URL}/orders`,
    details: (id: string) => `${API_BASE_URL}/orders/${id}`,
    approve: (id: string) => `${API_BASE_URL}/orders/${id}/approve`,
    reject: (id: string) => `${API_BASE_URL}/orders/${id}/reject`,
  },

  // Documents
  documents: {
    list: `${API_BASE_URL}/documents`,
    upload: `${API_BASE_URL}/documents`,
    byOrder: (orderId: string) => `${API_BASE_URL}/documents/order/${orderId}`,
  },

  // Notifications
  notifications: {
    list: `${API_BASE_URL}/notifications`,
    unreadCount: `${API_BASE_URL}/notifications/unread-count`,
    markAsRead: (id: string) => `${API_BASE_URL}/notifications/${id}/read`,
    markAllAsRead: `${API_BASE_URL}/notifications/read-all`,
    socketToken: `${API_BASE_URL}/notifications/socket-token`,
    registerToken: `${API_BASE_URL}/notifications/push-tokens`,
    removeToken: `${API_BASE_URL}/notifications/push-tokens`,
  },

  // Users
  users: {
    list: `${API_BASE_URL}/users`,
    create: `${API_BASE_URL}/users`,
    meImage: `${API_BASE_URL}/users/me/image`,
  },
};
