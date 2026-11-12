import assert from "node:assert/strict";
import test, { after } from "node:test";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";

const testDirectory = mkdtempSync(join(tmpdir(), "flightstead-draft-preview-"));
process.env.DATABASE_URL = join(testDirectory, "test.sqlite");
process.env.BASE_DOMAIN = "draft-preview.test";
const migrationDatabase = new Database(process.env.DATABASE_URL);
migrationDatabase.pragma("foreign_keys = ON");
const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
migrate((await import("drizzle-orm/better-sqlite3")).drizzle(migrationDatabase), { migrationsFolder: resolve("src/db/migrations") });
migrationDatabase.close();

const [{ buildApp }, { createDraftPreviewToken, verifyDraftPreviewToken }, { hashToken }, { db }, schema] = await Promise.all([
  import("../src/app.js"),
  import("../src/auth/draft-preview.js"),
  import("../src/auth/tokens.js"),
  import("../src/db/client.js"),
  import("../src/db/schema.js"),
]);
const { apiTokens, contentObjects, dailyVisitCounts, sites, users } = schema;

after(() => rmSync(testDirectory, { recursive: true, force: true }));

test("draft preview capabilities are bound to their object, site, and expiry", () => {
  const now = Date.UTC(2026, 10, 12);
  const siteId = randomUUID();
  const objectId = randomUUID();
  const { token, expiresAt } = createDraftPreviewToken(siteId, objectId, now);

  assert.equal(expiresAt.getTime(), now + 24 * 60 * 60 * 1000);
  assert.equal(verifyDraftPreviewToken(token, siteId, objectId, now), true);
  assert.equal(verifyDraftPreviewToken(token, siteId, objectId, expiresAt.getTime() - 1), true);
  assert.equal(verifyDraftPreviewToken(token, siteId, objectId, expiresAt.getTime()), false);
  assert.equal(verifyDraftPreviewToken(token, randomUUID(), objectId, now), false);
  assert.equal(verifyDraftPreviewToken(token, siteId, randomUUID(), now), false);
  assert.equal(verifyDraftPreviewToken(`${token}x`, siteId, objectId, now), false);
});

