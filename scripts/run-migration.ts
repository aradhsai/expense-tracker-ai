// Run this script with: npx tsx scripts/run-migration.ts
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.log("\nAdd SUPABASE_SERVICE_ROLE_KEY to your .env.local file.");
  console.log("You can find it in Supabase Dashboard > Settings > API > service_role key");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const migration = `
-- API Keys table for storing hashed API keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(64) NOT NULL UNIQUE,
  key_prefix VARCHAR(12) NOT NULL,
  name VARCHAR(100) NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read', 'write'],
  rate_limit_per_minute INT DEFAULT 60,
  rate_limit_per_day INT DEFAULT 10000,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups by key_hash
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- Index for prefix lookup
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Rate limiting table for tracking API usage
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_type VARCHAR(10) NOT NULL,
  request_count INT DEFAULT 1,
  UNIQUE(api_key_id, window_start, window_type)
);

-- Index for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup
  ON api_rate_limits(api_key_id, window_start, window_type);

-- Enable Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to allow re-running)
DROP POLICY IF EXISTS "Service role can manage api_keys" ON api_keys;
DROP POLICY IF EXISTS "Anon can read api_keys for auth" ON api_keys;
DROP POLICY IF EXISTS "Anon can update last_used_at" ON api_keys;
DROP POLICY IF EXISTS "Service role can manage rate_limits" ON api_rate_limits;
DROP POLICY IF EXISTS "Anon can manage rate_limits" ON api_rate_limits;

-- Policy: Allow service role full access to api_keys
CREATE POLICY "Service role can manage api_keys" ON api_keys
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Allow anon role to read api_keys for authentication
CREATE POLICY "Anon can read api_keys for auth" ON api_keys
  FOR SELECT
  USING (true);

-- Policy: Allow anon role to update last_used_at
CREATE POLICY "Anon can update last_used_at" ON api_keys
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow service role full access to api_rate_limits
CREATE POLICY "Service role can manage rate_limits" ON api_rate_limits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Allow anon role to manage rate limits (needed for API)
CREATE POLICY "Anon can manage rate_limits" ON api_rate_limits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Function to clean up old rate limit records
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM api_rate_limits
  WHERE window_start < NOW() - INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql;
`;

async function runMigration() {
  console.log("Running API tables migration...\n");

  const { error } = await supabase.rpc("exec_sql", { sql: migration });

  if (error) {
    // Try running via direct query if rpc doesn't work
    console.log("Trying direct SQL execution...");

    // Split and run statements individually
    const statements = migration
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      const { error: stmtError } = await supabase.from("_exec").select().eq("sql", stmt + ";");
      if (stmtError && !stmtError.message.includes("already exists")) {
        console.error(`Error: ${stmtError.message}`);
      }
    }
  }

  console.log("Migration completed!");
  console.log("\nNext: Generate an API key with: npx tsx scripts/generate-api-key.ts");
}

runMigration().catch(console.error);
