import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { claimOwner } from "../src/auth/owner-claim.js";
import { hashToken } from "../src/auth/tokens.js";
import { db } from "../src/db/client.js";
import { ownerClaims, users } from "../src/db/schema.js";

test("owner pairing codes ignore manual-entry casing and surrounding whitespace", async () => {
  const suffix = randomUUID().slice(0, 8);
  const pairingCode = `PAIR${suffix}`.toUpperCase();
  const [user] = await db.insert(users).values({ email: `pair-${suffix}@example.test` }).returning();
  await db.insert(ownerClaims).values({
    userId: user.id,
    codeHash: hashToken(pairingCode),
    expiresAt: new Date(Date.now() + 60_000),
  });

  const claimed = await claimOwner(`  ${pairingCode.toLowerCase()}\n`);
  assert.equal(claimed?.id, user.id);
  assert.equal(await claimOwner(pairingCode), null, "the normalized code remains single-use");
});
