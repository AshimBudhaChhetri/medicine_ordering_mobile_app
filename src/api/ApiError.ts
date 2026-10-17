/**
 * Standard error thrown by our API client.
 *
 * Backend errors may come from NestJS:
 *
 * {
 *   statusCode: 400,
 *   message: "Something went wrong",
 *   error: "Bad Request"
 * }
 *
 * Better Auth may instead return:
 *
 * {
 *   message: "...",
 *   code: "..."
 * }
 */
export class ApiError extends Error {
  status: number;
  data?: unknown;

  constructor(
    message: string,
    status: number,
    data?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}