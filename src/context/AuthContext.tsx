import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService";
import {
  registerForPushNotifications,
  unregisterPushToken,
} from "../services/notificationService";

import {
  AuthUser,
  LoginRequest,
} from "../types/auth";

import {
  clearSessionToken,
  getSessionToken,
} from "../storage/session";

type AuthContextType = {
  user: AuthUser | null;

  isAuthenticated: boolean;

  isLoading: boolean;

  login: (
    credentials: LoginRequest
  ) => Promise<void>;

  logout: () => Promise<void>;

  refreshSession:
    () => Promise<void>;
};

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [
    user,
    setUser,
  ] = useState<AuthUser | null>(
    null
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  /**
   * Check whether the device already
   * has a valid stored login session.
   */
  async function refreshSession() {
    const token =
      await getSessionToken();

    if (!token) {
      setUser(null);
      setIsLoading(false);

      return;
    }

    try {
      const response =
        await authService.getSession();

      setUser(response.user);
      await syncPushNotifications();
    } catch {
      /**
       * Invalid/expired sessions
       * should return the app to login.
       */
      await clearSessionToken();

      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  /**
   * Push is an enhancement, not a requirement: a denied permission or a
   * missing EAS project must never stop someone from signing in.
   */
  async function syncPushNotifications() {
    try {
      await registerForPushNotifications();
    } catch (error) {
      console.warn(
        "Could not register for push notifications",
        error
      );
    }
  }

  /**
   * Real backend login.
   */
  async function login(
    credentials: LoginRequest
  ) {
    const response =
      await authService.login(
        credentials
      );

    setUser(response.user);
    await syncPushNotifications();
  }

  /**
   * Real backend logout.
   */
  async function logout() {
    try {
      // Removed before sign-out clears the session the request needs.
      await unregisterPushToken();
    } catch (error) {
      console.warn(
        "Could not unregister push notifications",
        error
      );
    }

    try {
      await authService.logout();
    } catch (error) {
      console.warn('authService.logout notice:', error);
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    refreshSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,

        isAuthenticated:
          Boolean(user),

        isLoading,

        login,

        logout,

        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}