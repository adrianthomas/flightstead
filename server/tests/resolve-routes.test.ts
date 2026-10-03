import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test, { before, after, afterEach } from "node:test";
import nock from "nock";
import { eq } from "drizzle-orm";
import { buildApp } from "../src/app.js";
import { db } from "../src/db/client.js";
import { users, apiTokens } from "../src/db/schema.js";
import { hashToken } from "../src/auth/tokens.js";

const app = buildApp();
const token = randomUUID();
let userId: string;
const song = {
  trackId: 456, trackName: "Rolling In", artistName: "Sam Evian",
  artworkUrl100: "https://is1-ssl.mzstatic.com/image/100x100bb.jpg",
  trackViewUrl: "https://music.apple.com/us/album/rolling-in/123?i=456",
};
const expectedSong = {
  artist: song.artistName, releaseTitle: song.trackName,
  artworkUrl: "https://is1-ssl.mzstatic.com/image/600x600bb.jpg",
  sourceUrl: song.trackViewUrl, links: { appleMusic: song.trackViewUrl },
};

before(async () => {
  nock.disableNetConnect();
  const [user] = await db.insert(users).values({ email: `resolve-${token}@example.test` }).returning();
  userId = user.id;
  await db.insert(apiTokens).values({ userId, tokenHash: hashToken(token) });
});
afterEach(() => {
  const pending = nock.pendingMocks();
  nock.cleanAll();
  assert.deepEqual(pending, [], "every expected provider request was made");
});
after(async () => {
  nock.enableNetConnect();
  await app.close();
  await db.delete(apiTokens).where(eq(apiTokens.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
});

function post(kind: string, payload: object, authorized = true) {
  return app.inject({ method: "POST", url: `/api/v1/resolve/${kind}`, payload,
    headers: authorized ? { authorization: `Bearer ${token}` } : {} });
}

test("book endpoint returns title-search candidates with matching cover and destination", async () => {
  nock("https://itunes.apple.com").get("/search")
    .query({ term: "A Book", media: "ebook", entity: "ebook", limit: 10 })
    .reply(200, { results: [{ trackName: "A Book", artistName: "A Writer",
      artworkUrl100: "https://is1-ssl.mzstatic.com/100x100bb.jpg",
      trackViewUrl: "https://books.apple.com/us/book/a-book/id123" }] });
  const response = await post("book", { query: "A Book" });
  assert.equal(response.statusCode, 200);
  const { candidates } = response.json();
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].title, "A Book");
  assert.equal(candidates[0].author, "A Writer");
  assert.equal(candidates[0].coverUrl, "https://is1-ssl.mzstatic.com/600x600bb.jpg");
  assert.equal(candidates[0].links.appleBooks, "https://books.apple.com/us/book/a-book/id123");
});

test("music endpoint accepts manual query and keeps the legacy scalar response", async () => {
  nock("https://itunes.apple.com").get("/search")
    .query({ term: "Rolling In Sam Evian", media: "music", entity: "song", limit: 10 })
    .reply(200, { results: [song] });
  const response = await post("music", { query: "Sam Evian - Rolling In" });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), expectedSong);
});

test("music endpoint accepts installed clients' url field", async () => {
  nock("https://itunes.apple.com").get("/lookup")
    .query({ id: "456", entity: "song", country: "us" }).reply(200, { results: [song] });
  const response = await post("music", { url: song.trackViewUrl });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), expectedSong);
});

test("opt-in music candidates retain scalar fields and each candidate's metadata", async () => {
  const other = { ...song, trackId: 789, artistName: "Other Artist", trackViewUrl: "https://music.apple.com/us/song/789" };
  nock("https://itunes.apple.com").get("/search").query(true).reply(200, { results: [song, other] });
  const response = await post("music", { query: "Sam Evian - Rolling In", includeCandidates: true });
  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { ...expectedSong, candidates: [expectedSong, {
    ...expectedSong, artist: other.artistName, sourceUrl: other.trackViewUrl, links: { appleMusic: other.trackViewUrl },
  }] });
});

test("empty music candidate search returns editable metadata without artwork", async () => {
  nock("https://itunes.apple.com").get("/search").query(true).reply(200, { results: [] });
  const response = await post("music", { query: "Unknown Song", includeCandidates: true });
  assert.equal(response.statusCode, 200);
  const fallback = { artist: "", releaseTitle: "Unknown Song", links: {} };
  assert.deepEqual(response.json(), { ...fallback, candidates: [fallback] });
});

test("resolve endpoints require authentication before contacting providers", async () => {
  for (const kind of ["book", "music"]) {
    const response = await post(kind, { query: "A title" }, false);
    assert.equal(response.statusCode, 401);
    assert.equal(response.json().error.code, "unauthorized");
  }
});

test("invalid resolve inputs use the API validation error envelope", async () => {
  for (const [kind, payload] of [["book", { query: "" }], ["music", {}],
    ["music", { url: "not a URL" }], ["music", { query: "Song", includeCandidates: "yes" }]] as const) {
    const response = await post(kind, payload);
    assert.equal(response.statusCode, 400);
    assert.equal(response.json().error.code, "validation_error");
    assert.equal(typeof response.json().error.message, "string");
  }
});

test("provider failures use the resolver_failed envelope for both endpoints", async () => {
  nock("https://itunes.apple.com").get("/search").query(true).reply(400, {});
  nock("https://openlibrary.org").get("/search.json").query(true).reply(400, {});
  const book = await post("book", { query: "A Book" });
  assert.equal(book.statusCode, 502);
  assert.deepEqual(book.json(), { error: { code: "resolver_failed", message: "Could not look up that book." } });
  nock("https://itunes.apple.com").get("/search").query(true).reply(400, {});
  const music = await post("music", { query: "Song" });
  assert.equal(music.statusCode, 502);
  assert.deepEqual(music.json(), { error: { code: "resolver_failed", message: "Could not resolve that music link." } });
});
