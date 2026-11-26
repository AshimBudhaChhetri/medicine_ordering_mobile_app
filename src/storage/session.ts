import {
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from "./secureStorage";

/**
 * Key used to persist the Better Auth session token.
 *
 * The backend currently uses cookie-based sessions.
 * Login returns a token that corresponds to:
 *
 * better-auth.session_token=<token>
 */
const SESSION_TOKEN_KEY =
  "mediflow_session_token";

/**
 * Save session token securely on the device.
 */
export async function saveSessionToken(
  token: string
) {
  await setItemAsync(
    SESSION_TOKEN_KEY,
    token
  );
}

/**
 * Read the current session token.
 */
export async function getSessionToken() {
  return getItemAsync(
    SESSION_TOKEN_KEY
  );
}

/**
 * Remove session token during logout
 * or when the backend returns 401.
 */
export async function clearSessionToken() {
  await deleteItemAsync(
    SESSION_TOKEN_KEY
  );
}