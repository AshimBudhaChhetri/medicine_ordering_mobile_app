export type UserRole = "superadmin" | "MR" | "MR-head";

export type AuthMethod = "password" | "google";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: UserRole;
  branchId?: string | null;
  phoneNumber?: string | null;
  authMethod?: AuthMethod;
  banned?: boolean | null;
  banReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  redirect: boolean;
  token: string;
  url?: string | null;
  user: AuthUser;
}

export interface SessionResponse {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    createdAt?: string;
    updatedAt?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  user: AuthUser;
}
