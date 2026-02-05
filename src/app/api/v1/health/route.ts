// GET /api/v1/health - Health check endpoint (no auth required)

import { successResponse, internalError } from "@/lib/api/utils/response";
import { generateRequestId } from "@/lib/api/utils/request-id";
import { getSupabaseClient } from "@/lib/api/middleware";

export async function GET() {
  const requestId = generateRequestId();

  try {
    // Check database connectivity
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("expenses").select("id").limit(1);

    if (error) {
      return successResponse(
        {
          status: "degraded",
          database: "disconnected",
          timestamp: new Date().toISOString(),
        },
        503,
        requestId
      );
    }

    return successResponse(
      {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
      200,
      requestId
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return internalError("Health check failed", requestId);
  }
}
