-- Example: How to create an API key
--
-- API keys are generated in the format: spw_live_<32-char-random-string>
-- The key is hashed using SHA-256 before storing
--
-- To generate a new API key:
-- 1. Generate a random key: spw_live_ + 32 random hex characters
-- 2. Hash the full key with SHA-256
-- 3. Store the hash and prefix in the database
--
-- Example using Node.js (run this in your application):
--
-- import { generateApiKey } from '@/lib/api/middleware/auth';
-- const { key, hash, prefix } = await generateApiKey();
-- console.log('API Key (save this, shown only once):', key);
-- // Then insert the hash and prefix into the database

-- Manual example for testing (DO NOT use this key in production):
-- This creates a test key: spw_live_0123456789abcdef0123456789abcdef
-- SHA-256 hash of "spw_live_0123456789abcdef0123456789abcdef"

-- INSERT INTO api_keys (key_hash, key_prefix, name, scopes)
-- VALUES (
--   '< SHA-256 hash of your key >',
--   'spw_live_012',
--   'Test API Key',
--   ARRAY['read', 'write']
-- );

-- To generate a proper key hash, you can use this SQL function:
CREATE OR REPLACE FUNCTION hash_api_key(key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(sha256(key::bytea), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Example usage (replace with your actual key):
-- SELECT hash_api_key('spw_live_your32characterrandomstring');
--
-- Then use the result to insert:
-- INSERT INTO api_keys (key_hash, key_prefix, name, scopes)
-- VALUES (
--   '<result from hash_api_key>',
--   'spw_live_you',
--   'My API Key',
--   ARRAY['read', 'write']
-- );
