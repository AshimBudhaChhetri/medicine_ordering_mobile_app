import { apiRequest } from "../api/client";
import { API_ENDPOINTS } from "../api/endpoints";

import {
  LoginRequest,
  LoginResponse,
  SessionResponse,
} from "../types/auth";

import {
  clearSessionToken,
  saveSessionToken,
} from "../storage/session";

/**
 * Authentication-specific API logic.
 *
 * Screens should call these methods
 * instead of knowing backend routes.
 */
export const authService = {
  /**
   * Email/password login.
   */
  async login(
    credentials: LoginRequest
  ) {
    const response =
      await apiRequest<LoginResponse>(
        API_ENDPOINTS.auth.login,
        {
          method: "POST",

          authenticated: false,

          body: credentials,
        }
      );

    /**
     * Backend returns the Better Auth
     * session token in the login body.
     *
     * Save it securely so every future
     * authenticated request can use it.
     */
    await saveSessionToken(
      response.token
    );

    return response;
  },

  /**
   * Verify stored session and load
   * the currently authenticated user.
   */
  async getSession() {
    return apiRequest<SessionResponse>(
      API_ENDPOINTS.auth.session,
      {
        method: "GET",
      }
    );
  },

  /**
   * Tell backend to invalidate the
   * current session and clear local token.
   */
  async logout() {
    try {
      await apiRequest(
        API_ENDPOINTS.auth.logout,
        {
          method: "POST",
        }
      );
    } finally {
      /**
       * Always remove local session,
       * even if backend logout fails.
       */
      await clearSessionToken();
    }
  },
};