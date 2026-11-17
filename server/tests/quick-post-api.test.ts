import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { after, test } from "node:test";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

const directory = mkdtempSync(join(tmpdir(), "flightstead-quick-post-"));
process.env.DATABASE_URL = join(directory, "test.sqlite");
process.env.BASE_DOMAIN = "quick-post.test";
const connection = new Database(process.env.DATABASE_URL);
migrate(drizzle(connection), { migrationsFolder: resolve("src/db/migrations") });
connection.close();
const [{ buildApp }, { db }, { users, sites, apiTokens }, { hashToken }] = await Promise.all([
  import("../src/app.js"), import("../src/db/client.js"), import("../src/db/schema.js"), import("../src/auth/tokens.js"),
]);
after(() => rmSync(directory, { recursive: true, force: true }));

test("Quick Posts retain article identity and survive old editors until explicitly switched", async () => {
  const suffix = randomUUID();
  const token = `quick-${suffix}`;
  const [user] = await db.insert(users).values({ email: `${suffix}@example.test` }).returning();
  await db.insert(sites).values({ ownerUserId: user.id, subdomain: "quick", title: "Quick", federationEnabled: false });
  await db.insert(apiTokens).values({ userId: user.id, tokenHash: hashToken(token) });
  const app = buildApp();
  const headers = { authorization: `Bearer ${token}` };
  try {
    const created = await app.inject({ method: "POST", url: "/api/v1/objects", headers, payload: {
      type: "article", title: "Retained headline", body: "A brief update", status: "published", metadata: { quickPost: true, excerpt: "Retained excerpt" },
    } });
    assert.equal(created.statusCode, 201, created.body);
    const object = created.json().object;
    assert.equal(object.type, "article");
    assert.equal(object.title, "Retained headline");
    assert.equal(object.slug, "a-brief-update");
    assert.equal(object.metadata.quickPost, true);
    const list = await app.inject({ method: "GET", url: "/api/v1/objects", headers });
    assert.equal(list.json().objects[0].metadata.quickPost, true);
    const oldEdit = await app.inject({ method: "PATCH", url: `/api/v1/objects/${object.id}`, headers, payload: {
      body: "Edited on an older client", metadata: { excerpt: "Older client" },
    } });
    assert.equal(oldEdit.statusCode, 200, oldEdit.body);
    assert.equal(oldEdit.json().object.metadata.quickPost, true);
    const switched = await app.inject({ method: "PATCH", url: `/api/v1/objects/${object.id}`, headers, payload: { metadata: { quickPost: false } } });
    assert.equal(switched.statusCode, 200, switched.body);
    assert.equal(switched.json().object.metadata.quickPost, false);
    assert.equal(switched.json().object.slug, object.slug);
    assert.equal(switched.json().object.title, "Retained headline");
    for (const method of ["POST", "PATCH"] as const) {
      const invalid = await app.inject({ method, url: method === "POST" ? "/api/v1/objects" : `/api/v1/objects/${object.id}`, headers,
        payload: method === "POST" ? { type: "article", metadata: { quickPost: "true" } } : { metadata: { quickPost: "true" } },
      });
      assert.equal(invalid.statusCode, 400, invalid.body);
    }
  } finally { await app.close(); }
});
