import assert from "node:assert/strict";
import test from "node:test";
import { appleMatchScore, appleMusicCatalogId, rankAppleCandidates, sourceMetadata } from "../src/resolvers/music.js";

test("extracts artist and title from common inbound service titles", () => {
  assert.deepEqual(sourceMetadata("Rolling In - song and lyrics by Sam Evian | Spotify"), {
    releaseTitle: "Rolling In", artist: "Sam Evian",
  });
  assert.deepEqual(sourceMetadata("Song Title, by Artist Name"), {
    releaseTitle: "Song Title", artist: "Artist Name",
  });
  assert.deepEqual(sourceMetadata("Artist Name - Song Title - YouTube"), {
    releaseTitle: "Song Title", artist: "Artist Name",
  });
});

test("scores matching Apple catalog results above unrelated music", () => {
  const source = { releaseTitle: "Rolling In", artist: "Sam Evian" };
  assert.ok(appleMatchScore(source, { trackName: "Rolling In", artistName: "Sam Evian" }) > 0.99);
  assert.ok(appleMatchScore(source, { trackName: "Rolling Stone", artistName: "The Weeknd" }) < 0.5);
});

test("ranks matching Apple results, removes duplicate catalog rows, and limits to five", () => {
  const source = { releaseTitle: "Rolling In", artist: "Sam Evian" };
  const rows = [
    { trackId: 1, trackName: "Rolling In", artistName: "Sam Evian", artworkUrl100: "https://img/100x100bb.jpg" },
    { trackId: 1, trackName: "Rolling In", artistName: "Sam Evian", artworkUrl100: "https://img/100x100bb.jpg" },
    ...Array.from({ length: 6 }, (_, index) => ({ trackId: index + 2, trackName: "Rolling In (Live)", artistName: "Sam Evian" })),
    { trackId: 20, trackName: "Completely Different", artistName: "Other Artist" },
  ];
  const candidates = rankAppleCandidates(source, rows, 0.25);
  assert.equal(candidates.length, 5);
  assert.equal(candidates[0]?.releaseTitle, "Rolling In");
  assert.equal(candidates[0]?.artworkUrl, "https://img/600x600bb.jpg");
  assert.ok(candidates.every((candidate) => candidate.artist === "Sam Evian"));
});

test("plain searches retain Apple-ranked short and numeric title results", () => {
  const candidates = rankAppleCandidates({ releaseTitle: "1989", artist: "" }, [
    { trackId: 1, trackName: "1989", artistName: "Taylor Swift" },
    { trackId: 2, trackName: "19", artistName: "Other Artist" },
  ], 0);
  assert.deepEqual(candidates.map(({ releaseTitle }) => releaseTitle), ["1989", "19"]);
});

test("Apple Music catalog ID prefers the track query or final numeric path segment", () => {
  assert.equal(appleMusicCatalogId(new URL("https://music.apple.com/us/album/1989/1440933512")), "1440933512");
  assert.equal(appleMusicCatalogId(new URL("https://music.apple.com/us/album/title/123?i=456")), "456");
  assert.equal(appleMusicCatalogId(new URL("https://music.apple.com/us/album/title/123?i=bad")), undefined);
});
