import { NextResponse } from "next/server";
import { UnauthorizedError } from "@/shared/auth/session";

/**
 * Standardised API response helpers for Next.js route handlers.
 *
 * All responses follow the envelope shape:
 *
 *   {
 *     "success"    : boolean,
 *     "statusCode" : number,
 *     "message"    : string,
 *     "data"       : T | null,
 *     "metadata"?  : PaginationMeta   // only for paginated list endpoints
 *   }
 *
 * Server-only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  metadata: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

/**
 * Parses `page` and `limit` from URL search params with safe defaults.
 *
 * @example
 * const { page, limit } = parsePagination(new URL(req.url).searchParams);
 */
export function parsePagination(
  searchParams: URLSearchParams,
  defaults: { page?: number; limit?: number } = {},
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(
      1,
      parseInt(searchParams.get("limit") ?? String(defaults.limit ?? 10), 10) ||
        10,
    ),
  );

  return { page, limit };
}

/**
 * Builds `PaginationMeta` from total item count and current pagination params.
 */
export function buildMeta(
  totalItems: number,
  { page, limit }: PaginationParams,
): PaginationMeta {
  return {
    page,
    limit,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
}

// ---------------------------------------------------------------------------
// Response factories
// ---------------------------------------------------------------------------

/**
 * 200 OK — single item or simple success with optional message override.
 */
export function ok<T>(
  data: T,
  message = "Berhasil",
  init?: ResponseInit,
): NextResponse<ApiResponse<T>> {
  const payload: ApiResponse<T> = {
    success: true,
    statusCode: 200,
    message,
    data,
  };

  return NextResponse.json(payload, { status: 200, ...init });
}

/**
 * 200 OK — paginated list.
 *
 * @example
 * return okPaginated(items, totalCount, { page, limit }, "Data berhasil diambil");
 */
export function okPaginated<T>(
  data: T[],
  totalItems: number,
  pagination: PaginationParams,
  message = "Berhasil",
): NextResponse<PaginatedApiResponse<T>> {
  const payload: PaginatedApiResponse<T> = {
    success: true,
    statusCode: 200,
    message,
    data,
    metadata: buildMeta(totalItems, pagination),
  };

  return NextResponse.json(payload, { status: 200 });
}

/**
 * 201 Created.
 */
export function created<T>(
  data: T,
  message = "Data berhasil dibuat",
): NextResponse<ApiResponse<T>> {
  const payload: ApiResponse<T> = {
    success: true,
    statusCode: 201,
    message,
    data,
  };

  return NextResponse.json(payload, { status: 201 });
}

/**
 * 204 No Content.
 */
export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

/**
 * 400 Bad Request.
 */
export function badRequest(message: string): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, statusCode: 400, message, data: null },
    { status: 400 },
  );
}

/**
 * 401 Unauthorized.
 */
export function unauthorized(
  message = "Unauthorized",
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, statusCode: 401, message, data: null },
    { status: 401 },
  );
}

/**
 * 403 Forbidden.
 */
export function forbidden(
  message = "Forbidden",
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, statusCode: 403, message, data: null },
    { status: 403 },
  );
}

/**
 * 404 Not Found.
 */
export function notFound(
  message = "Data tidak ditemukan",
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, statusCode: 404, message, data: null },
    { status: 404 },
  );
}

/**
 * 422 Unprocessable Entity — validation errors.
 */
export function unprocessable(
  message: string,
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, statusCode: 422, message, data: null },
    { status: 422 },
  );
}

/**
 * 500 Internal Server Error.
 */
export function serverError(
  message = "Terjadi kesalahan pada server",
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    { success: false, statusCode: 500, message, data: null },
    { status: 500 },
  );
}

// ---------------------------------------------------------------------------
// Route wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a route handler body, converting known errors into standardised
 * response envelopes.
 */
export async function handleRoute(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return unauthorized();
    }

    console.error("[route error]", error);

    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan pada server";

    return serverError(message);
  }
}
