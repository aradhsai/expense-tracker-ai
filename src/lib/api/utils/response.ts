// API response builders

import { NextResponse } from "next/server";
import type {
  ApiSuccessResponse,
  ApiErrorResponse,
  ApiMeta,
  ApiErrorDetail,
  ErrorCode,
  RateLimitInfo,
} from "@/types/api";
import { generateRequestId } from "./request-id";

function createMeta(requestId?: string): ApiMeta {
  return {
    request_id: requestId || generateRequestId(),
    timestamp: new Date().toISOString(),
  };
}

export function successResponse<T>(
  data: T,
  status: number = 200,
  requestId?: string,
  rateLimitInfo?: RateLimitInfo
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: createMeta(requestId),
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (rateLimitInfo) {
    headers["X-RateLimit-Limit"] = String(rateLimitInfo.limit);
    headers["X-RateLimit-Remaining"] = String(rateLimitInfo.remaining);
    headers["X-RateLimit-Reset"] = String(rateLimitInfo.reset);
  }

  return NextResponse.json(response, { status, headers });
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: ApiErrorDetail,
  requestId?: string,
  rateLimitInfo?: RateLimitInfo
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: createMeta(requestId),
  };

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (rateLimitInfo) {
    headers["X-RateLimit-Limit"] = String(rateLimitInfo.limit);
    headers["X-RateLimit-Remaining"] = String(rateLimitInfo.remaining);
    headers["X-RateLimit-Reset"] = String(rateLimitInfo.reset);
  }

  return NextResponse.json(response, { status, headers });
}

// Convenience error response builders
export function badRequest(
  message: string,
  details?: ApiErrorDetail,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse("VALIDATION_ERROR", message, 400, details, requestId);
}

export function unauthorized(
  message: string = "Invalid or missing API key",
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse("UNAUTHORIZED", message, 401, undefined, requestId);
}

export function forbidden(
  message: string = "Access denied",
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse("FORBIDDEN", message, 403, undefined, requestId);
}

export function notFound(
  message: string = "Resource not found",
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse("NOT_FOUND", message, 404, undefined, requestId);
}

export function methodNotAllowed(
  method: string,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    "METHOD_NOT_ALLOWED",
    `Method ${method} not allowed`,
    405,
    undefined,
    requestId
  );
}

export function rateLimitExceeded(
  rateLimitInfo: RateLimitInfo,
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse(
    "RATE_LIMIT_EXCEEDED",
    "Rate limit exceeded. Please try again later.",
    429,
    undefined,
    requestId,
    rateLimitInfo
  );
}

export function internalError(
  message: string = "An unexpected error occurred",
  requestId?: string
): NextResponse<ApiErrorResponse> {
  return errorResponse("INTERNAL_ERROR", message, 500, undefined, requestId);
}
