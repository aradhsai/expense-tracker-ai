// API Key authentication middleware

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unauthorized, forbidden } from "../utils/response";
import type { ApiKey } from "@/types/api";

// Create a server-side Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Simple hash function for API key verification
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Extract API key from request headers
function extractApiKey(request: NextRequest): string | null {
  const authHeader = request.headers.get("Authorization");

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  // Also support X-API-Key header
  return request.headers.get("X-API-Key");
}

export interface AuthResult {
  success: true;
  apiKey: ApiKey;
}

export interface AuthError {
  success: false;
  response: ReturnType<typeof unauthorized | typeof forbidden>;
}

export type AuthMiddlewareResult = AuthResult | AuthError;

export async function authenticateRequest(
  request: NextRequest,
  requiredScope?: "read" | "write",
  requestId?: string
): Promise<AuthMiddlewareResult> {
  const apiKeyString = extractApiKey(request);

  if (!apiKeyString) {
    return {
      success: false,
      response: unauthorized("Missing API key. Provide via Authorization: Bearer <key> or X-API-Key header.", requestId),
    };
  }

  // Validate API key format
  if (!apiKeyString.startsWith("spw_live_")) {
    return {
      success: false,
      response: unauthorized("Invalid API key format", requestId),
    };
  }

  try {
    const supabase = getSupabaseClient();
    const keyHash = await hashApiKey(apiKeyString);
    const keyPrefix = apiKeyString.slice(0, 12);

    // Look up the API key by hash
    const { data: apiKey, error } = await supabase
      .from("api_keys")
      .select("*")
      .eq("key_hash", keyHash)
      .eq("key_prefix", keyPrefix)
      .single();

    if (error || !apiKey) {
      return {
        success: false,
        response: unauthorized("Invalid API key", requestId),
      };
    }

    // Check if key is active
    if (!apiKey.is_active) {
      return {
        success: false,
        response: forbidden("API key is disabled", requestId),
      };
    }

    // Check expiration
    if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
      return {
        success: false,
        response: forbidden("API key has expired", requestId),
      };
    }

    // Check scope if required
    if (requiredScope && !apiKey.scopes.includes(requiredScope)) {
      return {
        success: false,
        response: forbidden(`API key lacks '${requiredScope}' permission`, requestId),
      };
    }

    // Update last_used_at (fire and forget)
    supabase
      .from("api_keys")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", apiKey.id)
      .then(() => {});

    return {
      success: true,
      apiKey: apiKey as ApiKey,
    };
  } catch {
    return {
      success: false,
      response: unauthorized("Failed to validate API key", requestId),
    };
  }
}

// Generate a new API key (utility function for admin use)
export async function generateApiKey(): Promise<{ key: string; hash: string; prefix: string }> {
  const randomBytes = new Uint8Array(24);
  crypto.getRandomValues(randomBytes);
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);

  const key = `spw_live_${randomString}`;
  const hash = await hashApiKey(key);
  const prefix = key.slice(0, 12);

  return { key, hash, prefix };
}

// Export for use in rate limiting
export { getSupabaseClient };
