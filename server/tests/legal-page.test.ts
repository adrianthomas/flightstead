import assert from "node:assert/strict";
import test from "node:test";
import { renderImpressumPage } from "../src/render/render.js";
import type { Site } from "../src/render/templates/types.js";

function site(legalPage: string | null): Site {
  return {
    id: "legal-site",
    ownerUserId: "legal-owner",
    subdomain: "legal",
    customDomain: null,
    title: "Legal test",
    tagline: null,
    profileName: null,
    introduction: null,
    location: null,
    profileImageUrl: null,
    profileLinks: [],
    contactLabel: null,
    contactUrl: null,
    contactLinks: [],
    about: null,
    legalPage,
    legalPageTitle: "Privacy & legal",
    locale: "en",
    theme: "classic",
    federationEnabled: true,
    statsEnabled: true,
    createdAt: new Date(0),
    updatedAt: new Date(0),
  };
}

test("legal page renders configured rich text without allowing raw HTML", () => {
  process.env.BASE_DOMAIN = "example.test";
  const html = renderImpressumPage(site("## Publisher\n\n**Ada Example**\n\nEmail: [hello@example.test](mailto:hello@example.test)\n\n<script>alert('no')</script>"));

  assert.match(html, /<title>Privacy &amp; legal — Legal test<\/title>/);
  assert.match(html, /<h1>Privacy &amp; legal<\/h1>/);
  assert.match(html, /<h3>Publisher<\/h3>/);
  assert.match(html, /<strong>Ada Example<\/strong>/);
  assert.match(html, /href="mailto:hello@example\.test"/);
  assert.match(html, /&lt;script&gt;alert\(&#39;no&#39;\)&lt;\/script&gt;/);
  assert.match(html, /href="\/impressum">Privacy &amp; legal<\/a>/);
  assert.doesNotMatch(html, /<script>alert/);
});
