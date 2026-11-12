import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";

test("theme catalog hides Basic, Washi, Ledger, and Aqua from selection", async () => {
  const app = buildApp();

  try {
    const response = await app.inject({ method: "GET", url: "/api/v1/themes" });
    assert.equal(response.statusCode, 200);

    const body = response.json() as { themes: Array<{ id: string; name: string }> };
    assert.deepEqual(
      body.themes.map(({ id, name }) => ({ id, name })),
      [
        { id: "cards", name: "Cards" },
        { id: "prism", name: "Prism" },
        { id: "cabinet", name: "Cabinet" },
        { id: "stream", name: "Stream" },
        { id: "marquee", name: "Marquee" },
        { id: "think", name: "Think" },
      ],
    );
  } finally {
    await app.close();
  }
});
