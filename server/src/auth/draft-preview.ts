import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

// Preview links are deliberately temporary capabilities, separate from API
// credentials. A restart invalidates them without adding a secret or table.
const previewKey = randomBytes(32);
const PREVIEW_LIFETIME_MS = 24 * 60 * 60 * 1000;

function signature(siteId: string, objectId: string, expires: string): Buffer {
  return createHmac("sha256", previewKey)
    .update(JSON.stringify([siteId, objectId, expires]))
    .digest();
}

export function createDraftPreviewToken(siteId: string, objectId: string, now = Date.now()) {
  const expiresAt = new Date(now + PREVIEW_LIFETIME_MS);
  const expires = String(expiresAt.getTime());
  return { token: `${expires}.${signature(siteId, objectId, expires).toString("base64url")}`, expiresAt };
}

export function verifyDraftPreviewToken(token: string, siteId: string, objectId: string, now = Date.now()): boolean {
  const match = /^(\d{13})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match || Number(match[1]) <= now) return false;
  const supplied = Buffer.from(match[2], "base64url");
  const expected = signature(siteId, objectId, match[1]);
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}
