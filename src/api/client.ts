import { API_BASE_URL } from "../config/api";

import {
  clearSessionToken,
  getSessionToken,
} from "../storage/session";

import { ApiError } from "./ApiError";

type ApiRequestOptions =
  Omit<RequestInit, "body"> & {
    /**
     * Object body is automatically
     * serialized as JSON.
     */
    body?: unknown;

    /**
     * Public endpoints such as login
     * do not need the session cookie.
     */
    authenticated?: boolean;
  };

/**
 * Extract the most useful error message
 * from NestJS or Better Auth responses.
 */
function getErrorMessage(
  data: any,
  fallback: string
) {
  if (!data) {
    return fallback;
  }

  /**
   * Nest validation errors can sometimes
   * return message as an array.
   */
  if (Array.isArray(data.message)) {
    return data.message.join("\n");
  }

  if (
    typeof data.message === "string"
  ) {
    return data.message;
  }

  if (
    typeof data.error === "string"
  ) {
    return data.error;
  }

  return fallback;
}

/**
 * Central API request function.
 *
 * Screens should NOT call fetch directly.
 *
 * All authentication, headers,
 * error handling and JSON parsing
 * should happen here.
 */
export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    authenticated = true,
    headers,
    body,
    ...fetchOptions
  } = options;

  /**
   * Endpoint can either be:
   *
   * /products
   *
   * or a full URL.
   */
  const url = path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path}`;

  const requestHeaders =
    new Headers(headers);

  /**
   * Better Auth and modern CSRF protections check the Origin/Referer header
   * on state-changing requests when cookies are present. React Native's fetch
   * does not supply an Origin header by default, so we attach the target origin.
   */
  try {
    const origin = url.startsWith("http") ? new URL(url).origin : API_BASE_URL;
    if (!requestHeaders.has("Origin")) {
      requestHeaders.set("Origin", origin);
    }
    if (!requestHeaders.has("Referer")) {
      requestHeaders.set("Referer", `${origin}/`);
    }
  } catch {
    // Ignore URL parse errors
  }

  /**
   * JSON is our default request format.
   *
   * Do NOT set this header manually for
   * FormData uploads later.
   */
  if (
    body !== undefined &&
    !(body instanceof FormData)
  ) {
    requestHeaders.set(
      "Content-Type",
      "application/json"
    );
  }

  /**
   * Attach Better Auth session cookie and Bearer authorization
   * to protected API calls.
   */
  if (authenticated) {
    const sessionToken =
      await getSessionToken();

    if (sessionToken) {
      requestHeaders.set(
        "Cookie",
        `better-auth.session_token=${sessionToken}`
      );
      if (!requestHeaders.has("Authorization")) {
        requestHeaders.set("Authorization", `Bearer ${sessionToken}`);
      }
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,

    headers: requestHeaders,

    body:
      body === undefined
        ? undefined
        : body instanceof FormData
        ? body
        : JSON.stringify(body),
  });

  /**
   * 204 = successful request
   * with no response body.
   */
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType =
    response.headers.get(
      "content-type"
    );

  let data: any = null;

  if (
    contentType?.includes(
      "application/json"
    )
  ) {
    data = await response.json();
  } else {
    const text =
      await response.text();

    data = text || null;
  }

  if (!response.ok) {
    /**
     * A 401 generally means the stored
     * session is no longer valid.
     */
    if (response.status === 401) {
      await clearSessionToken();
    }

    throw new ApiError(
      getErrorMessage(
        data,
        `Request failed (${response.status})`
      ),
      response.status,
      data
    );
  }

  return data as T;
}
