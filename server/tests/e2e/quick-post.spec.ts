import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

function bootstrapOwnerToken(): string {
  const serverRoot = path.resolve(import.meta.dirname, "../..");
  const tokenPath = path.resolve(serverRoot, "data/e2e-test-owner-token");
  if (existsSync(tokenPath)) return readFileSync(tokenPath, "utf8").trim();
  const output = execFileSync("npx", ["tsx", "src/db/bootstrap-owner.ts", "--email", "e2e@test.local"], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? path.resolve(serverRoot, "data/e2e-test.db") },
    encoding: "utf8",
  });
  const match = output.match(/SHAREBLOG_BOOTSTRAP_TOKEN=(\S+)/);
  if (!match) throw new Error(`bootstrap-owner.ts didn't print a token — was the DB already seeded?\n${output}`);
  writeFileSync(tokenPath, match[1], { encoding: "utf8", mode: 0o600 });
  return match[1];
}

async function fetchWithRateLimitRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, init);
    if (response.status !== 429 || attempt >= 2) return response;

    const body = await response.text();
    const retryAfter = response.headers.get("retry-after");
    let delaySeconds = retryAfter ? Number(retryAfter) : Number.NaN;
    if (!Number.isFinite(delaySeconds) && retryAfter) {
      const retryDate = Date.parse(retryAfter);
      if (Number.isFinite(retryDate)) delaySeconds = Math.max(0, (retryDate - Date.now()) / 1000);
    }
    if (!Number.isFinite(delaySeconds)) {
      const messageDelay = body.match(/retry in (\d+(?:\.\d+)?) seconds?/i);
      delaySeconds = messageDelay ? Number(messageDelay[1]) : 5;
    }
    await new Promise((resolve) => setTimeout(resolve, Math.ceil(Math.min(60, Math.max(1, delaySeconds)) * 1000)));
  }
}

