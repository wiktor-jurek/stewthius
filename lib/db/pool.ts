import { Pool, type PoolConfig } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing required env var: DATABASE_URL");
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
