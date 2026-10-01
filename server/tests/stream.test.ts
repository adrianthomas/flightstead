import assert from "node:assert/strict";
import test from "node:test";
import { renderList, renderObjectPage } from "../src/render/render.js";
import type { ContentObject, Site } from "../src/render/templates/types.js";

const site = {
  id: "stream-site", title: "A place to think", subdomain: "stream", locale: "en",
  theme: "stream", tagline: "Notes from everyday life", federationEnabled: false,
} as Site;
const date = new Date("2026-09-24T10:00:00Z");
function post(type: ContentObject["type"], fields: Partial<ContentObject> = {}): ContentObject {
  return {
    id: type, siteId: site.id, type, slug: type, title: null, body: null,
    status: "published", sourceUrl: null, metadata: {}, publishedAt: date,
    createdAt: date, updatedAt: date, ...fields,
  };
}

test("Stream exposes complete mixed content in listings and direct URLs", async () => {
  const ending = "This final paragraph belongs on the homepage, too.";
  const objects = [
    post("article", { title: "Taking the long way", body: `${"An opening thought. ".repeat(25)}\n\n## A second thought\n\n- One useful idea\n- Another idea\n\n${ending}`, metadata: { excerpt: "A short introduction." } }),
    post("thought", { body: "A **small observation** with [a reference](https://example.com/reference)." }),
    post("book", { title: "A book worth keeping", body: "The complete reading note.", metadata: { author: "A. Reader", rating: 4 } }),
    post("music", { body: "The complete listening note.", metadata: { artist: "An Artist", releaseTitle: "A Quiet Record", links: { appleMusic: "https://music.apple.com/us/album/a-quiet-record/123" } } }),
    post("photo", { metadata: { caption: "A caption with its own voice.", altText: "An unrelated description." } }),
    post("quote", { body: "Pay attention to ordinary things.", metadata: { author: "An Observer", comment: "The complete reflection." } }),
    post("link", { title: "A saved reference", sourceUrl: "https://example.com/source", body: "The complete saved note.", metadata: { excerpt: "What the source is about." } }),
  ];
  const html = await renderList(site, "Home", objects, "/", undefined, { totalPages: 2 });
  for (const text of [ending, "The complete reading note.", "The complete listening note.", "A caption with its own voice.", "The complete reflection.", "The complete saved note.", "What the source is about."]) assert.ok(html.includes(text), text);
  assert.match(html, /<strong>small observation<\/strong>/);
  assert.match(html, /<h[23]>A second thought<\/h[23]>/);
  assert.match(html, /<li>One useful idea<\/li>/);
  assert.match(html, /href="https:\/\/example.com\/reference"/);
  assert.match(html, /href="https:\/\/example.com\/source"/);
  assert.match(html, /href="\/articles\/article"/);
  assert.match(html, /href="\/\?page=2"/);
  assert.doesNotMatch(html, /data-cards-card|data-cabinet-card/);
  const page = await renderObjectPage(site, objects[0]);
  assert.match(page, /<h1[^>]*>Taking the long way<\/h1>/);
  assert.ok(page.includes(ending));
  assert.match(page, /class="back-link" href="\/"/);
});

test("Stream honors hidden media and does not emit unsafe authored URLs", async () => {
  const objects = [
    post("book", { title: "Hidden cover", metadata: { author: "Writer", coverUrl: "https://example.com/private-cover.jpg", showCover: false } }),
    post("music", { metadata: { artist: "Musician", releaseTitle: "Hidden art", artworkUrl: "https://example.com/private-art.jpg", showArtwork: false } }),
    post("link", { title: "Hidden preview", sourceUrl: "javascript:alert(1)", body: "[Unsafe](javascript:alert)", metadata: { previewImageUrl: "https://example.com/private-preview.jpg", showPreview: false } }),
  ];
  for (const html of [await renderList(site, "Home", objects), ...await Promise.all(objects.map(object => renderObjectPage(site, object)))]) {
    assert.doesNotMatch(html, /private-cover|private-art|private-preview/);
    assert.doesNotMatch(html, /href="javascript:/);
  }
});

test("Stream preserves localized empty and filtered listings", async () => {
  const html = await renderList({ ...site, locale: "de" }, "Artikel", [], "/articles", ["/articles"]);
  assert.match(html, /Hier gibt es noch nichts\./);
  assert.match(html, /aria-current="page"[^>]*>Artikel/);
});
