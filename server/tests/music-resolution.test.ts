import assert from "node:assert/strict";
import nock from "nock";
import test, { after, afterEach, before } from "node:test";
import { resolveMusic, resolveMusicCandidates } from "../src/resolvers/music.js";

const apple = "https://itunes.apple.com";
const youtube = "https://www.youtube.com";

before(() => nock.disableNetConnect());
afterEach(() => {
  const pending = nock.pendingMocks();
  nock.cleanAll();
  assert.deepEqual(pending, [], "every expected provider request was made");
});
after(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

function appleResult(overrides: Record<string, unknown> = {}) {
  return {
    trackId: 42,
    collectionId: 84,
    trackName: "Blue Hour",
    collectionName: "Blue Hour EP",
    artistName: "Mira Lane",
    artworkUrl100: "https://is1-ssl.mzstatic.com/image/thumb/Music/100x100bb.jpg",
    trackViewUrl: "https://music.apple.com/us/album/blue-hour/84?i=42",
    collectionViewUrl: "https://music.apple.com/us/album/blue-hour-ep/84",
    ...overrides,
  };
}

const expectedMusic = {
  artist: "Mira Lane",
  releaseTitle: "Blue Hour",
  artworkUrl: "https://is1-ssl.mzstatic.com/image/thumb/Music/600x600bb.jpg",
  sourceUrl: "https://music.apple.com/us/album/blue-hour/84?i=42",
  links: { appleMusic: "https://music.apple.com/us/album/blue-hour/84?i=42" },
};

test("Apple Music album links lookup the storefront and collection, keeping album metadata together", async () => {
  const request = nock(apple).get("/lookup").query({ id: "84", country: "gb" })
    .reply(200, { results: [appleResult({ trackId: undefined, trackName: undefined, trackViewUrl: undefined, collectionName: "Blue Hour EP" })] });

  const result = await resolveMusic("https://music.apple.com/gb/album/blue-hour-ep/84");
  assert.deepEqual(result, {
    artist: "Mira Lane",
    releaseTitle: "Blue Hour EP",
    artworkUrl: expectedMusic.artworkUrl,
    sourceUrl: "https://music.apple.com/us/album/blue-hour-ep/84",
    links: { appleMusic: "https://music.apple.com/us/album/blue-hour-ep/84" },
  });
  assert.ok(request.isDone());
});

test("Apple Music track links request song entity and select the matching track id", async () => {
  const request = nock(apple).get("/lookup").query({ id: "42", entity: "song", country: "us" })
    .reply(200, { results: [appleResult({ trackId: 999, trackName: "Wrong Track" }), appleResult()] });

  assert.deepEqual(await resolveMusic("https://music.apple.com/us/album/blue-hour-ep/84?i=42"), expectedMusic);
  assert.ok(request.isDone());
});

test("Spotify oEmbed metadata resolves to the matching Apple catalog entry", async () => {
  const sourceUrl = "https://open.spotify.com/track/spotify123";
  const spotify = nock("https://open.spotify.com").get("/oembed").query({ url: sourceUrl })
    .reply(200, { title: "Blue Hour - song and lyrics by Mira Lane | Spotify" });
  const search = nock(apple).get("/search").query({ term: "Blue Hour Mira Lane", media: "music", entity: "song", limit: "10" })
    .reply(200, { results: [appleResult({ trackId: 43, trackName: "Blue Hours", artistName: "Other Artist" }), appleResult()] });

  assert.deepEqual(await resolveMusic(sourceUrl), expectedMusic);
  assert.ok(spotify.isDone() && search.isDone());
});

test("YouTube www, Music, and short links use canonical oEmbed URLs", async (t) => {
  const cases = [
    ["https://www.youtube.com/watch?v=video123", "https://www.youtube.com/watch?v=video123"],
    ["https://music.youtube.com/watch?v=video123", "https://www.youtube.com/watch?v=video123"],
    ["https://youtu.be/video123", "https://youtu.be/video123"],
  ] as const;

  for (const [input, oembedUrl] of cases) {
    await t.test(input, async () => {
      const oembed = nock(youtube).get("/oembed").query({ url: oembedUrl, format: "json" })
        .reply(200, { title: "Mira Lane - Blue Hour (Official Audio)", author_name: "Mira Lane" });
      const search = nock(apple).get("/search").query({ term: "Blue Hour Mira Lane", media: "music", entity: "song", limit: "10" })
        .reply(200, { results: [appleResult()] });

      assert.deepEqual(await resolveMusic(input), expectedMusic);
      assert.ok(oembed.isDone() && search.isDone());
    });
  }
});

test("manual title and artist-title searches resolve through Apple Music search", async (t) => {
  const cases = [
    ["Blue Hour", "Blue Hour"],
    ["Mira Lane - Blue Hour", "Blue Hour Mira Lane"],
  ] as const;

  for (const [input, term] of cases) {
    await t.test(input, async () => {
      const search = nock(apple).get("/search").query({ term, media: "music", entity: "song", limit: "10" })
        .reply(200, { results: [appleResult()] });
      assert.deepEqual(await resolveMusic(input), expectedMusic);
      assert.ok(search.isDone());
    });
  }
});

test("unrelated catalog results preserve editable source metadata without artwork or destinations", async (t) => {
  const rows = { results: [appleResult({ trackName: "Completely Different", artistName: "Someone Else" })] };
  await t.test("legacy result", async () => {
    const spotifyUrl = "https://open.spotify.com/track/no-match";
    nock("https://open.spotify.com").get("/oembed").query({ url: spotifyUrl })
      .reply(200, { title: "Blue Hour - song and lyrics by Mira Lane | Spotify" });
    nock(apple).get("/search").query(true).reply(200, rows);
    assert.deepEqual(await resolveMusic(spotifyUrl), { artist: "Mira Lane", releaseTitle: "Blue Hour", links: {} });
  });
  await t.test("candidate result", async () => {
    const spotifyUrl = "https://open.spotify.com/track/no-candidate-match";
    nock("https://open.spotify.com").get("/oembed").query({ url: spotifyUrl })
      .reply(200, { title: "Blue Hour - song and lyrics by Mira Lane | Spotify" });
    nock(apple).get("/search").query({ term: "Blue Hour Mira Lane", media: "music", entity: "song", limit: "10" }).reply(200, rows);
    assert.deepEqual(await resolveMusicCandidates(spotifyUrl), [
      { artist: "Mira Lane", releaseTitle: "Blue Hour", links: {} },
    ]);
  });
});

test("candidate search ranks matching results and preserves each result's artwork and destination", async () => {
  const weaker = appleResult({ trackId: 43, trackName: "Blue Hour (Live)", artworkUrl100: "https://is1-ssl.mzstatic.com/live/100x100bb.jpg", trackViewUrl: "https://music.apple.com/us/song/live/43" });
  const request = nock(apple).get("/search").query({ term: "Blue Hour Mira Lane", media: "music", entity: "song", limit: "10" })
    .reply(200, { results: [weaker, appleResult()] });

  const candidates = await resolveMusicCandidates("Mira Lane - Blue Hour");
  assert.deepEqual(candidates, [expectedMusic, {
    ...expectedMusic,
    releaseTitle: "Blue Hour (Live)",
    artworkUrl: "https://is1-ssl.mzstatic.com/live/600x600bb.jpg",
    sourceUrl: "https://music.apple.com/us/song/live/43",
    links: { appleMusic: "https://music.apple.com/us/song/live/43" },
  }]);
  assert.ok(request.isDone());
});

test("empty manual search rejects for legacy callers and returns editable fallback for candidates", async (t) => {
  await t.test("legacy reject", async () => {
    nock(apple).get("/search").query({ term: "Unlisted Song", media: "music", entity: "song", limit: "10" }).reply(200, { results: [] });
    await assert.rejects(resolveMusic("Unlisted Song"), /catalog item was not found/);
  });
  await t.test("candidate fallback", async () => {
    nock(apple).get("/search").query({ term: "Unlisted Song", media: "music", entity: "song", limit: "10" }).reply(200, { results: [] });
    assert.deepEqual(await resolveMusicCandidates("Unlisted Song"), [{ artist: "", releaseTitle: "Unlisted Song", links: {} }]);
  });
});

test("provider failures reject resolution", async () => {
  const spotifyUrl = "https://open.spotify.com/track/temporarily-unavailable";
  nock("https://open.spotify.com").get("/oembed").query({ url: spotifyUrl })
    .reply(400, { error: "temporarily unavailable" });
  await assert.rejects(resolveMusic(spotifyUrl));
});
