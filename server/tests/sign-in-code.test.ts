import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import {
  MAX_CODES_PER_15_MINUTES,
  MAX_CODES_PER_DAY,
  MAX_FAILED_ATTEMPTS,
  requestAuthCode,
  verifyMobileCode,
} from "../src/auth/magic-code.js";
import { hashToken } from "../src/auth/tokens.js";
import { db } from "../src/db/client.js";
import { magicTokens, users } from "../src/db/schema.js";

const CODE = "482913";
const WRONG = "000000";

function testEmail(): string {
  return `code-${randomUUID().slice(0, 8)}@example.test`;
}

// Mirrors how magic-code.ts stores a short code, so a test can plant one it
// knows without reading the development email sink.
async function plantCode(email: string, code = CODE, overrides: Partial<typeof magicTokens.$inferInsert> = {}) {
  await db.insert(magicTokens).values({
    email,
    tokenHash: hashToken(`${email}\n${code}`),
    purpose: "mobile_code",
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  });
}

async function liveCodes(email: string) {
  return db
    .select()
    .from(magicTokens)
    .where(and(eq(magicTokens.email, email), eq(magicTokens.purpose, "mobile_code"), isNull(magicTokens.consumedAt)));
}

async function cleanUp(email: string) {
  await db.delete(magicTokens).where(eq(magicTokens.email, email));
  await db.delete(users).where(eq(users.email, email));
}

test("a sign-in code survives a few wrong guesses and still works once", async () => {
  const email = testEmail();
  try {
    await plantCode(email);
    for (let i = 0; i < MAX_FAILED_ATTEMPTS - 1; i++) assert.equal(await verifyMobileCode(email, WRONG), null);
    assert.equal((await verifyMobileCode(email, CODE))?.email, email);
    assert.equal(await verifyMobileCode(email, CODE), null, "a code is single-use");
  } finally {
    await cleanUp(email);
  }
});

test("a sign-in code is retired after too many wrong guesses", async () => {
  const email = testEmail();
  try {
    await plantCode(email);
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) assert.equal(await verifyMobileCode(email, WRONG), null);
    assert.equal((await liveCodes(email)).length, 0);
    assert.equal(await verifyMobileCode(email, CODE), null, "the right digits no longer work");
    assert.equal((await db.select().from(users).where(eq(users.email, email))).length, 0);
  } finally {
    await cleanUp(email);
  }
});

test("wrong guesses against one email do not affect another", async () => {
  const attacked = testEmail();
  const other = testEmail();
  try {
    await plantCode(attacked);
    await plantCode(other);
    for (let i = 0; i < MAX_FAILED_ATTEMPTS; i++) await verifyMobileCode(attacked, WRONG);
    assert.equal((await verifyMobileCode(other, CODE))?.email, other);
  } finally {
    await cleanUp(attacked);
    await cleanUp(other);
  }
});

test("an expired code is rejected without being counted as a guess", async () => {
  const email = testEmail();
  try {
    await plantCode(email, CODE, { expiresAt: new Date(Date.now() - 1000) });
    assert.equal(await verifyMobileCode(email, CODE), null);
  } finally {
    await cleanUp(email);
  }
});

test("requesting a new code cancels the earlier one", async () => {
  const email = testEmail();
  try {
    await plantCode(email);
    await requestAuthCode(email, "mobile");
    const live = await liveCodes(email);
    assert.equal(live.length, 1, "only the newest code is live");
    assert.notEqual(live[0].tokenHash, hashToken(`${email}\n${CODE}`));
    assert.equal(await verifyMobileCode(email, CODE), null);
  } finally {
    await cleanUp(email);
  }
});

test("codes are rationed per email over fifteen minutes", async () => {
  const email = testEmail();
  const other = testEmail();
  try {
    for (let i = 0; i < MAX_CODES_PER_15_MINUTES + 3; i++) await requestAuthCode(email, "mobile");
    assert.equal((await db.select().from(magicTokens).where(eq(magicTokens.email, email))).length, MAX_CODES_PER_15_MINUTES);

    await requestAuthCode(other, "mobile");
    assert.equal((await liveCodes(other)).length, 1, "another address is unaffected");
  } finally {
    await cleanUp(email);
    await cleanUp(other);
  }
});

test("codes are rationed per email over a day, and old rows stop counting", async () => {
  const email = testEmail();
  try {
    const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60_000);
    for (let i = 0; i < MAX_CODES_PER_DAY; i++) {
      await plantCode(email, String(100000 + i), { createdAt: hoursAgo(2 + i), consumedAt: hoursAgo(2 + i) });
    }
    await requestAuthCode(email, "mobile");
    assert.equal((await liveCodes(email)).length, 0, "the daily allowance is used up");

    // Age every row past the day boundary: they are cleared and a code is issued.
    await db.update(magicTokens).set({ createdAt: hoursAgo(25) }).where(eq(magicTokens.email, email));
    await requestAuthCode(email, "mobile");
    const rows = await db.select().from(magicTokens).where(eq(magicTokens.email, email));
    assert.equal(rows.length, 1);
    assert.equal(rows[0].consumedAt, null);
  } finally {
    await cleanUp(email);
  }
});
