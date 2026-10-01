import assert from "node:assert/strict";
import test from "node:test";
import { renderList, renderObjectPage } from "../src/render/render.js";
import type { ContentObject, Site } from "../src/render/templates/types.js";

const site = { id: "think-site", title: "A personal journal", subdomain: "think", locale: "en", theme: "think", federationEnabled: false } as Site;
const date = new Date("2026-10-01T10:00:00Z");
function post(type: ContentObject["type"], fields: Partial<ContentObject> = {}): ContentObject {
  return { id: type, siteId: site.id, type, slug: type, title: null, body: null, status: "published", sourceUrl: null, metadata: {}, publishedAt: date, createdAt: date, updatedAt: date, ...fields };
}

test("Think gives every content type a permalink without swallowing authored links", async () => {
  const objects = [
    post("article", { title: "An <unexpected> idea", body: "A longer essay.", metadata: { excerpt: "An introduction." } }),
    post("thought", { body: "An **observation** with [a reference](https://example.com/reference)." }),
    post("book", { title: "A book", metadata: { author: "A Writer" } }),
    post("music", { metadata: { releaseTitle: "A record", artist: "A Musician" } }),
    post("photo", { metadata: { caption: "An afternoon.", altText: "The view." } }),
    post("quote", { body: "Pay attention.", metadata: { author: "An Observer", comment: "Worth remembering." } }),
    post("link", { title: "An outside reference", sourceUrl: "https://example.com/source", body: "My note." }),
  ];
  const html = await renderList(site, "Home", objects, "/", undefined, { totalPages: 2 });
  const prefixes = ["articles", "posts", "books", "music", "photos", "quotes", "links"];
  objects.forEach((object, index) => {
    assert.ok(html.includes(`class="think-entry" data-type="${object.type}"`));
    assert.ok(html.includes(`class="think-entry-action" href="/${prefixes[index]}/${object.slug}"`));
  });
  assert.match(html, /An &lt;unexpected&gt; idea/);
  assert.match(html, /<strong>observation<\/strong>/);
  assert.match(html, /href="https:\/\/example.com\/reference"/);
  assert.match(html, /href="https:\/\/example.com\/source"/);
  assert.match(html, /href="\/\?page=2"/);
  assert.doesNotMatch(html, /data-cards-card|data-cabinet-card/);
  for (const object of objects) {
    const detail = await renderObjectPage(site, object);
    assert.match(detail, /class="back-link" href="\/"/);
    assert.doesNotMatch(detail, /class="think-entry"/);
  }
});

test("Think preserves hidden media, safe URLs, and localized empty/filter states", async () => {
  const objects = [
    post("book", { title: "Hidden cover", metadata: { author: "Writer", coverUrl: "https://example.com/private-cover", showCover: false } }),
    post("music", { metadata: { artist: "Musician", releaseTitle: "Hidden art", artworkUrl: "https://example.com/private-art", showArtwork: false } }),
    post("link", { title: "Hidden preview", sourceUrl: "javascript:alert(1)", body: "[Unsafe](javascript:alert)", metadata: { previewImageUrl: "https://example.com/private-preview", showPreview: false } }),
  ];
  for (const html of [await renderList(site, "Home", objects), ...await Promise.all(objects.map(object => renderObjectPage(site, object)))]) {
    assert.doesNotMatch(html, /private-cover|private-art|private-preview|href="javascript:/);
  }
  const empty = await renderList({ ...site, locale: "de" }, "Artikel", [], "/articles", ["/articles"]);
  assert.match(empty, /Hier gibt es noch nichts\./);
  assert.match(empty, /aria-current="page"[^>]*>Artikel/);
});
