import "dotenv/config";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "./client.js";
import { apiTokens, users } from "./schema.js";

const email = process.env.APP_REVIEW_EMAIL?.trim().toLowerCase();
if (!email) {
  throw new Error("APP_REVIEW_EMAIL is not configured in .env");
}

const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
if (!user) {
  console.log("No App Review user exists yet; there are no sessions to revoke.");
  process.exit(0);
}

const revoked = await db
  .update(apiTokens)
  .set({ revokedAt: new Date() })
  .where(and(eq(apiTokens.userId, user.id), isNull(apiTokens.revokedAt)))
  .returning({ id: apiTokens.id });

console.log(`Revoked ${revoked.length} active App Review session${revoked.length === 1 ? "" : "s"}.`);
