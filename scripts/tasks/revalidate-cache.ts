#!/usr/bin/env tsx

import { pathToFileURL } from "node:url";
import path from "node:path";

const ALLOWED_TYPES = new Set([
  "all",
  "ratings",
  "stats",
  "ingredients",
  "sentiment",
  "videos",
]);

export async function revalidateCache(
  type = "all",
  options?: { url?: string; token?: string },
) {
  const baseUrl =
    options?.url || process.env.REVALIDATE_BASE_URL || "https://stewthius.com";
  const token = options?.token || process.env.REVALIDATE_TOKEN;

  if (!ALLOWED_TYPES.has(type)) {
    console.error(`Invalid revalidate type: ${type}`);
    console.error(`Allowed values: ${Array.from(ALLOWED_TYPES).join(", ")}`);
    return false;
  }

  const endpoint = `${baseUrl.replace(/\/$/, "")}/api/revalidate`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  console.log(`Revalidating cache at ${endpoint} (type=${type})`);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ type }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Revalidate failed (${response.status}): ${body}`);
      return false;
    }

    const json = (await response.json()) as { message?: string };
    console.log("Revalidate successful:", json.message || json);
    return true;
  } catch (error) {
    console.error("Revalidate request failed:", error);
    return false;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    url: process.env.REVALIDATE_BASE_URL || "https://stewthius.com",
    type: process.env.REVALIDATE_TYPE || "all",
    token: process.env.REVALIDATE_TOKEN,
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

const isEntrypoint =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isEntrypoint) {
  const { url, type, token } = parseArgs();
  revalidateCache(type, { url, token }).then((success) => {
    if (!success) process.exit(1);
  });
}
