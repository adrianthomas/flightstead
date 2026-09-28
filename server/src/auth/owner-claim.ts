import { eq, and, isNull, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { ownerClaims, users } from "../db/schema.js";
import { hashToken } from "./tokens.js";
import { claimAppReviewAccount } from "./app-review.js";

/** How long a pairing code printed by `bootstrap-owner.ts` stays valid. */
export const CLAIM_CODE_TTL_MINUTES = 20;

/**
 * Redeems a pairing code minted by an interactive `npm run bootstrap-owner`
 * run (see db/bootstrap-owner.ts) — the QR/manual-entry alternative to the
 * email code flow for first sign-in. Single-use and short-lived, same shape
 * as the email magic-code flow in magic-code.ts, just keyed by the code
 * itself instead of an email address.
 */
export async function claimOwner(code: string) {
  // Generated owner codes use an uppercase, ambiguity-free alphabet. Treat
  // manual entry and pasted codes the same as the QR payload so keyboard
  // casing and surrounding whitespace cannot invalidate a fresh code.
  const trimmedCode = code.trim();
  const codeHash = hashToken(trimmedCode.toUpperCase());
  const [row] = await db
    .select()
    .from(ownerClaims)
    .where(and(eq(ownerClaims.codeHash, codeHash), isNull(ownerClaims.consumedAt), gt(ownerClaims.expiresAt, new Date())))
    .limit(1);

  // The durable App Review credential is independently generated and remains
  // case-sensitive; only discard accidental surrounding whitespace for it.
  if (!row) return claimAppReviewAccount(trimmedCode);

  await db.update(ownerClaims).set({ consumedAt: new Date() }).where(eq(ownerClaims.id, row.id));

  const [user] = await db.select().from(users).where(eq(users.id, row.userId)).limit(1);
  return user ?? null;
}
