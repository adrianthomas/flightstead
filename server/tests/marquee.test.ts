import assert from "node:assert/strict";
import test from "node:test";
import { renderMarqueeMenu, renderList, renderObjectPage } from "../src/render/render.js";
import type { ContentObject, Site } from "../src/render/templates/types.js";

const site = {
  id: "fr-site", title: "Marquee Notes", subdomain: "fr", locale: "en", theme: "marquee",
  tagline: "A stage for notes", federationEnabled: false,
} as Site;
const date = new Date("2026-09-24T10:00:00Z");
function post(type: ContentObject["type"], fields: Partial<ContentObject> = {}): ContentObject {
  return {
    id: type, siteId: site.id, type, slug: type, title: null, body: null,
    status: "published", sourceUrl: null, metadata: {}, publishedAt: date,
    createdAt: date, updatedAt: date, ...fields,
  };
}
const objects = [
  post("music", { body: "A note.", metadata: { artist: "An Artist", releaseTitle: "A Quiet Record", links: { appleMusic: "https://music.apple.com/us/album/x/1" } } }),
  post("book", { title: "A Book", body: "Review.", metadata: { author: "A. Reader", rating: 4 } }),
  post("quote", { body: "Pay attention.", metadata: { author: "An Observer" } }),
  post("photo", { metadata: { assetId: "missing", caption: "A caption" } }),
  post("link", { title: "A Link", sourceUrl: "https://example.com/a", body: "Commentary." }),
  post("article", { title: "An Essay", body: "Opening.\n\n## Part two\n\nEnding." }),
  post("thought", { body: "Short thought." }),
];

test("Marquee menu is a dark, scoped stage with section links", () => {
  const html = renderMarqueeMenu(site, ["/music", "/books"]);
  assert.match(html, /<meta name="color-scheme" content="dark"\/>/);
  assert.match(html, /<h1 class="fr-display">Marquee Notes<\/h1>/);
  assert.match(html, /<link rel="canonical" href="[^"]*\/menu"\/>/);
  assert.match(html, /<a class="fr-row fr-row--menu" href="\/music"/);
  assert.doesNotMatch(html, /href="\/photos"/);
  assert.match(html, /theme-marquee/);
});

test("Marquee lists carry list context, dates, and a More row", async () => {
  const html = await renderList(site, "All", objects, "/", undefined, { page: 1, totalPages: 2 });
  assert.match(html, /<h1 class="fr-display">All<\/h1>/);
  assert.match(html, /href="\/music\/music\?from=all"/);
  assert.match(html, /href="\/\?page=2"[^>]*rel="next"|rel="next"[^>]*href="\/\?page=2"/);
  assert.match(html, /id="r-quote"/);
  const music = await renderList(site, "Music", [objects[0]], "/music");
  assert.match(music, /href="\/music\/music"/);
  assert.doesNotMatch(music, /from=/);
});

test("Marquee detail pages use the three layouts and the pager", async () => {
  const nav = { kind: "all" as const, label: "All", listHref: "/#r-music", position: 2, total: 5, prevHref: "/books/book?from=all", nextHref: "/quotes/quote?from=all" };
  const music = await renderObjectPage(site, objects[0], "/music/music", undefined, nav);
  assert.match(music, /<h1 class="fr-detail-title">A Quiet Record<\/h1>/);
  assert.match(music, /apple-music\.png|listen-on-apple-music\.png/);
  assert.match(music, /2 of 5/);
  assert.match(music, /rel="prev" href="\/books\/book\?from=all"/);
  assert.match(music, /<link rel="canonical" href="[^"]*\/music\/music"\/>/);
  const quote = await renderObjectPage(site, objects[2], "/quotes/quote", undefined, nav);
  assert.match(quote, /<blockquote class="fr-quote">/);
  assert.match(quote, /— An Observer/);
  const photo = await renderObjectPage(site, objects[3], "/photos/photo", undefined, nav);
  assert.match(photo, /fr-photo-stage/);
  const book = await renderObjectPage(site, objects[1], "/books/book");
  assert.match(book, /aria-label="Rating: 4 out of 5 stars"/);
  const article = await renderObjectPage(site, objects[5], "/articles/article");
  assert.match(article, /Part two/);
  assert.doesNotMatch(article, /class="fr-pager/);
});

test("Marquee honors hidden artwork and unsafe links", async () => {
  const hidden = [
    post("book", { title: "Hidden", metadata: { author: "W", coverUrl: "https://example.com/private-cover.jpg", showCover: false } }),
    post("music", { metadata: { artist: "M", releaseTitle: "H", artworkUrl: "https://example.com/private-art.jpg", showArtwork: false } }),
    post("link", { title: "L", sourceUrl: "javascript:alert(1)", metadata: { previewImageUrl: "https://example.com/private-preview.jpg", showPreview: false } }),
  ];
  for (const html of [await renderList(site, "All", hidden, "/"), ...await Promise.all(hidden.map((o) => renderObjectPage(site, o)))]) {
    assert.doesNotMatch(html, /private-cover|private-art|private-preview/);
    assert.doesNotMatch(html, /href="javascript:/);
  }
});

test("Marquee localizes empty lists", async () => {
  const html = await renderList({ ...site, locale: "de" }, "Alle", [], "/");
  assert.match(html, /Hier gibt es noch nichts\./);
  assert.match(html, /href="\/menu"[^>]*>.*Menü/);
});
