// Rate limiting middleware

import type { ApiKey, RateLimitInfo } from "@/types/api";
import { getSupabaseClient } from "./auth";

interface RateLimitResult {
  allowed: boolean;
  info: RateLimitInfo;
}

export async function checkRateLimit(
  apiKey: ApiKey
): Promise<RateLimitResult> {
  const supabase = getSupabaseClient();
  const now = new Date();

  // Calculate window starts
  const minuteWindowStart = new Date(now);
  minuteWindowStart.setSeconds(0, 0);

  const dayWindowStart = new Date(now);
  dayWindowStart.setHours(0, 0, 0, 0);

  try {
    // Get or create rate limit records for both windows
    const [minuteResult, dayResult] = await Promise.all([
      upsertRateLimitRecord(supabase, apiKey.id, minuteWindowStart, "minute"),
      upsertRateLimitRecord(supabase, apiKey.id, dayWindowStart, "day"),
    ]);

    const minuteCount = minuteResult.request_count;
    const dayCount = dayResult.request_count;

    // Check if limits exceeded
    const minuteExceeded = minuteCount > apiKey.rate_limit_per_minute;
    const dayExceeded = dayCount > apiKey.rate_limit_per_day;

    // Calculate reset time (end of current minute window)
    const resetTime = new Date(minuteWindowStart);
    resetTime.setMinutes(resetTime.getMinutes() + 1);

    const info: RateLimitInfo = {
      limit: apiKey.rate_limit_per_minute,
      remaining: Math.max(0, apiKey.rate_limit_per_minute - minuteCount),
      reset: Math.floor(resetTime.getTime() / 1000),
    };

    if (minuteExceeded || dayExceeded) {
      return { allowed: false, info };
    }

    return { allowed: true, info };
  } catch (error) {
    // On error, allow the request but log the issue
    console.error("Rate limit check failed:", error);
    return {
      allowed: true,
      info: {
        limit: apiKey.rate_limit_per_minute,
        remaining: apiKey.rate_limit_per_minute,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    };
  }
}

async function upsertRateLimitRecord(
  supabase: ReturnType<typeof getSupabaseClient>,
  apiKeyId: string,
  windowStart: Date,
  windowType: "minute" | "day"
): Promise<{ request_count: number }> {
  const windowStartStr = windowStart.toISOString();

  // Try to increment existing record
  const { data: existing, error: selectError } = await supabase
    .from("api_rate_limits")
    .select("id, request_count")
    .eq("api_key_id", apiKeyId)
    .eq("window_start", windowStartStr)
    .eq("window_type", windowType)
    .single();

  if (existing && !selectError) {
    // Increment existing record
    const newCount = existing.request_count + 1;
    await supabase
      .from("api_rate_limits")
      .update({ request_count: newCount })
      .eq("id", existing.id);

    return { request_count: newCount };
  }

  // Create new record
  const { data: inserted, error: insertError } = await supabase
    .from("api_rate_limits")
    .insert({
      api_key_id: apiKeyId,
      window_start: windowStartStr,
      window_type: windowType,
      request_count: 1,
    })
    .select("request_count")
    .single();

  if (insertError) {
    // Handle race condition - another request might have created the record
    if (insertError.code === "23505") {
      // Unique violation - fetch and increment
      const { data: refetched } = await supabase
        .from("api_rate_limits")
        .select("id, request_count")
        .eq("api_key_id", apiKeyId)
        .eq("window_start", windowStartStr)
        .eq("window_type", windowType)
        .single();

      if (refetched) {
        const newCount = refetched.request_count + 1;
        await supabase
          .from("api_rate_limits")
          .update({ request_count: newCount })
          .eq("id", refetched.id);

        return { request_count: newCount };
      }
    }
    throw insertError;
  }

  return { request_count: inserted?.request_count || 1 };
}

// Cleanup old rate limit records (can be run periodically)
export async function cleanupOldRateLimitRecords(): Promise<void> {
  const supabase = getSupabaseClient();
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  await supabase
    .from("api_rate_limits")
    .delete()
    .lt("window_start", oneDayAgo.toISOString());
}
