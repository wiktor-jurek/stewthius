import { Pool, type PoolConfig } from "pg";

const connectionString = process.env.NEW_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing required env var: NEW_DATABASE_URL (or fallback DATABASE_URL)");
}

const sslConfig: PoolConfig["ssl"] =
  process.env.DATABASE_SSL === "false"
    ? false
    : process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false;

export const pool = new Pool({
  connectionString,
  ssl: sslConfig,
});
