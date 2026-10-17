import {
  API_BASE_URL,
  AUTH_BASE_URL,
} from "../config/api";

/**
 * Central registry of backend API routes.
 *
 * IMPORTANT:
 * Do not hardcode the backend domain in screens or services.
 *
 * The backend host comes from:
 *
 * EXPO_PUBLIC_API_BASE_URL
 *
 * in the .env file.
 *
 * Therefore, when the Cloudflare tunnel changes,
 * only the .env file needs to be updated.
 */
export const API_ENDPOINTS = {
  // =========================================================
  // AUTHENTICATION
  // =========================================================

  auth: {
    /**
     * Email + password login.
     *
     * POST /api/auth/sign-in/email
     */
    login: `${AUTH_BASE_URL}/sign-in/email`,

    /**
     * Get current authenticated session.
     *
     * GET /api/auth/get-session
     */
    session: `${AUTH_BASE_URL}/get-session`,

    /**
     * Sign out current session.
     *
     * POST /api/auth/sign-out
     */
    logout: `${AUTH_BASE_URL}/sign-out`,

    /**
     * Start Google OAuth.
     *
     * POST /api/auth/sign-in/social
     */
    googleLogin: `${AUTH_BASE_URL}/sign-in/social`,
  },

  // =========================================================
  // PRODUCTS
  // =========================================================

  products: {
    /**
     * MR product catalogue.
     *
     * GET /products
     */
    list: `${API_BASE_URL}/products`,

    /**
     * Search is currently handled using
     * query parameters on the same endpoint.
     *
     * Example:
     * /products?name=para
     */
    search: `${API_BASE_URL}/products`,
  },

  // =========================================================
  // STOCKISTS
  // =========================================================

  stockists: {
    /**
     * Load stockists.
     *
     * GET /stockists
     */
    list: `${API_BASE_URL}/stockists`,

    /**
     * Create stockist.
     *
     * POST /stockists
     */
    create: `${API_BASE_URL}/stockists`,
  },

  // =========================================================
  // ORDERS / MEDICINE REQUESTS
  // =========================================================

  orders: {
    /**
     * Load medicine requests/orders.
     *
     * GET /orders
     */
    list: `${API_BASE_URL}/orders`,

    /**
     * Create medicine request.
     *
     * POST /orders
     */
    create: `${API_BASE_URL}/orders`,

    /**
     * Load a specific request.
     *
     * GET /orders/:id
     */
    details: (id: string) =>
      `${API_BASE_URL}/orders/${id}`,
  },

  // =========================================================
  // DASHBOARD
  // =========================================================

  dashboard: {
    /**
     * Dashboard statistics.
     *
     * GET /dashboard/stats
     */
    stats: `${API_BASE_URL}/dashboard/stats`,
  },

  // =========================================================
  // PASSWORD RESET
  // =========================================================

  passwordReset: {
    /**
     * Request OTP.
     *
     * POST /password-reset/request
     */
    request:
      `${API_BASE_URL}/password-reset/request`,

    /**
     * Confirm OTP and set new password.
     *
     * POST /password-reset/confirm
     */
    confirm:
      `${API_BASE_URL}/password-reset/confirm`,
  },

  // =========================================================
  // REGISTRATION
  // =========================================================

  registrations: {
    /**
     * Request email verification code.
     *
     * POST /registrations/request-code
     */
    requestCode:
      `${API_BASE_URL}/registrations/request-code`,

    /**
     * Submit MR registration.
     *
     * POST /registrations
     */
    create:
      `${API_BASE_URL}/registrations`,

    /**
     * Set first password after account approval.
     *
     * POST /registrations/password-setup
     */
    passwordSetup:
      `${API_BASE_URL}/registrations/password-setup`,
  },
};