test("draft preview URLs render the live draft privately without exposing drafts publicly", async () => {
  const suffix = randomUUID().slice(0, 8);
  const userId = randomUUID();
  const siteId = randomUUID();
  const otherUserId = randomUUID();
  const otherSiteId = randomUUID();
  const foreignDraftId = randomUUID();
  const token = `draft-preview-${suffix}`;
  const host = `preview-${suffix}.draft-preview.test`;
  const draftId = randomUUID();
  const publishedId = randomUUID();
  const secret = `unlisted-preview-content-${suffix}`;

  await db.insert(users).values([
    { id: userId, email: `preview-${suffix}@example.test` },
    { id: otherUserId, email: `preview-other-${suffix}@example.test` },
  ]);
  await db.insert(sites).values([
    { id: siteId, ownerUserId: userId, subdomain: `preview-${suffix}`, title: "Preview Test", statsEnabled: true },
    { id: otherSiteId, ownerUserId: otherUserId, subdomain: `preview-other-${suffix}`, title: "Other Preview Test" },
  ]);
  await db.insert(apiTokens).values({ userId, tokenHash: hashToken(token) });
  await db.insert(contentObjects).values([
    { id: draftId, siteId, type: "article", slug: `preview-${suffix}`, title: "Preview Draft", body: secret, status: "draft", metadata: {}, publishedAt: null },
    { id: publishedId, siteId, type: "article", slug: `published-${suffix}`, title: "Already Published", status: "published", metadata: {}, publishedAt: new Date() },
    { id: foreignDraftId, siteId: otherSiteId, type: "article", slug: `foreign-${suffix}`, title: "Foreign Draft", status: "draft", metadata: {}, publishedAt: null },
  ]);

  const app = buildApp();
  const ownerHeaders = { authorization: `Bearer ${token}` };
  const previewHeaders = { host, "user-agent": "Safari" };
  try {
    const unauthenticated = await app.inject({ method: "POST", url: `/api/v1/objects/${draftId}/preview` });
    assert.equal(unauthenticated.statusCode, 401);

    const foreignRequest = await app.inject({
      method: "POST", url: `/api/v1/objects/${foreignDraftId}/preview`, headers: ownerHeaders,
    });
    assert.equal(foreignRequest.statusCode, 404);

    const publishedRequest = await app.inject({
      method: "POST", url: `/api/v1/objects/${publishedId}/preview`, headers: ownerHeaders,
    });
    assert.equal(publishedRequest.statusCode, 404);

    const issued = await app.inject({
      method: "POST", url: `/api/v1/objects/${draftId}/preview`, headers: ownerHeaders,
    });
    assert.equal(issued.statusCode, 200, issued.body);
    assert.match(issued.headers["cache-control"] ?? "", /private/);
    assert.match(issued.headers["cache-control"] ?? "", /no-store/);
    const { url, expiresAt } = issued.json();
    assert.equal(expiresAt, new Date(expiresAt).toISOString());
    const previewUrl = new URL(url);
    assert.equal(previewUrl.origin, `https://${host}`);
    assert.equal(previewUrl.pathname, `/preview/${draftId}`);
    assert.ok(previewUrl.searchParams.get("token"));

    const renderPreview = () => app.inject({
      method: "GET", url: `${previewUrl.pathname}${previewUrl.search}`, headers: previewHeaders,
    });
    const preview = await renderPreview();
    assert.equal(preview.statusCode, 200, preview.body);
    assert.match(preview.body, new RegExp(secret));
    assert.match(preview.body, /name="robots" content="noindex,follow"/);
    assert.match(preview.headers["cache-control"] ?? "", /private/);
    assert.match(preview.headers["cache-control"] ?? "", /no-store/);
    assert.match(preview.headers["x-robots-tag"] ?? "", /noindex/);
    assert.match(preview.headers["referrer-policy"] ?? "", /no-referrer/);

    const visitsAfterPreview = await db.select().from(dailyVisitCounts).where(eq(dailyVisitCounts.siteId, siteId));
    assert.deepEqual(visitsAfterPreview, []);

    const changedSecret = `${secret}-after-save`;
    await db.update(contentObjects).set({ body: changedSecret, updatedAt: new Date() }).where(eq(contentObjects.id, draftId));
    const updatedPreview = await renderPreview();
    assert.equal(updatedPreview.statusCode, 200);
    assert.match(updatedPreview.body, new RegExp(changedSecret));

    const tampered = await app.inject({
      method: "GET", url: `${previewUrl.pathname}?token=${previewUrl.searchParams.get("token")}x`, headers: previewHeaders,
    });
    assert.equal(tampered.statusCode, 404);
    const missingToken = await app.inject({ method: "GET", url: previewUrl.pathname, headers: previewHeaders });
    assert.equal(missingToken.statusCode, 404);
    const wrongObject = await app.inject({
      method: "GET", url: `/preview/${publishedId}${previewUrl.search}`, headers: previewHeaders,
    });
    assert.equal(wrongObject.statusCode, 404);
    const wrongSite = await app.inject({
      method: "GET", url: `${previewUrl.pathname}${previewUrl.search}`,
      headers: { host: `preview-other-${suffix}.draft-preview.test`, "user-agent": "Safari" },
    });
    assert.equal(wrongSite.statusCode, 404);
    const expired = createDraftPreviewToken(siteId, draftId, Date.now() - 25 * 60 * 60 * 1000);
    const expiredRequest = await app.inject({
      method: "GET", url: `${previewUrl.pathname}?token=${encodeURIComponent(expired.token)}`, headers: previewHeaders,
    });
    assert.equal(expiredRequest.statusCode, 404);

    const ordinaryDetail = await app.inject({ method: "GET", url: `/articles/preview-${suffix}`, headers: previewHeaders });
    assert.equal(ordinaryDetail.statusCode, 404);
    const home = await app.inject({ method: "GET", url: "/", headers: previewHeaders });
    assert.equal(home.statusCode, 200);
    assert.doesNotMatch(home.body, new RegExp(secret));
    const feed = await app.inject({ method: "GET", url: "/feed.xml", headers: previewHeaders });
    assert.equal(feed.statusCode, 200);
    assert.doesNotMatch(feed.body, new RegExp(secret));
    const listing = await app.inject({ method: "GET", url: "/articles", headers: previewHeaders });
    assert.equal(listing.statusCode, 200);
    assert.doesNotMatch(listing.body, new RegExp(secret));
    const archive = await app.inject({ method: "GET", url: "/archive", headers: previewHeaders });
    assert.equal(archive.statusCode, 200);
    assert.doesNotMatch(archive.body, new RegExp(secret));
    const search = await app.inject({ method: "GET", url: `/search?q=${encodeURIComponent("unlisted-preview-content")}`, headers: previewHeaders });
    assert.equal(search.statusCode, 200);
    assert.doesNotMatch(search.body, new RegExp(secret));
    const sitemap = await app.inject({ method: "GET", url: "/sitemap.xml", headers: previewHeaders });
    assert.equal(sitemap.statusCode, 200);
    assert.doesNotMatch(sitemap.body, new RegExp(`/${draftId}`));
    assert.doesNotMatch(sitemap.body, new RegExp(`/articles/preview-${suffix}`));
    const outbox = await app.inject({
      method: "GET", url: `/users/preview-${suffix}/outbox`, headers: { ...previewHeaders, accept: "application/activity+json" },
    });
    assert.equal(outbox.statusCode, 200, outbox.body);
    assert.doesNotMatch(outbox.body, new RegExp(secret));

    const customDomain = `custom-${suffix}.draft-preview.test`;
    const customDomainUpdate = await app.inject({
      method: "PATCH", url: "/api/v1/sites", headers: ownerHeaders,
      payload: { customDomain },
    });
    assert.equal(customDomainUpdate.statusCode, 200, customDomainUpdate.body);
    const customPreviewIssue = await app.inject({
      method: "POST", url: `/api/v1/objects/${draftId}/preview`, headers: ownerHeaders,
    });
    assert.equal(customPreviewIssue.statusCode, 200);
    const customPreviewURL = new URL(customPreviewIssue.json().url);
    assert.equal(customPreviewURL.origin, `https://${customDomain}`);
    const customPreview = await app.inject({
      method: "GET", url: `${customPreviewURL.pathname}${customPreviewURL.search}`,
      headers: { host: customDomain, "user-agent": "Safari" },
    });
    assert.equal(customPreview.statusCode, 200, customPreview.body);
    assert.match(customPreview.body, new RegExp(changedSecret));

    await db.update(contentObjects).set({ status: "published", publishedAt: new Date() }).where(eq(contentObjects.id, draftId));
    const publishedPreview = await app.inject({
      method: "GET", url: `${customPreviewURL.pathname}${customPreviewURL.search}`,
      headers: { host: customDomain, "user-agent": "Safari" },
    });
    assert.equal(publishedPreview.statusCode, 404);

    await db.delete(contentObjects).where(eq(contentObjects.id, draftId));
    const deletedPreview = await app.inject({
      method: "GET", url: `${customPreviewURL.pathname}${customPreviewURL.search}`,
      headers: { host: customDomain, "user-agent": "Safari" },
    });
    assert.equal(deletedPreview.statusCode, 404);

    const visits = await db.select().from(dailyVisitCounts).where(eq(dailyVisitCounts.siteId, siteId));
    assert.equal(visits.some((row) => row.contentObjectId === draftId), false);
  } finally {
    await app.close();
  }
});
