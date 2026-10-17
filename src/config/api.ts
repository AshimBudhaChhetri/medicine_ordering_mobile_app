/**
 * Central backend configuration.
 *
 * IMPORTANT:
 * Never hardcode the backend URL inside screens or services.
 *
 * The backend URL may change frequently during development,
 * especially when using Cloudflare tunnels.
 *
 * Change EXPO_PUBLIC_API_BASE_URL in .env instead.
 */

const rawApiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL;

/**
 * Fail immediately if the environment variable is missing.
 * This prevents requests accidentally being sent to an invalid URL.
 */
if (!rawApiBaseUrl) {
  throw new Error(
    "EXPO_PUBLIC_API_BASE_URL is missing. Add it to your .env file."
  );
}

/**
 * Remove a trailing slash if somebody writes:
 *
 * https://example.com/
 *
 * This prevents URLs like:
 *
 * https://example.com//products
 */
export const API_BASE_URL =
  rawApiBaseUrl.replace(/\/+$/, "");

/**
 * Authentication is mounted separately under /api/auth.
 */
export const AUTH_BASE_URL =
  `${API_BASE_URL}/api/auth`;

/**
 * Convert backend image paths into URLs that
 * React Native can display.
 *
 * Backend may store:
 *
 * /api/backend/uploads/products/example.jpg
 *
 * Mobile must request:
 *
 * https://backend.com/uploads/products/example.jpg
 */
export function getMediaUrl(
  url?: string | null
): string | null {
  if (!url) {
    return null;
  }

  // Google/external avatar URL
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  const cleanedPath = url.replace(
    /^\/api\/backend/,
    ""
  );

  return `${API_BASE_URL}${cleanedPath}`;
}