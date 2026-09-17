/**
 * Centralized pagination utility.
 *
 * Parses raw `page` and `limit` query params into a validated, bounded
 * offset + limit pair. All list endpoints should use this utility so
 * response pagination metadata stays consistent.
 */

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parse and clamp pagination query params.
 * Falls back to defaults when values are missing or invalid.
 */
export function parsePaginationOptions(query: {
  page?: unknown;
  limit?: unknown;
}): PaginationOptions {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(query.limit) || DEFAULT_LIMIT));
  return { page, limit };
}

/** Convert page + limit to a database row range (0-indexed). */
export function toRange(options: PaginationOptions): { offset: number; limit: number } {
  return { offset: (options.page - 1) * options.limit, limit: options.limit };
}

/** Build a pagination meta object from total row count + current options. */
export function buildPaginationMeta(total: number, options: PaginationOptions): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / options.limit));
  return {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPreviousPage: options.page > 1,
  };
}

/** Wrap a data array and total count into a paginated response envelope. */
export function paginate<T>(items: T[], total: number, options: PaginationOptions): PaginatedResponse<T> {
  return {
    data: items,
    pagination: buildPaginationMeta(total, options),
  };
}
