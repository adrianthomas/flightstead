import assert from "node:assert/strict";
import { after, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { ContentObject, Site } from "../src/render/templates/types.js";

const testDirectory = mkdtempSync(join(tmpdir(), "flightstead-quick-post-render-"));
process.env.DATABASE_URL = join(testDirectory, "test.sqlite");
process.env.BASE_DOMAIN = "quick-render.test";
const migrationDatabase = new Database(process.env.DATABASE_URL);
migrate(drizzle(migrationDatabase), { migrationsFolder: resolve("src/db/migrations") });
migrationDatabase.close();
const { feedItemContent, feedTitle, renderList, renderObjectPage } = await import("../src/render/render.js");
after(() => rmSync(testDirectory, { recursive: true, force: true }));

const themes = ["classic", "cards", "washi", "prism", "ledger", "cabinet", "stream", "marquee", "aqua", "think"] as const;
const privateTitle = "Private retained headline";
const privateExcerpt = "Private retained excerpt";
const coverDescription = "private-cover-description";

function quickPost(body: string, slug = "quick-update"): ContentObject {
  return {
    id: `article-${slug}`,
    siteId: "site-1",
    type: "article",
    slug,
    title: privateTitle,
    body,
    status: "published",
    sourceUrl: null,
    metadata: { quickPost: true, excerpt: privateExcerpt, coverAssetId: "missing-cover", coverAltText: coverDescription },
    publishedAt: new Date("2026-11-17T10:00:00Z"),
    createdAt: new Date("2026-11-17T10:00:00Z"),
    updatedAt: new Date("2026-11-17T10:00:00Z"),
  } as ContentObject;
}

function site(theme: typeof themes[number]): Site {
  return {
    id: "site-1",
    title: "Quick Post Test Site",
    tagline: null,
    introduction: null,
    profileImageUrl: null,
    subdomain: "quick-test",
    customDomain: null,
    locale: "en",
    theme,
  } as Site;
}

function assertHiddenArticleFields(html: string, surface: string) {
  assert.ok(!html.includes(privateTitle), `${surface} exposed the retained title`);
  assert.ok(!html.includes(privateExcerpt), `${surface} exposed the retained excerpt`);
  assert.ok(!html.includes(coverDescription), `${surface} exposed retained cover metadata`);
}

test("short Quick Posts show their complete body with a date permalink in every theme", async () => {
  const body = "A short update with **bold words** and a [useful link](https://example.test).";
  const object = quickPost(body);

  for (const theme of themes) {
    const listing = await renderList(site(theme), "Home", [object]);
    assert.match(listing, /data-quick-post/ , `${theme} omitted the Quick Post marker`);
    assert.match(listing, /A short update with/);
    assert.match(listing, /<strong>bold words<\/strong>/);
    assert.match(listing, /href="\/articles\/quick-update(?:\?|\")/);
    assert.doesNotMatch(listing, /<a class="[^"]*quick-post-read-more/);
    assertHiddenArticleFields(listing, `${theme} listing`);

    const detail = await renderObjectPage(site(theme), object);
    assert.match(detail, /A short update with/);
    assert.match(detail, /<strong>bold words<\/strong>/);
    assertHiddenArticleFields(detail, `${theme} detail`);
  }
});

test("long Quick Posts use a 500-character preview in every theme and retain full RSS and federation content", async () => {
  const tail = "final complete-body phrase";
  const body = `${"visible text ".repeat(45)}${tail}`;
  const object = quickPost(body, "long-update");

  for (const theme of themes) {
    const listing = await renderList(site(theme), "Home", [object]);
    assert.match(listing, /data-quick-post-truncated="true"/, `${theme} did not mark a long Quick Post`);
    assert.match(listing, /<a class="[^"]*quick-post-read-more[^"]*"[^>]*>Read more/i, `${theme} omitted the long-post action`);
    assert.doesNotMatch(listing, new RegExp(tail));
    assertHiddenArticleFields(listing, `${theme} long listing`);

    const detail = await renderObjectPage(site(theme), object);
    assert.match(detail, new RegExp(tail));
    assertHiddenArticleFields(detail, `${theme} long detail`);
  }

  const rssAndActivityPubContent = await feedItemContent(object, "en");
  assert.match(rssAndActivityPubContent, new RegExp(tail));
  assertHiddenArticleFields(rssAndActivityPubContent, "RSS and ActivityPub content");
  assert.match(feedTitle(object, "en"), /^Quick Post:/);
  assert.doesNotMatch(feedTitle(object, "en"), new RegExp(privateTitle));
});
