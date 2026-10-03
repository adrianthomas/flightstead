import got from "got";
import type { Logger } from "pino";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { assets } from "../db/schema.js";
import { createImageAsset, imageAssetResponse } from "./image-assets.js";
import { assertSafeFetchTarget, safeDnsLookup } from "./ssrf-guard.js";

const MAX_COVER_BYTES = 10 * 1024 * 1024;

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function mergeBookCoverMetadata(previousValue: unknown, incomingValue: unknown): Record<string, unknown> {
  const previous = previousValue && typeof previousValue === "object"
    ? previousValue as Record<string, unknown>
    : {};
  const incoming = incomingValue && typeof incomingValue === "object"
    ? incomingValue as Record<string, unknown>
    : {};
  const merged = { ...incoming };
  // PATCH otherwise replaces metadata. Retain only the cached cover references
  // when the caller omits artwork; visibility and rating remain replaceable.
  if (incoming.coverAssetId === undefined && incoming.coverUrl === undefined) {
    if (previous.coverAssetId !== undefined) merged.coverAssetId = previous.coverAssetId;
    if (previous.coverUrl !== undefined) merged.coverUrl = previous.coverUrl;
  }
  return merged;
}

async function ownedCover(siteId: string, assetId: string | undefined) {
  if (!assetId) return undefined;
  const [asset] = await db.select().from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.siteId, siteId)))
    .limit(1);
  if (!asset) return undefined;
  const response = imageAssetResponse(asset);
  return { id: response.id, url: response.url };
}

async function importCover(siteId: string, coverUrl: string) {
  await assertSafeFetchTarget(coverUrl);
  const response = await got(coverUrl, {
    timeout: { request: 8000 },
    dnsLookup: safeDnsLookup,
    hooks: {
      beforeRedirect: [async (options) => assertSafeFetchTarget(`${options.url}`)],
    },
  });
  const contentType = response.headers["content-type"]?.split(";", 1)[0]?.toLowerCase();
  if (!contentType?.startsWith("image/")) throw new Error("Book cover response was not an image.");
  if (response.rawBody.length > MAX_COVER_BYTES) throw new Error("Book cover exceeded the 10 MB limit.");
  const filename = new URL(coverUrl).pathname.split("/").pop() || "book-cover";
  return imageAssetResponse(await createImageAsset(siteId, response.rawBody, filename));
}

/**
 * Converts book covers into site-owned image assets. Metadata fields remain
 * intact, while the public cover URL is always rebuilt from local storage.
 */
export async function materializeBookCoverMetadata(
  siteId: string,
  input: unknown,
  log?: Pick<Logger, "warn">,
): Promise<Record<string, unknown>> {
  const metadata = input && typeof input === "object" ? input as Record<string, unknown> : {};
  let cover = await ownedCover(siteId, stringValue(metadata.coverAssetId));
  const coverUrl = stringValue(metadata.coverUrl);

  if (!cover && coverUrl) {
    try {
      const imported = await importCover(siteId, coverUrl);
      cover = { id: imported.id, url: imported.url };
    } catch (error) {
      log?.warn({ err: error, coverUrl }, "could not cache book cover; publishing without cover");
    }
  }

  const normalized = { ...metadata };
  delete normalized.coverAssetId;
  delete normalized.coverUrl;
  if (cover) {
    normalized.coverAssetId = cover.id;
    normalized.coverUrl = cover.url;
  }
  return normalized;
}
