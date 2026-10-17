import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { authService } from "../services/authService";

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
  }

  /**
   * Real backend logout.
   */
  async function logout() {
    await authService.logout();

    setUser(null);
  }

  useEffect(() => {
    refreshSession();
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