async function api(baseURL: string, token: string, route: string, body: unknown, method = "POST") {
  const res = await fetchWithRateLimitRetry(`${baseURL.replace("localhost", "api.localhost")}${route}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
  });
  if (!res.ok) throw new Error(`${method} ${route} -> ${res.status}: ${await res.text()}`);
  return res.status === 204 ? undefined : res.json();
}

async function uploadCover(baseURL: string, token: string): Promise<string> {
  const bytes = Buffer.from(
    "/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/wAALCAAIAAgBAREA/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAA/AKp//9k=",
    "base64",
  );
  const form = new FormData();
  form.append("file", new Blob([bytes], { type: "image/jpeg" }), "quick-post-cover.jpg");
  const response = await fetchWithRateLimitRetry(`${baseURL.replace("localhost", "api.localhost")}/api/v1/assets`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!response.ok) throw new Error(`cover upload -> ${response.status}: ${await response.text()}`);
  const result = await response.json();
  return result.asset.id as string;
}

let siteBaseURL: string;
let apiBaseURL: string;
let ownerToken: string;
let shortId: string;
let longId: string;
let shortSlug: string;
let longSlug: string;

test.beforeAll(async ({ baseURL }) => {
  test.setTimeout(150_000);
  ownerToken = bootstrapOwnerToken();
  apiBaseURL = baseURL!;
  siteBaseURL = apiBaseURL.replace("localhost", "e2ecards.localhost");
  try {
    await api(apiBaseURL, ownerToken, "/api/v1/sites", { subdomain: "e2ecards", title: "E2E Quick Posts" });
  } catch (error) {
    if (!(error instanceof Error) || !error.message.includes('"code":"site_exists"')) throw error;
  }

  const existing = await api(apiBaseURL, ownerToken, "/api/v1/objects?type=article&limit=100", {}, "GET") as {
    objects: Array<{ id: string; slug: string; body?: string; metadata?: Record<string, unknown> }>;
  };
  const shortBody = "A short note with a [working inline link](https://example.com/quick-post).";
  const existingShort = existing.objects.find((object) => object.body === shortBody && object.metadata?.quickPost === true);
  const short = existingShort
    ? { object: existingShort }
    : await (async () => {
        const coverAssetId = await uploadCover(apiBaseURL, ownerToken);
        return api(apiBaseURL, ownerToken, "/api/v1/objects", {
          type: "article",
          title: "Private retained headline should stay hidden",
          status: "published",
          body: shortBody,
          metadata: { quickPost: true, excerpt: "Private excerpt", coverAssetId, coverAltText: "Private cover" },
        });
      })() as { object: { id: string; slug: string } };
  shortId = short.object.id;
  shortSlug = short.object.slug;

  const longText = Array.from({ length: 72 }, (_, index) => `visibleword${index}`).join(" ");
  const longBody = `${longText} [a later link](https://example.com/later).`;
  const existingLong = existing.objects.find((object) => object.body === longBody && object.metadata?.quickPost === true);
  const long = existingLong
    ? { object: existingLong }
    : await api(apiBaseURL, ownerToken, "/api/v1/objects", {
        type: "article",
        title: "Another hidden headline",
        status: "published",
        body: longBody,
        metadata: { quickPost: true },
      }) as { object: { id: string; slug: string } };
  longId = long.object.id;
  longSlug = long.object.slug;
});

test.afterAll(async () => {
  if (ownerToken && apiBaseURL) {
    await api(apiBaseURL, ownerToken, "/api/v1/sites", { theme: "cards", customDomain: "" }, "PATCH").catch(() => undefined);
  }
});

test("Quick Posts use the 500-character preview consistently across every theme", async ({ page, browser }) => {
  test.setTimeout(240_000);
  const themes = ["classic", "washi", "cards", "prism", "ledger", "cabinet", "stream", "marquee", "think", "aqua"] as const;
  const shortBody = "A short note with a working inline link.";
  await page.context().route("https://example.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "Quick Post external link fixture" }));

  for (const theme of themes) {
    await test.step(theme, async () => {
      await api(apiBaseURL, ownerToken, "/api/v1/sites", { theme, customDomain: "" }, "PATCH");
      await page.setViewportSize({ width: 390, height: 844 });
      const feedResponse = await page.goto(`${siteBaseURL}/?quick-post-review=${theme}`);
      expect(feedResponse?.ok()).toBeTruthy();
      await expect(page.locator("body")).toHaveAttribute("data-theme", theme);

      const short = page.locator("[data-quick-post]").filter({ hasText: shortBody });
      await expect(short).toContainText(shortBody);
      await expect(short).not.toContainText("Private retained headline should stay hidden");
      await expect(short.locator(".quick-post-read-more")).toHaveCount(0);
      await expect(short.locator('a[href="https://example.com/quick-post"]')).toBeVisible();
      await expect(short.locator("img")).toHaveCount(0);

      const long = page.locator("[data-quick-post][data-quick-post-truncated='true']").filter({ hasText: "visibleword0" });
      await expect(long).toContainText("visibleword0");
      await expect(long).not.toContainText("visibleword71");
      const readMore = long.locator(".quick-post-read-more, .fr-quick-post-more");
      await expect(readMore).toBeVisible();
      await expect(readMore).toHaveAttribute("href", new RegExp(`^/articles/${longSlug}(?:\\?|$)`));

      // The body is a separate link target; clicking it must not activate the
      // permalink even in themes that normally make an entire card clickable.
      const inlineLink = short.locator('a[href="https://example.com/quick-post"]');
      await expect(inlineLink).toHaveAttribute("target", "_blank");
      const popupPromise = page.waitForEvent("popup");
      await inlineLink.click();
      const popup = await popupPromise;
      await expect(popup).toHaveURL("https://example.com/quick-post");
      await popup.close();

      const width = await page.evaluate(() => ({
        document: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
      }));
      expect(width.document, `${theme} should not overflow at 390px`).toBeLessThanOrEqual(width.viewport);

      await readMore.click();
      await expect(page.locator("[data-quick-post]").last()).toContainText("visibleword71");
      await expect(page.locator("main")).not.toContainText("Another hidden headline");
      await expect(page.locator("main img")).toHaveCount(0);

      if (theme === "marquee") {
        await page.goto(`${siteBaseURL}/articles?quick-post-keyboard=true`);
        const quickRows = page.locator(".fr-row--quick-post");
        await expect(quickRows).toHaveCount(2);
        const selectedRow = quickRows.nth(1);
        const selectedHref = await selectedRow.locator("[data-fr-row-link]").getAttribute("href");
        const selectedBody = (await selectedRow.innerText()).includes("visibleword0") ? "visibleword71" : "working inline link";
        expect(selectedHref).toBeTruthy();
        await page.keyboard.press("ArrowDown");
        await expect(selectedRow).toHaveAttribute("data-hl", "true");
        await page.keyboard.press("ArrowRight");
        await expect(page).toHaveURL(new URL(selectedHref!, siteBaseURL).toString());
        await expect(page.locator("[data-quick-post]")).toContainText(selectedBody);
      }

      if (theme === "classic") {
        await page.goBack();
        const datePermalink = page.locator("[data-quick-post]").filter({ hasText: shortBody }).locator(".quick-post-permalink");
        await datePermalink.focus();
        await page.keyboard.press("Enter");
        await expect(page.locator("[data-quick-post]").last()).toContainText("working inline link");
        await expect(page.locator("main")).not.toContainText("Private retained headline should stay hidden");

        const noJavaScript = await browser.newContext({ javaScriptEnabled: false });
        try {
          const bare = await noJavaScript.newPage();
          await bare.goto(`${siteBaseURL}/articles/${longSlug}?quick-post-no-js=true`);
          await expect(bare.locator("[data-quick-post]")).toContainText("visibleword71");
        } finally {
          await noJavaScript.close();
        }
      }
    });
  }
});

test("Quick Posts reflow across every theme at review widths in both color schemes", async ({ page }) => {
  test.setTimeout(240_000);
  const themes = ["classic", "washi", "cards", "prism", "ledger", "cabinet", "stream", "marquee", "think", "aqua"] as const;
  const screenshotThemes = new Set(["classic", "cards", "cabinet", "marquee", "think"]);
  for (const theme of themes) {
    await api(apiBaseURL, ownerToken, "/api/v1/sites", { theme, customDomain: "" }, "PATCH");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${siteBaseURL}/?quick-post-width=${theme}-390-initial`);
    await expect(page.locator("body")).toHaveAttribute("data-theme", theme);
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      for (const width of [320, 390, 560, 768, 1280]) {
        await page.setViewportSize({ width, height: width < 600 ? 844 : 900 });
        await expect(page.locator("[data-quick-post]").filter({ hasText: "A short note" }).first()).toBeVisible();
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(overflow, `${theme} horizontal overflow at ${width}px (${colorScheme})`).toBeLessThanOrEqual(0);
        if (width === 390 && screenshotThemes.has(theme)) {
          await page.screenshot({ path: test.info().outputPath(`quick-post-${theme}-390-${colorScheme}.png`), fullPage: true });
        }
      }
    }
  }
});
