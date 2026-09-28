import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { buildApp } from "../src/app.js";
import { claimAppReviewAccount, validateAppReviewConfiguration } from "../src/auth/app-review.js";
import { requestAuthCode, verifyMobileCode } from "../src/auth/magic-code.js";
import { hashToken } from "../src/auth/tokens.js";
import { db } from "../src/db/client.js";
import {
  apiTokens,
  apFollowers,
  assets,
  contentObjects,
  dailyVisitCounts,
  magicTokens,
  ownerClaims,
  siteActorKeys,
  sites,
  users,
} from "../src/db/schema.js";

test("App Review access provisions one reusable isolated account and site", async () => {
  const suffix = randomUUID().slice(0, 8);
  const accessCode = `review-access-${suffix}-long`;
  process.env.APP_REVIEW_EMAIL = `review-${suffix}@example.test`;
  process.env.APP_REVIEW_ACCESS_CODE_HASH = hashToken(accessCode);
  process.env.APP_REVIEW_SITE_SUBDOMAIN = `review-${suffix}`;
  process.env.APP_REVIEW_SITE_TITLE = "Flightstead Review";

  try {
    assert.equal(await claimAppReviewAccount("not-the-code"), null);
    const first = await claimAppReviewAccount(accessCode);
    const second = await claimAppReviewAccount(accessCode);
    assert.ok(first);
    assert.equal(second?.id, first.id);

    const ownedSites = await db.select().from(sites).where(eq(sites.ownerUserId, first.id));
    assert.equal(ownedSites.length, 1);
    assert.equal(ownedSites[0].subdomain, `review-${suffix}`);
    assert.equal(ownedSites[0].federationEnabled, false);
  } finally {
    delete process.env.APP_REVIEW_EMAIL;
    delete process.env.APP_REVIEW_ACCESS_CODE_HASH;
    delete process.env.APP_REVIEW_SITE_SUBDOMAIN;
    delete process.env.APP_REVIEW_SITE_TITLE;
  }
});

test("disabled email auth neither creates nor verifies codes", async () => {
  const email = `disabled-${randomUUID()}@example.test`;
  process.env.DISABLE_EMAIL_AUTH = "true";
  try {
    await requestAuthCode(email, "mobile");
    assert.equal((await db.select().from(magicTokens).where(eq(magicTokens.email, email))).length, 0);
    assert.equal(await verifyMobileCode(email, "123456"), null);
  } finally {
    delete process.env.DISABLE_EMAIL_AUTH;
  }
});

test("App Review configuration refuses a plaintext durable credential", () => {
  process.env.APP_REVIEW_ACCESS_CODE = "do-not-store-this-in-plaintext";
  try {
    assert.throws(
      () => validateAppReviewConfiguration(),
      /APP_REVIEW_ACCESS_CODE is not accepted/,
    );
  } finally {
    delete process.env.APP_REVIEW_ACCESS_CODE;
  }
});

test("DELETE /account removes Flightstead-managed data but preserves other accounts", async () => {
  const suffix = randomUUID().slice(0, 8);
  const token = `delete-token-${suffix}`;
  const [user] = await db.insert(users).values({ email: `delete-${suffix}@example.test` }).returning();
  const [otherUser] = await db.insert(users).values({ email: `keep-${suffix}@example.test` }).returning();
  const [site] = await db.insert(sites).values({
    ownerUserId: user.id,
    subdomain: `delete-${suffix}`,
    title: "Delete me",
  }).returning();
  const [otherSite] = await db.insert(sites).values({
    ownerUserId: otherUser.id,
    subdomain: `keep-${suffix}`,
    title: "Keep me",
  }).returning();
  const [object] = await db.insert(contentObjects).values({
    siteId: site.id,
    type: "article",
    slug: "delete-me",
    title: "Delete me",
    status: "draft",
  }).returning();
  await db.insert(assets).values({
    siteId: site.id,
    contentObjectId: object.id,
    storageKey: "",
    variants: {},
  });
  await db.insert(dailyVisitCounts).values({ siteId: site.id, day: "2026-09-27", source: "direct", visits: 1 });
  await db.insert(apFollowers).values({ siteId: site.id, actorUri: `https://remote.test/${suffix}`, inboxUri: "https://remote.test/inbox" });
  await db.insert(siteActorKeys).values({ siteId: site.id, keys: [] });
  await db.insert(apiTokens).values({ userId: user.id, tokenHash: hashToken(token) });
  await db.insert(magicTokens).values({
    email: user.email,
    tokenHash: hashToken(`magic-${suffix}`),
    purpose: "mobile_code",
    expiresAt: new Date(Date.now() + 60_000),
  });
  await db.insert(ownerClaims).values({
    userId: user.id,
    codeHash: hashToken(`claim-${suffix}`),
    expiresAt: new Date(Date.now() + 60_000),
  });

  const app = buildApp();
  const response = await app.inject({
    method: "DELETE",
    url: "/api/v1/account",
    headers: { authorization: `Bearer ${token}` },
    payload: { confirmation: "DELETE" },
  });
  await app.close();

  assert.equal(response.statusCode, 204, response.body);
  assert.equal((await db.select().from(users).where(eq(users.id, user.id))).length, 0);
  assert.equal((await db.select().from(sites).where(eq(sites.id, site.id))).length, 0);
  assert.equal((await db.select().from(contentObjects).where(eq(contentObjects.siteId, site.id))).length, 0);
  assert.equal((await db.select().from(assets).where(eq(assets.siteId, site.id))).length, 0);
  assert.equal((await db.select().from(users).where(eq(users.id, otherUser.id))).length, 1);
  assert.equal((await db.select().from(sites).where(eq(sites.id, otherSite.id))).length, 1);
});
