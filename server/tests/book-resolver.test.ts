import assert from "node:assert/strict";
import test from "node:test";
import { bookUrlSearchFallback, mapAppleBookResult } from "../src/resolvers/book.js";

test("Apple Books links retain their readable title if metadata fetching fails", () => {
  const url = new URL("https://books.apple.com/de/book/the-devil-reached-toward-the-sky/id6736618118?l=en-GB");
  assert.equal(bookUrlSearchFallback(url), "the devil reached toward the sky");
  assert.equal(bookUrlSearchFallback(new URL("https://books.apple.com/us/book/caf%C3%A9-stories/id1234567890/")), "café stories");
});

test("other book links preserve their path fallback", () => {
  assert.equal(bookUrlSearchFallback(new URL("https://example.com/books/a-title")), "a-title");
  assert.equal(bookUrlSearchFallback(new URL("https://example.com/")), undefined);
  assert.equal(bookUrlSearchFallback(new URL("https://books.apple.com/us/book/%ZZ/id1234567890")), "id1234567890");
});

test("Apple Books lookup metadata keeps its cover and store URL with the matching book", () => {
  const candidate = mapAppleBookResult({
    trackId: 6736618118,
    trackName: "The Devil Reached Toward the Sky",
    artistName: "Garrett M. Graff",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Book/v4/artwork/100x100bb.jpg",
    trackViewUrl: "https://books.apple.com/de/book/the-devil/id6736618118",
  }, "https://books.apple.com/de/book/the-devil/id6736618118");
  assert.equal(candidate?.title, "The Devil Reached Toward the Sky");
  assert.equal(candidate?.author, "Garrett M. Graff");
  assert.equal(candidate?.source, "apple_books");
  assert.equal(candidate?.coverUrl, "https://is1-ssl.mzstatic.com/image/thumb/Book/v4/artwork/600x600bb.jpg");
  assert.equal(candidate?.links.appleBooks, "https://books.apple.com/de/book/the-devil/id6736618118");
});

test("Apple Books metadata without a title cannot become a candidate", () => {
  assert.equal(mapAppleBookResult({ artistName: "Some Author", artworkUrl100: "https://example.com/cover.jpg" }, "https://books.apple.com/book/id123"), undefined);
});
