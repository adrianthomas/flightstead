import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { after, test } from "node:test";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

// Set the isolated database before dynamically importing any application
// modules: db/client.ts opens DATABASE_URL as a module side effect.
const testDirectory = mkdtempSync(join(tmpdir(), "flightstead-object-feed-"));
process.env.DATABASE_URL = join(testDirectory, "test.sqlite");
process.env.BASE_DOMAIN = "object-feed.test";
const migrationDatabase = new Database(process.env.DATABASE_URL);
migrationDatabase.pragma("foreign_keys = ON");
migrate(drizzle(migrationDatabase), { migrationsFolder: resolve("src/db/migrations") });
migrationDatabase.close();

const [{ buildApp }, { db }, schema, { hashToken }] = await Promise.all([
  import("../src/app.js"),
  import("../src/db/client.js"),
  import("../src/db/schema.js"),
  import("../src/auth/tokens.js"),
]);

const { apiTokens, contentObjects, sites, users } = schema;
const date = (value: string) => new Date(value);

after(() => {
  rmSync(testDirectory, { recursive: true, force: true });
});

test("GET /objects feed sort paginates by effective publication/edit date and stable id", async () => {
  const suffix = randomUUID().slice(0, 8);
  const token = `object-feed-token-${suffix}`;
  const [user] = await db.insert(users).values({ email: `feed-${suffix}@example.test` }).returning();
  const [site] = await db.insert(sites).values({
    ownerUserId: user.id,
    subdomain: `feed-${suffix}`,
    title: "Feed ordering",
  }).returning();
  const [otherUser] = await db.insert(users).values({ email: `other-feed-${suffix}@example.test` }).returning();
  const [otherSite] = await db.insert(sites).values({
    ownerUserId: otherUser.id,
    subdomain: `other-feed-${suffix}`,
    title: "Other feed",
  }).returning();
  await db.insert(apiTokens).values({ userId: user.id, tokenHash: hashToken(token) });

  const rows = [
    { id: "00000000-0000-4000-8000-000000000001", slug: "recent-publish", type: "article" as const, status: "published" as const, createdAt: date("2010-01-01T00:00:00.000Z"), updatedAt: date("2026-01-20T00:00:00.000Z"), publishedAt: date("2026-01-10T00:00:00.000Z") },
    { id: "00000000-0000-4000-8000-000000000002", slug: "updated-draft", type: "article" as const, status: "draft" as const, createdAt: date("2009-01-01T00:00:00.000Z"), updatedAt: date("2026-01-09T00:00:00.000Z"), publishedAt: null },
    { id: "00000000-0000-4000-8000-000000000003", slug: "edited-published", type: "article" as const, status: "published" as const, createdAt: date("2008-01-01T00:00:00.000Z"), updatedAt: date("2026-02-01T00:00:00.000Z"), publishedAt: date("2026-01-08T00:00:00.000Z") },
    { id: "00000000-0000-4000-8000-000000000004", slug: "publication-fallback", type: "article" as const, status: "published" as const, createdAt: date("2026-01-07T00:00:00.000Z"), updatedAt: date("2026-02-02T00:00:00.000Z"), publishedAt: null },
    { id: "00000000-0000-4000-8000-000000000005", slug: "tie-one", type: "article" as const, status: "published" as const, createdAt: date("2014-01-01T00:00:00.000Z"), updatedAt: date("2014-01-01T00:00:00.000Z"), publishedAt: date("2026-01-06T00:00:00.000Z") },
    { id: "00000000-0000-4000-8000-000000000006", slug: "tie-two", type: "article" as const, status: "published" as const, createdAt: date("2015-01-01T00:00:00.000Z"), updatedAt: date("2015-01-01T00:00:00.000Z"), publishedAt: date("2026-01-06T00:00:00.000Z") },
    { id: "00000000-0000-4000-8000-000000000007", slug: "tie-three", type: "article" as const, status: "published" as const, createdAt: date("2016-01-01T00:00:00.000Z"), updatedAt: date("2016-01-01T00:00:00.000Z"), publishedAt: date("2026-01-06T00:00:00.000Z") },
    { id: "00000000-0000-4000-8000-000000000008", slug: "link-row", type: "link" as const, status: "published" as const, createdAt: date("2026-01-11T00:00:00.000Z"), updatedAt: date("2026-01-11T00:00:00.000Z"), publishedAt: date("2026-01-11T00:00:00.000Z") },
  ];
  await db.insert(contentObjects).values(rows.map((row) => ({ ...row, siteId: site.id, title: row.slug })));
  await db.insert(contentObjects).values({
    siteId: otherSite.id,
    type: "article",
    slug: "foreign-newest",
    title: "Foreign newest",
    status: "published",
    createdAt: date("2027-01-01T00:00:00.000Z"),
    updatedAt: date("2027-01-01T00:00:00.000Z"),
    publishedAt: date("2027-01-01T00:00:00.000Z"),
  });

  const app = buildApp();
  const request = (url: string, features?: string) => app.inject({
    method: "GET",
    url,
    headers: {
      authorization: `Bearer ${token}`,
      ...(features ? { "x-shareblog-features": features } : {}),
    },
  });

  try {
    const expectedFeedIDs = [rows[7].id, rows[0].id, rows[1].id, rows[2].id, rows[3].id, rows[6].id, rows[5].id, rows[4].id];
    const collected: string[] = [];
    let cursor: string | null = null;
    do {
      const response = await request(`/api/v1/objects?sort=feed&limit=2${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, "link-content-type");
      assert.equal(response.statusCode, 200, response.body);
      const body = response.json();
      collected.push(...body.objects.map((object: { id: string }) => object.id));
      cursor = body.nextCursor;
      if (collected.length === 2) {
        assert.match(cursor ?? "", /^feed:v1:/);
        const decoded = JSON.parse(Buffer.from(cursor!.slice("feed:v1:".length), "base64url").toString("utf8"));
        assert.deepEqual(Object.keys(decoded).sort(), ["effectiveAt", "id", "v"]);
        assert.equal(decoded.v, 1);
      }
    } while (cursor);
    assert.deepEqual(collected, expectedFeedIDs);
    assert.equal(new Set(collected).size, expectedFeedIDs.length, "page boundaries must not duplicate records");

    const noLinkFeature = await request("/api/v1/objects?sort=feed&limit=20");
    assert.equal(noLinkFeature.statusCode, 200);
    assert.equal(noLinkFeature.json().objects.some((object: { type: string }) => object.type === "link"), false);
    const draftFilter = await request("/api/v1/objects?sort=feed&status=draft&limit=20", "link-content-type");
    assert.deepEqual(draftFilter.json().objects.map((object: { id: string }) => object.id), [rows[1].id]);
    const typeFilter = await request("/api/v1/objects?sort=feed&type=article&limit=20", "link-content-type");
    assert.equal(typeFilter.json().objects.some((object: { type: string }) => object.type === "link"), false);
    assert.equal(typeFilter.json().objects.some((object: { title: string }) => object.title === "Foreign newest"), false);

    const legacyExpectedIDs = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((row) => row.id);
    const legacyFirst = await request("/api/v1/objects?limit=2", "link-content-type");
    const legacyFirstBody = legacyFirst.json();
    assert.deepEqual(legacyFirstBody.objects.map((object: { id: string }) => object.id), legacyExpectedIDs.slice(0, 2));
    assert.equal(legacyFirstBody.nextCursor, rows[3].createdAt.toISOString());
    const legacySecond = await request(`/api/v1/objects?limit=2&cursor=${encodeURIComponent(legacyFirstBody.nextCursor)}`, "link-content-type");
    assert.deepEqual(legacySecond.json().objects.map((object: { id: string }) => object.id), legacyExpectedIDs.slice(2, 4));

    const malformed = await request("/api/v1/objects?sort=feed&cursor=not-a-valid-cursor");
    assert.equal(malformed.statusCode, 400);
    assert.deepEqual(malformed.json().error, { code: "invalid_cursor", message: "The feed cursor is invalid." });
    const invalidISODate = await request("/api/v1/objects?sort=feed&cursor=2026-02-30T00%3A00%3A00.000Z");
    assert.equal(invalidISODate.statusCode, 400);
    const oversizedID = Buffer.from(JSON.stringify({ v: 1, effectiveAt: "2026-01-01T00:00:00.000Z", id: "x".repeat(129) })).toString("base64url");
    const oversizedCursor = await request(`/api/v1/objects?sort=feed&cursor=${encodeURIComponent(`feed:v1:${oversizedID}`)}`);
    assert.equal(oversizedCursor.statusCode, 400);
    const rawLegacyCursor = await request(`/api/v1/objects?sort=feed&cursor=${encodeURIComponent(rows[0].createdAt.toISOString())}&limit=2`, "link-content-type");
    assert.equal(rawLegacyCursor.statusCode, 200, rawLegacyCursor.body);
  } finally {
    await app.close();
    await db.delete(contentObjects).where(eq(contentObjects.siteId, site.id));
    await db.delete(contentObjects).where(eq(contentObjects.siteId, otherSite.id));
    await db.delete(apiTokens).where(eq(apiTokens.userId, user.id));
    await db.delete(sites).where(eq(sites.id, site.id));
    await db.delete(sites).where(eq(sites.id, otherSite.id));
    await db.delete(users).where(eq(users.id, user.id));
    await db.delete(users).where(eq(users.id, otherUser.id));
  }
});
