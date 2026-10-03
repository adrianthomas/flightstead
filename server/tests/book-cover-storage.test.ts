import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { db } from "../src/db/client.js";
import { assets, sites, users } from "../src/db/schema.js";
import { materializeBookCoverMetadata, mergeBookCoverMetadata } from "../src/lib/book-cover.js";
import { createObjectSchema } from "../src/lib/schemas.js";
import { assertOwnedAssets } from "../src/routes/objects.js";

test("book cover materialization rebuilds the URL from an owned asset and retains metadata", async () => {
  const suffix = randomUUID().slice(0, 8);
  const [user] = await db.insert(users).values({ email: `book-cover-${suffix}@example.test` }).returning();
  const [site] = await db.insert(sites).values({ ownerUserId: user.id, subdomain: `book-cover-${suffix}`, title: "Books" }).returning();
  const assetId = randomUUID();
  await db.insert(assets).values({
    id: assetId,
    siteId: site.id,
    storageKey: `${site.id}/${assetId}/original.jpg`,
    variants: { original: `${site.id}/${assetId}/original.jpg` },
    width: 600,
    height: 900,
  });

  const metadata = await materializeBookCoverMetadata(site.id, {
    author: "A. Writer",
    source: "apple_books",
    rating: 4,
    showCover: false,
    comment: "Keep this note.",
    coverAssetId: assetId,
    coverUrl: "https://attacker.example/replacement.jpg",
  });

  assert.equal(metadata.author, "A. Writer");
  assert.equal(metadata.source, "apple_books");
  assert.equal(metadata.rating, 4);
  assert.equal(metadata.showCover, false);
  assert.equal(metadata.comment, "Keep this note.");
  assert.equal(metadata.coverAssetId, assetId);
  assert.equal(metadata.coverUrl, `http://localhost:3000/files/${site.id}/${assetId}/original.jpg`);
});

test("book cover import refuses private URLs and drops remote cover metadata", async () => {
  const warnings: unknown[] = [];
  const metadata = await materializeBookCoverMetadata("site", {
    author: "A. Writer",
    source: "apple_books",
    coverUrl: "http://127.0.0.1:9/private-cover.jpg",
    showCover: false,
  }, { warn: (...args: unknown[]) => warnings.push(args) } as never);

  assert.equal(metadata.author, "A. Writer");
  assert.equal(metadata.source, "apple_books");
  assert.equal(metadata.showCover, false);
  assert.equal(metadata.coverUrl, undefined);
  assert.equal(metadata.coverAssetId, undefined);
  assert.equal(warnings.length, 1);
});

test("book object asset validation rejects an asset owned by another site", async () => {
  const suffix = randomUUID().slice(0, 8);
  const [owner] = await db.insert(users).values({ email: `foreign-cover-${suffix}@example.test` }).returning();
  const [otherOwner] = await db.insert(users).values({ email: `foreign-cover-other-${suffix}@example.test` }).returning();
  const [site] = await db.insert(sites).values({ ownerUserId: owner.id, subdomain: `foreign-cover-${suffix}`, title: "Books" }).returning();
  const [otherSite] = await db.insert(sites).values({ ownerUserId: otherOwner.id, subdomain: `foreign-cover-other-${suffix}`, title: "Other" }).returning();
  const assetId = randomUUID();
  await db.insert(assets).values({
    id: assetId,
    siteId: otherSite.id,
    storageKey: `${otherSite.id}/${assetId}/original.jpg`,
    variants: {},
  });

  await assert.rejects(
    assertOwnedAssets(site.id, { coverAssetId: assetId }),
    /Referenced asset does not belong to this site/,
  );
});

test("book metadata accepts the Apple Books resolver source", () => {
  const parsed = createObjectSchema.parse({
    type: "book",
    title: "A Book",
    metadata: { author: "A. Writer", source: "apple_books" },
  });
  assert.equal(parsed.metadata.source, "apple_books");
});

test("book metadata PATCH can reenable a cached cover and clear the rating", () => {
  const merged = mergeBookCoverMetadata(
    { author: "A. Writer", source: "apple_books", showCover: false, rating: 5, coverAssetId: "asset-id", coverUrl: "https://local.test/cover.jpg" },
    { author: "A. Writer", source: "apple_books" },
  );
  assert.equal(merged.coverAssetId, "asset-id");
  assert.equal(merged.coverUrl, "https://local.test/cover.jpg");
  assert.equal(merged.showCover, undefined);
  assert.equal(merged.rating, undefined);
});
