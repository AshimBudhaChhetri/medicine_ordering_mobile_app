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
 * Authentication and profile API methods.
 */
export const authService = {
  /**
   * Email/password login.
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiRequest<LoginResponse>(
      API_ENDPOINTS.auth.login,
      {
        method: "POST",
        authenticated: false,
        body: credentials,
      }
    );

    // Save session token returned by better-auth
    await saveSessionToken(response.token);

    return response;
  },

  /**
   * Verify stored session and load currently authenticated user.
   */
  async getSession(): Promise<SessionResponse> {
    return apiRequest<SessionResponse>(
      API_ENDPOINTS.auth.session,
      {
        method: "GET",
      }
    );
  },

  /**
   * Invalidate current session and clear local token.
   */
  async logout(): Promise<void> {
    try {
      await apiRequest(API_ENDPOINTS.auth.logout, {
        method: "POST",
      });
    } catch (error) {
      console.warn("Backend logout request notification:", error);
    } finally {
      await clearSessionToken();
    }
  },

  /**
   * Request password reset OTP code.
   */
  async requestPasswordReset(email: string): Promise<{ status: string }> {
    return apiRequest<{ status: string }>(
      API_ENDPOINTS.passwordReset.request,
      {
        method: "POST",
        authenticated: false,
        body: { email },
      }
    );
  },

  /**
   * Confirm password reset with OTP code and set new password.
   */
  async confirmPasswordReset(
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ status: string }> {
    return apiRequest<{ status: string }>(
      API_ENDPOINTS.passwordReset.confirm,
      {
        method: "POST",
        authenticated: false,
        body: { email, otp, newPassword },
      }
    );
  },

  /**
   * Upload user profile avatar.
   */
  async updateAvatar(formData: FormData): Promise<{ image: string }> {
    return apiRequest<{ image: string }>(
      API_ENDPOINTS.users.meImage,
      {
        method: "PATCH",
        body: formData,
      }
    );
  },
};
