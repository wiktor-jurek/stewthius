import { auth } from "../../lib/auth";
import { db } from "../../lib/db/client";
import { user } from "../../lib/db/auth-schema";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4] || "Admin";

  if (!email || !password) {
    console.error("Usage: tsx scripts/tasks/create-admin.ts <email> <password> [name]");
    process.exit(1);
  }

  // Delete existing user with this email so we can recreate cleanly
  const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existing.length > 0) {
    await db.delete(user).where(eq(user.email, email));
    console.log(`Removed existing user: ${email}`);
  }

  // Use Better Auth's own signup API so the password is hashed correctly
  const result = await auth.api.signUpEmail({
    body: { email, password, name },
  });

  if (!result.user) {
    console.error("Signup failed:", result);
    process.exit(1);
  }

  console.log("User created:", result.user.id);

  // Promote to admin directly in DB
  await db.update(user).set({ role: "admin" }).where(eq(user.id, result.user.id));

  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

createAdmin();
