import assert from "node:assert/strict";
import test from "node:test";
import { bookUrlSearchFallback } from "../src/resolvers/book.js";

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
