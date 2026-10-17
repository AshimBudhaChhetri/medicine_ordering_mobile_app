export type UserRole =
  | "superadmin"
  | "MR"
  | "MR-head";

export type AuthMethod =
  | "password"
  | "google";

export type AuthUser = {
  id: string;

  name: string;

  email: string;

  emailVerified?: boolean;

  image?: string | null;

  role: UserRole;

  branchId?: string | null;

  phoneNumber?: string | null;

  authMethod?: AuthMethod;

  banned?: boolean;

  banReason?: string | null;

  banExpires?: string | null;

  createdAt?: string;

  updatedAt?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  redirect: boolean;

  /**
   * Better Auth session token.
   * We persist this securely and send
   * it as the session cookie later.
   */
  token: string;

  url?: string | null;

  user: AuthUser;
};

export type SessionResponse = {
  session: unknown;
  user: AuthUser;
};