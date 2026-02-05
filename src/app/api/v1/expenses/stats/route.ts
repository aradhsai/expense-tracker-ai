// GET /api/v1/expenses/stats - Get expense statistics

import { NextRequest } from "next/server";
import { authenticateRequest, checkRateLimit } from "@/lib/api/middleware";
import {
  successResponse,
  badRequest,
  internalError,
  rateLimitExceeded,
} from "@/lib/api/utils/response";
import { generateRequestId } from "@/lib/api/utils/request-id";
import { statsQuerySchema, formatZodErrors } from "@/lib/api/validators/expense";
import { getExpenseStats } from "@/lib/api/services/stats-service";

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();

  // Authenticate
  const authResult = await authenticateRequest(request, "read", requestId);
  if (!authResult.success) {
    return authResult.response;
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(authResult.apiKey);
  if (!rateLimitResult.allowed) {
    return rateLimitExceeded(rateLimitResult.info, requestId);
  }

  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
    };

    const parseResult = statsQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
      return badRequest(
        "Invalid query parameters",
        formatZodErrors(parseResult.error),
        requestId
      );
    }

    const stats = await getExpenseStats(parseResult.data);

    return successResponse(stats, 200, requestId, rateLimitResult.info);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return internalError("Failed to fetch expense statistics", requestId);
  }
}
