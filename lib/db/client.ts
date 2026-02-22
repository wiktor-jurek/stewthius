import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./pool";
import * as schema from "./schema";
import * as authSchema from "./auth-schema";

export const db = drizzle(pool, { schema: { ...schema, ...authSchema } });

export type DbClient = typeof db;
export { schema, authSchema };
