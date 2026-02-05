// GET /api/v1/expenses - List expenses (paginated, filterable)
// POST /api/v1/expenses - Create expense

import { NextRequest } from "next/server";
import { authenticateRequest, checkRateLimit } from "@/lib/api/middleware";
import {
  successResponse,
  badRequest,
  internalError,
  rateLimitExceeded,
} from "@/lib/api/utils/response";
import { generateRequestId } from "@/lib/api/utils/request-id";
import {
  listExpensesQuerySchema,
  createExpenseSchema,
  formatZodErrors,
} from "@/lib/api/validators/expense";
import { listExpenses, createExpense } from "@/lib/api/services/expense-service";

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
      page: searchParams.get("page") || undefined,
      limit: searchParams.get("limit") || undefined,
      category: searchParams.get("category") || undefined,
      date_from: searchParams.get("date_from") || undefined,
      date_to: searchParams.get("date_to") || undefined,
      search: searchParams.get("search") || undefined,
      sort_by: searchParams.get("sort_by") || undefined,
      sort_order: searchParams.get("sort_order") || undefined,
    };

    const parseResult = listExpensesQuerySchema.safeParse(queryParams);
    if (!parseResult.success) {
      return badRequest(
        "Invalid query parameters",
        formatZodErrors(parseResult.error),
        requestId
      );
    }

    const result = await listExpenses(parseResult.data);

    return successResponse(result, 200, requestId, rateLimitResult.info);
  } catch (error) {
    console.error("Error listing expenses:", error);
    return internalError("Failed to fetch expenses", requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();

  // Authenticate with write scope
  const authResult = await authenticateRequest(request, "write", requestId);
  if (!authResult.success) {
    return authResult.response;
  }

  // Check rate limit
  const rateLimitResult = await checkRateLimit(authResult.apiKey);
  if (!rateLimitResult.allowed) {
    return rateLimitExceeded(rateLimitResult.info, requestId);
  }

  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    const parseResult = createExpenseSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(
        "Invalid request data",
        formatZodErrors(parseResult.error),
        requestId
      );
    }

    const expense = await createExpense(parseResult.data);

    return successResponse(expense, 201, requestId, rateLimitResult.info);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Invalid JSON in request body", undefined, requestId);
    }
    console.error("Error creating expense:", error);
    return internalError("Failed to create expense", requestId);
  }
}
