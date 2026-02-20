#!/usr/bin/env tsx

const BASE_URL = process.env.REVALIDATE_BASE_URL || "https://stewthius.com";
const CACHE_TYPE = process.env.REVALIDATE_TYPE || "all";
const TOKEN = process.env.REVALIDATE_TOKEN;

const ALLOWED_TYPES = new Set([
  "all",
  "ratings",
  "stats",
  "ingredients",
  "sentiment",
  "videos",
]);

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    url: BASE_URL,
    type: CACHE_TYPE,
    token: TOKEN,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--url" && args[i + 1]) {
      parsed.url = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--type" && args[i + 1]) {
      parsed.type = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--token" && args[i + 1]) {
      parsed.token = args[i + 1];
      i += 1;
      continue;
    }
  }
  return parsed;
}

async function main() {
  const { url, type, token } = parseArgs();
  if (!ALLOWED_TYPES.has(type)) {
    console.error(`Invalid --type value: ${type}`);
    console.error(`Allowed values: ${Array.from(ALLOWED_TYPES).join(", ")}`);
    process.exit(1);
  }

  const endpoint = `${url.replace(/\/$/, "")}/api/revalidate`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(`Revalidating cache at ${endpoint} (type=${type})`);
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ type }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Revalidate failed (${response.status}): ${body}`);
    process.exit(1);
  }

  const json = (await response.json()) as { message?: string };
  console.log("Revalidate successful:", json.message || json);
}

main().catch((error) => {
  console.error("Revalidate task failed:", error);
  process.exit(1);
});
