import assert from "node:assert/strict";
import test from "node:test";
import { isPendingSiteHost, renderPendingPage } from "../src/render/pending-page.js";

test("pending page explains first-run setup and points owners to help", () => {
  const html = renderPendingPage();

  assert.match(html, /This new Flightstead site is being set up\./);
  assert.match(html, /Own this site\?/);
  assert.match(html, /href="https:\/\/flightstead\.com\/support#start"/);
  assert.match(html, /href="https:\/\/flightstead\.com\/support#faq"/);
  assert.match(html, /name="robots" content="noindex, nofollow"/);
});

test("pending page is limited to public deployment hosts", () => {
  assert.equal(isPendingSiteHost("example.com", "example.com"), true);
  assert.equal(isPendingSiteHost("new.example.com", "example.com"), true);
  assert.equal(isPendingSiteHost("api.example.com", "example.com"), false);
  assert.equal(isPendingSiteHost("nested.new.example.com", "example.com"), false);
  assert.equal(isPendingSiteHost("unrelated.test", "example.com"), false);
  assert.equal(isPendingSiteHost(undefined, "example.com"), false);
});
