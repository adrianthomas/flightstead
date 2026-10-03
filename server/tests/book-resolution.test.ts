import assert from "node:assert/strict";
import dns from "node:dns/promises";
import { syncBuiltinESMExports } from "node:module";
import { after, afterEach, before, mock, test } from "node:test";
import nock from "nock";
import { resolveBook } from "../src/resolvers/book.js";

nock.disableNetConnect();

before(() => {
  // Source-page resolution checks DNS before requesting the page. Keep that
  // check deterministic while Nock blocks every unmocked HTTP request.
  mock.method(dns, "lookup", async () => [{ address: "93.184.216.34", family: 4 }]);
  syncBuiltinESMExports();
});

afterEach(() => {
  const pending = nock.pendingMocks();
  nock.cleanAll();
  assert.deepEqual(pending, [], "all mocked HTTP requests should be consumed");
});

after(() => {
  mock.restoreAll();
  syncBuiltinESMExports();
  nock.enableNetConnect();
});

const appleBook = {
  trackId: 123456,
  trackName: "The Quiet Library",
  artistName: "A. Reader",
  artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Book/100x100bb.jpg",
  trackViewUrl: "https://books.apple.com/us/book/the-quiet-library/id123456",
};

function scrape(url: string, title: string) {
  return nock(new URL(url).origin).get(new URL(url).pathname).reply(200, `<!doctype html><html><head><title>${title}</title><meta property="og:title" content="${title}"></head><body></body></html>`, {
    "Content-Type": "text/html",
  });
}

function appleSearch(term: string, results: unknown[], status = 200) {
  return nock("https://itunes.apple.com")
    .get("/search")
    .query((query) => query.term === term && query.media === "ebook" && query.entity === "ebook")
    .reply(status, { results });
}

function openLibrary(query: string, docs: unknown[]) {
  return nock("https://openlibrary.org")
    .get("/search.json")
    .query((params) => params.q === query)
    .reply(200, { docs });
}

test("Kobo URL scrapes its title and returns the matching catalog book", async () => {
  scrape("https://www.kobo.com/us/en/ebook/the-quiet-library", "The Quiet Library");
  appleSearch("The Quiet Library", [appleBook]);

  const [book] = await resolveBook("https://www.kobo.com/us/en/ebook/the-quiet-library");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.author, "A. Reader");
  assert.equal(book?.source, "apple_books");
  assert.equal(book?.coverUrl, "https://is1-ssl.mzstatic.com/image/thumb/Book/600x600bb.jpg");
  assert.equal(book?.links.appleBooks, appleBook.trackViewUrl);
});

test("Amazon URL scrapes its title and returns the matching catalog book", async () => {
  scrape("https://www.amazon.com/dp/B0QUIET123", "The Quiet Library: A Novel");
  appleSearch("The Quiet Library: A Novel", [appleBook]);

  const [book] = await resolveBook("https://www.amazon.com/dp/B0QUIET123");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.source, "apple_books");
  assert.equal(book?.author, appleBook.artistName);
  assert.equal(book?.coverUrl, appleBook.artworkUrl100.replace("100x100", "600x600"));
  assert.equal(book?.links.appleBooks, appleBook.trackViewUrl);
});

test("Libby URL scrapes its title and returns the matching catalog book", async () => {
  scrape("https://libbyapp.com/library/central/ebook/12345", "The Quiet Library");
  appleSearch("The Quiet Library", [appleBook]);

  const [book] = await resolveBook("https://libbyapp.com/library/central/ebook/12345");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.source, "apple_books");
  assert.equal(book?.author, appleBook.artistName);
  assert.equal(book?.coverUrl, appleBook.artworkUrl100.replace("100x100", "600x600"));
  assert.equal(book?.links.appleBooks, appleBook.trackViewUrl);
});

test("Amazon ISBN URLs skip title lookup and resolve through Open Library", async () => {
  openLibrary("9780140328721", [{ title: "Fantastic Mr Fox", author_name: ["Roald Dahl"], isbn: ["9780140328721"], cover_i: 42 }]);

  const [book] = await resolveBook("https://www.amazon.com/dp/9780140328721");
  assert.equal(book?.title, "Fantastic Mr Fox");
  assert.equal(book?.author, "Roald Dahl");
  assert.equal(book?.source, "open_library");
  assert.equal(book?.isbn13, "9780140328721");
  assert.equal(book?.coverUrl, "https://covers.openlibrary.org/b/id/42-L.jpg");
});

