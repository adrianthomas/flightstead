import assert from "node:assert/strict";
import test from "node:test";
import { buildApp } from "../src/app.js";

test("theme catalog exposes Basic while retaining hidden render-only themes", async () => {
  const app = buildApp();

  try {
    const response = await app.inject({ method: "GET", url: "/api/v1/themes" });
    assert.equal(response.statusCode, 200);

    const body = response.json() as { themes: Array<{ id: string; name: string }> };
    assert.deepEqual(
      body.themes.map(({ id, name }) => ({ id, name })),
      [
        { id: "classic", name: "Basic" },
        { id: "cards", name: "Cards" },
        { id: "washi", name: "Washi" },
        { id: "prism", name: "Prism" },
        { id: "ledger", name: "Ledger" },
        { id: "cabinet", name: "Cabinet" },
      ],
    );
  } finally {
    await app.close();
  }
});
