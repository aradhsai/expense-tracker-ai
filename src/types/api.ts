// API-specific types for the Spendwise public API

export interface ApiMeta {
  request_id: string;
  timestamp: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  [field: string]: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}

// API Key types
export interface ApiKey {
  id: string;
  key_hash: string;
  key_prefix: string;
  name: string;
  scopes: string[];
  rate_limit_per_minute: number;
  rate_limit_per_day: number;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

// Error codes
export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Query parameters for listing expenses
export interface ExpenseListParams {
  page?: number;
  limit?: number;
  category?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  sort_by?: "date" | "amount" | "category";
  sort_order?: "asc" | "desc";
}

// Stats response types
export interface ExpenseStats {
  total_spending: number;
  monthly_spending: number;
  daily_average: number;
  expense_count: number;
  category_breakdown: CategoryBreakdown[];
  monthly_breakdown: MonthlyBreakdown[];
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthlyBreakdown {
  month: string; // YYYY-MM format
  total: number;
  count: number;
}
