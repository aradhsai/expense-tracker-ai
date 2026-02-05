// Pagination utilities for the API

import type { PaginationMeta } from "@/types/api";

export interface PaginationParams {
  page: number;
  limit: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export function parsePaginationParams(
  searchParams: URLSearchParams
): PaginationParams {
  let page = parseInt(searchParams.get("page") || String(DEFAULT_PAGE), 10);
  let limit = parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10);

  // Validate and clamp values
  if (isNaN(page) || page < 1) page = DEFAULT_PAGE;
  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  return { page, limit };
}

export function calculatePaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const total_pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    total_pages,
    has_next: page < total_pages,
    has_prev: page > 1,
  };
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}
