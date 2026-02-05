-- Migration: Create API authentication and rate limiting tables
-- Run this SQL in your Supabase SQL Editor

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

-- Index for prefix lookup (used in combination with hash)
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);

-- Rate limiting table for tracking API usage
CREATE TABLE IF NOT EXISTS api_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL,
  window_type VARCHAR(10) NOT NULL, -- 'minute' or 'day'
  request_count INT DEFAULT 1,
  UNIQUE(api_key_id, window_start, window_type)
);

-- Index for faster rate limit lookups
CREATE INDEX IF NOT EXISTS idx_api_rate_limits_lookup
  ON api_rate_limits(api_key_id, window_start, window_type);

-- Enable Row Level Security (RLS)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_rate_limits ENABLE ROW LEVEL SECURITY;

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

-- Function to clean up old rate limit records (run daily)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM api_rate_limits
  WHERE window_start < NOW() - INTERVAL '2 days';
END;
$$ LANGUAGE plpgsql;

-- Comment explaining the tables
COMMENT ON TABLE api_keys IS 'Stores hashed API keys for the Spendwise public API';
COMMENT ON TABLE api_rate_limits IS 'Tracks API request counts for rate limiting';
