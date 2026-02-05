// GET /api/v1/expenses/:id - Get single expense
// PUT /api/v1/expenses/:id - Full update
// PATCH /api/v1/expenses/:id - Partial update
// DELETE /api/v1/expenses/:id - Delete expense

import { NextRequest } from "next/server";
import { authenticateRequest, checkRateLimit } from "@/lib/api/middleware";
import {
  successResponse,
  badRequest,
  notFound,
  internalError,
  rateLimitExceeded,
} from "@/lib/api/utils/response";
import { generateRequestId } from "@/lib/api/utils/request-id";
import {
  updateExpenseSchema,
  patchExpenseSchema,
  formatZodErrors,
} from "@/lib/api/validators/expense";
import {
  getExpenseById,
  updateExpense,
  patchExpense,
  deleteExpense,
} from "@/lib/api/services/expense-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id } = await params;

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
    const expense = await getExpenseById(id);

    if (!expense) {
      return notFound(`Expense with id '${id}' not found`, requestId);
    }

    return successResponse(expense, 200, requestId, rateLimitResult.info);
  } catch (error) {
    console.error("Error fetching expense:", error);
    return internalError("Failed to fetch expense", requestId);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id } = await params;

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
    const body = await request.json();

    // Validate input - full update requires all fields
    const parseResult = updateExpenseSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(
        "Invalid request data",
        formatZodErrors(parseResult.error),
        requestId
      );
    }

    const expense = await updateExpense(id, parseResult.data);

    if (!expense) {
      return notFound(`Expense with id '${id}' not found`, requestId);
    }

    return successResponse(expense, 200, requestId, rateLimitResult.info);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Invalid JSON in request body", undefined, requestId);
    }
    console.error("Error updating expense:", error);
    return internalError("Failed to update expense", requestId);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id } = await params;

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
    const body = await request.json();

    // Validate input - partial update, all fields optional
    const parseResult = patchExpenseSchema.safeParse(body);
    if (!parseResult.success) {
      return badRequest(
        "Invalid request data",
        formatZodErrors(parseResult.error),
        requestId
      );
    }

    const expense = await patchExpense(id, parseResult.data);

    if (!expense) {
      return notFound(`Expense with id '${id}' not found`, requestId);
    }

    return successResponse(expense, 200, requestId, rateLimitResult.info);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Invalid JSON in request body", undefined, requestId);
    }
    console.error("Error patching expense:", error);
    return internalError("Failed to update expense", requestId);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const requestId = generateRequestId();
  const { id } = await params;

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
    const deleted = await deleteExpense(id);

    if (!deleted) {
      return notFound(`Expense with id '${id}' not found`, requestId);
    }

    return successResponse({ deleted: true }, 200, requestId, rateLimitResult.info);
  } catch (error) {
    console.error("Error deleting expense:", error);
    return internalError("Failed to delete expense", requestId);
  }
}
