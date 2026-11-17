import assert from "node:assert/strict";
import { test } from "node:test";
import { isQuickPost, quickPostPreview, quickPostTitle } from "../src/render/quick-post.js";

test("Quick Post threshold counts visible graphemes, not formatting or destinations", () => {
  const body = `**${"x".repeat(490)}** [hello](https://example.test/${"destination".repeat(100)}) 👩🏽‍✈️`;
  const preview = quickPostPreview(body);
  assert.equal(preview.characterCount, 498);
  assert.equal(preview.truncated, false);
  assert.match(preview.html, /<strong>/);
  assert.match(preview.html, /<a href=/);
  for (const length of [499, 500, 501]) {
    const result = quickPostPreview("👩🏽‍✈️".repeat(length));
    assert.equal(result.characterCount, length);
    assert.equal(result.truncated, length > 500);
    assert.equal(result.text, "👩🏽‍✈️".repeat(Math.min(length, 500)) + (length > 500 ? "…" : ""));
  }
});

test("preview cuts at a nearby word and closes links/emphasis safely", () => {
  const body = `Intro **[${"word ".repeat(120)}](https://example.test/)** TAIL`;
  const preview = quickPostPreview(body);
  assert.equal(preview.truncated, true);
  assert.ok(preview.text.length <= 501);
  assert.ok(preview.text.endsWith("word…"));
  assert.ok(!preview.html.includes("TAIL"));
  assert.match(preview.html, /…<\/a><\/strong><\/p>$/);
  assert.ok(!preview.html.includes("**"));
});

test("count normalizes block whitespace and ignores images and markup", () => {
  const body = '# **Hello**\n\n- one\n- two\n\n![cover](https://example.test/image.jpg)\n\n> & < >';
  const result = quickPostPreview(body);
  assert.equal(result.text, "Hello one two & < >");
  assert.equal(result.characterCount, result.text.length);
  assert.match(result.html, /&amp; &lt; &gt;/);
  assert.equal(quickPostTitle("**Hello** [world](https://example.test)"), "Hello world");
});

test("Quick Post mode is additive and limited to articles", () => {
  assert.equal(isQuickPost({ type: "article", metadata: { quickPost: true } }), true);
  for (const object of [
    { type: "article", metadata: {} }, { type: "article", metadata: { quickPost: false } },
    { type: "photo", metadata: { quickPost: true } }, { type: "article", metadata: null },
  ]) assert.equal(isQuickPost(object), false);
});
