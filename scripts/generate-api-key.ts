// Generate a new API key and insert it into the database
// Run with: npx tsx scripts/generate-api-key.ts

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
const envVars: Record<string, string> = {};
envContent.split("\n").forEach((line) => {
  const [key, ...valueParts] = line.split("=");
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join("=").trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function generateApiKey(): Promise<{ key: string; hash: string; prefix: string }> {
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

async function main() {
  const keyName = process.argv[2] || "Test API Key";

  console.log(`Generating API key: "${keyName}"...\n`);

  const { key, hash, prefix } = await generateApiKey();

  // Insert into database
  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      key_hash: hash,
      key_prefix: prefix,
      name: keyName,
      scopes: ["read", "write"],
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to insert API key:", error.message);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log("API KEY GENERATED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log(`\nKey ID: ${data.id}`);
  console.log(`Name: ${data.name}`);
  console.log(`Scopes: ${data.scopes.join(", ")}`);
  console.log(`Rate Limit: ${data.rate_limit_per_minute}/min, ${data.rate_limit_per_day}/day`);
  console.log(`\n${"!".repeat(60)}`);
  console.log("SAVE THIS KEY - IT WILL NOT BE SHOWN AGAIN:");
  console.log(`\n  ${key}\n`);
  console.log("!".repeat(60));
  console.log("\nUsage:");
  console.log(`  curl -H "Authorization: Bearer ${key}" \\`);
  console.log(`       http://localhost:3000/api/v1/expenses`);
}

main().catch(console.error);
