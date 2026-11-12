import { timingSafeEqual } from "node:crypto";
import { eq, and, isNull, gt, lt, sql } from "drizzle-orm";
import { db } from "../db/client.js";
import { magicTokens, users } from "../db/schema.js";
import { generateMagicLinkToken, generateMobileCode, hashToken } from "./tokens.js";
import { sendEmail } from "./email.js";

const CODE_TTL_MINUTES = 10;

// A six-digit code has only a million values, so its safety depends on how
// many guesses it can absorb. The route-level limits in routes/auth.ts are
// keyed by client address, which an attacker with many addresses (one IPv6
// allocation is enough) simply rotates. These limits are keyed by the email
// alone: together they cap guessing at MAX_CODES_PER_DAY * MAX_FAILED_ATTEMPTS
// attempts per day against any one address, wherever the requests come from.
//
// The cost is that someone who knows an owner's email can use up that day's
// codes. Already-paired devices keep working, and `npm run bootstrap-owner`
// (a separate table and route, see owner-claim.ts) pairs a device without
// email, so the owner always has a way back in.
export const MAX_FAILED_ATTEMPTS = 5;
export const MAX_CODES_PER_15_MINUTES = 5;
export const MAX_CODES_PER_DAY = 10;

const FIFTEEN_MINUTES_MS = 15 * 60_000;
const DAY_MS = 24 * 60 * 60_000;

function emailAuthDisabled(): boolean {
  return process.env.DISABLE_EMAIL_AUTH === "true";
}

// When set, only these emails can sign in or create an account — without it,
// anyone who finds the API can request a code, verify it, and create their
// own site on this box (real risk for a self-hosted single-tenant instance,
// none for local dev, so it's opt-in via env rather than hardcoded).
function isAllowedEmail(email: string): boolean {
  if (emailAuthDisabled()) return false;
  const allowlist = process.env.ALLOWED_SIGNUP_EMAILS;
  if (!allowlist) return true;
  return allowlist
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());
}

// Short codes are hashed together with their email. The column is unique, and
// a bare six-digit code would otherwise collide with any earlier row that
// happened to draw the same digits.
function mobileCodeHash(email: string, code: string): string {
  return hashToken(`${email}\n${code}`);
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Reserves a new token row for this email, or returns null when the address
 * has had its share of codes. Runs as one transaction so concurrent requests
 * cannot each slip under the limit.
 */
function issueToken(email: string, purpose: "web_session" | "mobile_code", now: Date): string | null {
  return db.transaction((tx) => {
    // Rows older than a day no longer count toward any limit.
    tx.delete(magicTokens)
      .where(and(eq(magicTokens.email, email), lt(magicTokens.createdAt, new Date(now.getTime() - DAY_MS))))
      .run();

    const recent = tx
      .select({ createdAt: magicTokens.createdAt })
      .from(magicTokens)
      .where(eq(magicTokens.email, email))
      .all();
    const lastQuarterHour = recent.filter((row) => row.createdAt.getTime() > now.getTime() - FIFTEEN_MINUTES_MS);
    if (recent.length >= MAX_CODES_PER_DAY || lastQuarterHour.length >= MAX_CODES_PER_15_MINUTES) return null;

    // Only the newest code or link of each kind is ever valid, so asking for
    // several does not multiply the chance of guessing one.
    tx.update(magicTokens)
      .set({ consumedAt: now })
      .where(and(eq(magicTokens.email, email), eq(magicTokens.purpose, purpose), isNull(magicTokens.consumedAt)))
      .run();

    for (let attempt = 0; attempt < 5; attempt++) {
      const secret = purpose === "mobile_code" ? generateMobileCode() : generateMagicLinkToken();
      const tokenHash = purpose === "mobile_code" ? mobileCodeHash(email, secret) : hashToken(secret);
      const taken = tx.select({ id: magicTokens.id }).from(magicTokens).where(eq(magicTokens.tokenHash, tokenHash)).all();
      if (taken.length > 0) continue;
      tx.insert(magicTokens)
        .values({ email, tokenHash, purpose, expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * 60_000) })
        .run();
      return secret;
    }
    return null;
  });
}

export async function requestAuthCode(email: string, context: "web" | "mobile") {
  // No token is issued and no email is sent for a disallowed address, but the
  // route still replies 202 either way so this can't be used to probe which
  // emails are allowlisted. The per-email limit is silent for the same reason.
  if (!isAllowedEmail(email)) return;

  const purpose = context === "mobile" ? "mobile_code" : "web_session";
  const secret = issueToken(email, purpose, new Date());
  if (!secret) {
    console.warn("Sign-in code not sent: the per-email request limit was reached.");
    return;
  }

  if (context === "mobile") {
    await sendEmail({
      to: email,
      subject: "Your Flightstead sign-in code",
      text: `Your sign-in code is ${secret}. It expires in ${CODE_TTL_MINUTES} minutes.`,
    });
  } else {
    const link = `${process.env.API_BASE_URL}/api/v1/auth/magic/${secret}`;
    await sendEmail({
      to: email,
      subject: "Your Flightstead sign-in link",
      text: `Sign in: ${link}\n\nThis link expires in ${CODE_TTL_MINUTES} minutes.`,
    });
  }
}

/**
 * Checks a short code against the email's live code. A wrong guess is counted
 * on that code, and the code is retired once it has absorbed
 * MAX_FAILED_ATTEMPTS of them — after that even the right digits fail and a
 * new code has to be requested.
 */
function consumeMobileCode(email: string, code: string, now: Date): boolean {
  const tokenHash = mobileCodeHash(email, code);
  return db.transaction((tx) => {
    const live = tx
      .select()
      .from(magicTokens)
      .where(
        and(
          eq(magicTokens.email, email),
          eq(magicTokens.purpose, "mobile_code"),
          isNull(magicTokens.consumedAt),
          gt(magicTokens.expiresAt, now),
        ),
      )
      .all();
    if (live.length === 0) return false;

    const match = live.find((row) => sameHash(row.tokenHash, tokenHash));
    if (match) {
      tx.update(magicTokens).set({ consumedAt: now }).where(eq(magicTokens.id, match.id)).run();
      return true;
    }

    for (const row of live) {
      const failedAttempts = row.failedAttempts + 1;
      tx.update(magicTokens)
        .set({
          failedAttempts: sql`${magicTokens.failedAttempts} + 1`,
          ...(failedAttempts >= MAX_FAILED_ATTEMPTS ? { consumedAt: now } : {}),
        })
        .where(eq(magicTokens.id, row.id))
        .run();
    }
    return false;
  });
}

async function findOrCreateUser(email: string) {
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(users).values({ email }).returning();
  return created;
}

export async function verifyMobileCode(email: string, code: string) {
  if (emailAuthDisabled()) return null;
  if (!consumeMobileCode(email, code, new Date())) return null;
  return findOrCreateUser(email);
}

export async function verifyWebMagicLink(secret: string) {
  if (emailAuthDisabled()) return null;
  const tokenHash = hashToken(secret);
  const [row] = await db
    .select()
    .from(magicTokens)
    .where(
      and(
        eq(magicTokens.tokenHash, tokenHash),
        eq(magicTokens.purpose, "web_session"),
        isNull(magicTokens.consumedAt),
        gt(magicTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!row) return null;
  await db.update(magicTokens).set({ consumedAt: new Date() }).where(eq(magicTokens.id, row.id));
  return findOrCreateUser(row.email);
}
