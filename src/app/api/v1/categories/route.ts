// GET /api/v1/categories - List valid categories

import { NextRequest } from "next/server";
import { authenticateRequest, checkRateLimit } from "@/lib/api/middleware";
import { successResponse, rateLimitExceeded } from "@/lib/api/utils/response";
import { generateRequestId } from "@/lib/api/utils/request-id";
import { CATEGORIES } from "@/types/expense";

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

  return successResponse(
    { categories: CATEGORIES },
    200,
    requestId,
    rateLimitResult.info
  );
}
