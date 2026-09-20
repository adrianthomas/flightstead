import got from "got";
import type { Logger } from "pino";
import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { assets } from "../db/schema.js";
import { createImageAsset, imageAssetResponse } from "./image-assets.js";
import { assertSafeFetchTarget } from "./ssrf-guard.js";

const MAX_PREVIEW_BYTES = 10 * 1024 * 1024;

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function ownedPreview(siteId: string, assetId: string | undefined) {
  if (!assetId) return undefined;
  const [asset] = await db.select().from(assets)
    .where(and(eq(assets.id, assetId), eq(assets.siteId, siteId)))
    .limit(1);
  if (!asset) return undefined;
  const response = imageAssetResponse(asset);
  return { id: response.id, url: response.url };
}

async function importPreview(siteId: string, imageUrl: string) {
  await assertSafeFetchTarget(imageUrl);
  const response = await got(imageUrl, {
    timeout: { request: 8000 },
    hooks: {
      beforeRedirect: [async (options) => assertSafeFetchTarget(`${options.url}`)],
    },
  });
  const contentType = response.headers["content-type"]?.split(";", 1)[0]?.toLowerCase();
  if (!contentType?.startsWith("image/")) throw new Error("Link preview response was not an image.");
  if (response.rawBody.length > MAX_PREVIEW_BYTES) throw new Error("Link preview exceeded the 10 MB limit.");
  const filename = new URL(imageUrl).pathname.split("/").pop() || "link-preview";
  return imageAssetResponse(await createImageAsset(siteId, response.rawBody, filename));
}

/**
 * Turns transient Open Graph image URLs into owned local assets. Public pages
 * never contact the linked site merely to paint a saved link preview.
 */
export async function materializeLinkPreviewMetadata(
  siteId: string,
  input: unknown,
  log?: Pick<Logger, "warn">,
): Promise<Record<string, unknown>> {
  const metadata = input && typeof input === "object" ? input as Record<string, unknown> : {};
  let preview = await ownedPreview(siteId, stringValue(metadata.previewAssetId));
  const remoteImageUrl = stringValue(metadata.imageUrl);

  if (!preview && remoteImageUrl) {
    try {
      const imported = await importPreview(siteId, remoteImageUrl);
      preview = { id: imported.id, url: imported.url };
    } catch (error) {
      log?.warn({ err: error, imageUrl: remoteImageUrl }, "could not cache link preview; publishing without image");
    }
  }

  return {
    ...(stringValue(metadata.excerpt) ? { excerpt: stringValue(metadata.excerpt) } : {}),
    ...(stringValue(metadata.siteName) ? { siteName: stringValue(metadata.siteName) } : {}),
    ...(metadata.showPreview === false ? { showPreview: false } : {}),
    ...(preview ? { previewAssetId: preview.id, previewImageUrl: preview.url } : {}),
  };
}