test("manual title search returns Apple Books catalog metadata", async () => {
  appleSearch("The Quiet Library", [appleBook]);
  const [book] = await resolveBook("The Quiet Library");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.author, "A. Reader");
  assert.equal(book?.source, "apple_books");
});

test("manual author and title search preserves the full query", async () => {
  appleSearch("A. Reader The Quiet Library", [appleBook]);
  const [book] = await resolveBook("A. Reader The Quiet Library");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.author, "A. Reader");
});

test("Apple Books link performs exact ID lookup and keeps its storefront destination", async () => {
  nock("https://itunes.apple.com")
    .get("/lookup")
    .query({ id: "123456", entity: "ebook", country: "de" })
    .reply(200, { results: [{ ...appleBook, trackId: 999, trackName: "Wrong Book" }, { ...appleBook, trackViewUrl: "https://books.apple.com/de/book/the-quiet-library/id123456" }] });

  const [book] = await resolveBook("https://books.apple.com/de/book/the-quiet-library/id123456");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.source, "apple_books");
  assert.equal(book?.links.appleBooks, "https://books.apple.com/de/book/the-quiet-library/id123456");
});

test("Apple Books lookup without a matching result falls back to the readable URL title", async () => {
  nock("https://itunes.apple.com").get("/lookup").query({ id: "123456", entity: "ebook", country: "us" }).reply(200, { results: [] });
  nock("https://books.apple.com").get("/us/book/the-quiet-library/id123456").reply(400);
  appleSearch("the quiet library", []);
  openLibrary("the quiet library", [{ title: "The Quiet Library", author_name: ["A. Reader"] }]);

  const [book] = await resolveBook("https://books.apple.com/us/book/the-quiet-library/id123456");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.source, "open_library");
});

test("Apple search failure falls back to Open Library", async () => {
  appleSearch("The Quiet Library", [], 400);
  openLibrary("The Quiet Library", [{ title: "The Quiet Library", author_name: ["A. Reader"] }]);

  const [book] = await resolveBook("The Quiet Library");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.source, "open_library");
});

test("Open Library search failure rejects resolution", async () => {
  appleSearch("Obscure Title", [], 400);
  nock("https://openlibrary.org").get("/search.json").query((params) => params.q === "Obscure Title").reply(400);
  await assert.rejects(resolveBook("Obscure Title"));
});

test("unmatched Apple and Open Library searches return an empty list", async () => {
  appleSearch("No Such Book", []);
  openLibrary("No Such Book", []);
  assert.deepEqual(await resolveBook("No Such Book"), []);
});

test("scrape failures use the retailer URL path as the catalog search fallback", async () => {
  nock("https://www.kobo.com").get("/us/en/ebook/the-quiet-library").reply(400);
  appleSearch("the-quiet-library", [appleBook]);

  const [book] = await resolveBook("https://www.kobo.com/us/en/ebook/the-quiet-library");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.source, "apple_books");
});

test("scrape failures on Apple Books use its human-readable slug, not catalog ID", async () => {
  nock("https://itunes.apple.com").get("/lookup").query({ id: "123456", entity: "ebook", country: "us" }).reply(200, { results: [] });
  nock("https://books.apple.com").get("/us/book/the-quiet-library/id123456").reply(400);
  appleSearch("the quiet library", [appleBook]);

  const [book] = await resolveBook("https://books.apple.com/us/book/the-quiet-library/id123456");
  assert.equal(book?.title, "The Quiet Library");
  assert.equal(book?.source, "apple_books");
});

test("manual ISBN searches bypass Apple and preserve Open Library cover and retailer links", async () => {
  openLibrary("0140328726", [{ title: "Fantastic Mr Fox", author_name: ["Roald Dahl"], isbn: ["9780140328721", "0140328726"], cover_i: 42 }]);
  const [book] = await resolveBook("0140328726");
  assert.equal(book?.title, "Fantastic Mr Fox");
  assert.equal(book?.isbn10, "0140328726");
  assert.equal(book?.isbn13, "9780140328721");
  assert.equal(book?.coverUrl, "https://covers.openlibrary.org/b/id/42-L.jpg");
  assert.equal(book?.links.amazon?.us, "https://www.amazon.com/dp/0140328726");
});
