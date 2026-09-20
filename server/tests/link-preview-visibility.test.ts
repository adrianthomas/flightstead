import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderObjectPage } from "../src/render/render.js";
import { LinkPost } from "../src/render/templates/LinkPost.js";
import type { ContentObject, Site } from "../src/render/templates/types.js";

const PREVIEW_URL = "/files/site/link-preview/original.jpg";

function link(showPreview?: boolean): ContentObject {
  return {
    id: "link-1",
    siteId: "site-1",
    type: "link",
    slug: "useful-link",
    title: "A useful link",
    body: "Worth saving.",
    status: "published",
    sourceUrl: "https://example.com/useful",
    metadata: {
      excerpt: "Open Graph description",
      previewImageUrl: PREVIEW_URL,
      ...(showPreview === undefined ? {} : { showPreview }),
    },
    publishedAt: new Date("2026-09-20T10:00:00Z"),
    createdAt: new Date("2026-09-20T10:00:00Z"),
    updatedAt: new Date("2026-09-20T10:00:00Z"),
  } as ContentObject;
}

const site = {
  id: "site-1",
  title: "Test Site",
  tagline: null,
  introduction: null,
  profileImageUrl: null,
  subdomain: "test",
  customDomain: null,
  locale: "en",
  theme: "classic",
} as Site;

test("link previews remain public when showPreview is absent", async () => {
  assert.match(renderToStaticMarkup(React.createElement(LinkPost, { object: link() })), new RegExp(PREVIEW_URL));
  assert.match(await renderObjectPage(site, link()), new RegExp(PREVIEW_URL));
});

test("showPreview false hides a retained preview in every theme and page metadata", async () => {
  const object = link(false);
  for (const theme of ["classic", "cards", "washi", "prism", "ledger", "cabinet", "aqua", "think"] as const) {
    const html = renderToStaticMarkup(React.createElement(LinkPost, {
      object, theme, backHref: "/", backLabel: "Back",
    }));
    assert.doesNotMatch(html, new RegExp(PREVIEW_URL), `${theme} exposed the hidden preview`);
  }
  assert.doesNotMatch(await renderObjectPage(site, object), new RegExp(PREVIEW_URL));
});
