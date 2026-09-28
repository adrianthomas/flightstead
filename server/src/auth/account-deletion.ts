import type { FastifyBaseLogger } from "fastify";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "../db/client.js";
import {
  apiTokens,
  apFollowers,
  assets,
  contentObjects,
  dailyVisitCounts,
  magicTokens,
  ownerClaims,
  siteActorKeys,
  sites,
  users,
} from "../db/schema.js";
import { deliverDeleteActivity } from "../activitypub/federation.js";
import { invalidateTenantCache } from "../middleware/tenant.js";
import { invalidateSitePages } from "../render/page-cache.js";
import { storage } from "../storage/index.js";

function storageKeys(asset: typeof assets.$inferSelect): string[] {
  const variants = asset.variants as Record<string, string>;
  return [...new Set([asset.storageKey, ...Object.values(variants)].filter(Boolean))];
}

/** Permanently removes one account and all of its Flightstead-managed data. */
export async function deleteAccount(user: typeof users.$inferSelect, log: FastifyBaseLogger): Promise<void> {
  const ownedSites = await db.select().from(sites).where(eq(sites.ownerUserId, user.id));

  // Remote servers may retain cached copies, but send best-effort Delete
  // activities before removing the actor keys and local objects.
  for (const site of ownedSites) {
    const published = await db
      .select()
      .from(contentObjects)
      .where(and(eq(contentObjects.siteId, site.id), isNotNull(contentObjects.publishedAt)));
    for (const object of published) {
      try {
        await deliverDeleteActivity(site, object);
      } catch (error) {
        log.warn({ err: error, siteId: site.id, objectId: object.id }, "account deletion federation retraction failed");
      }
    }
  }

  // Delete owned files before their database rows. A storage failure stops
  // deletion so an account can retry instead of silently orphaning media.
  for (const site of ownedSites) {
    const siteAssets = await db.select().from(assets).where(eq(assets.siteId, site.id));
    await Promise.all(siteAssets.flatMap(storageKeys).map((key) => storage.delete(key)));
  }

  db.transaction((tx) => {
    for (const site of ownedSites) {
      tx.delete(dailyVisitCounts).where(eq(dailyVisitCounts.siteId, site.id)).run();
      tx.delete(apFollowers).where(eq(apFollowers.siteId, site.id)).run();
      tx.delete(siteActorKeys).where(eq(siteActorKeys.siteId, site.id)).run();
      tx.delete(assets).where(eq(assets.siteId, site.id)).run();
      tx.delete(contentObjects).where(eq(contentObjects.siteId, site.id)).run();
      tx.delete(sites).where(eq(sites.id, site.id)).run();
    }
    tx.delete(ownerClaims).where(eq(ownerClaims.userId, user.id)).run();
    tx.delete(apiTokens).where(eq(apiTokens.userId, user.id)).run();
    tx.delete(magicTokens).where(eq(magicTokens.email, user.email)).run();
    tx.delete(users).where(eq(users.id, user.id)).run();
  });

  for (const site of ownedSites) invalidateSitePages(site.id);
  invalidateTenantCache();
}
