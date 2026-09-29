import { z } from "zod";
import { contentTypeValues } from "../db/schema.js";
import { isSafeLinkUrl } from "../render/format.js";

// z.string().url() only checks URL syntax — it happily accepts
// `javascript:`/`data:` values, which the templates that render these
// fields put straight into an href. Use this wherever a stored URL becomes
// a link a visitor can click.
const linkUrlSchema = z.string().url().refine(isSafeLinkUrl, "URL must use http, https, or mailto.");

export const thoughtMetadataSchema = z.object({}).strict();

export const photoMetadataSchema = z.object({
  assetId: z.string().uuid(),
  caption: z.string().optional(),
  altText: z.string().optional(),
});

export const bookMetadataSchema = z.object({
  author: z.string(),
  isbn13: z.string().optional(),
  isbn10: z.string().optional(),
  coverAssetId: z.string().uuid().optional(),
  coverUrl: z.string().url().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  links: z
    .object({
      bookshop: linkUrlSchema.optional(),
      bookshopUk: linkUrlSchema.optional(),
      genialokal: linkUrlSchema.optional(),
      standardEbooks: linkUrlSchema.optional(),
      overdrive: linkUrlSchema.optional(),
      amazon: z
        .object({
          us: linkUrlSchema.optional(),
          uk: linkUrlSchema.optional(),
          de: linkUrlSchema.optional(),
          fr: linkUrlSchema.optional(),
          it: linkUrlSchema.optional(),
          es: linkUrlSchema.optional(),
          ca: linkUrlSchema.optional(),
          jp: linkUrlSchema.optional(),
        })
        .optional(),
      kobo: linkUrlSchema.optional(),
      appleBooks: linkUrlSchema.optional(),
      storygraph: linkUrlSchema.optional(),
    })
    .default({}),
  source: z.enum(["open_library", "google_books", "manual"]),
});

export const articleMetadataSchema = z.object({
  coverAssetId: z.string().uuid().optional(),
  coverAltText: z.string().optional(),
  excerpt: z.string().optional(),
});

export const linkMetadataSchema = z.object({
  excerpt: z.string().optional(),
  siteName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  previewAssetId: z.string().uuid().optional(),
  previewImageUrl: z.string().url().optional(),
  showPreview: z.boolean().optional(),
});

export const musicMetadataSchema = z.object({
  artist: z.string(),
  releaseTitle: z.string(),
  artworkAssetId: z.string().uuid().optional(),
  artworkUrl: z.string().url().optional(),
  sourceUrl: z.string().url().optional(),
  links: z
    .object({
      spotify: z.string().url().optional(),
      appleMusic: z.string().url().optional(),
      youtubeMusic: z.string().url().optional(),
      bandcamp: z.string().url().optional(),
    })
    .default({}),
});

export const quoteMetadataSchema = z.object({
  author: z.string().min(1),
  comment: z.string().optional(),
});

export const metadataSchemaByType = {
  thought: thoughtMetadataSchema,
  photo: photoMetadataSchema,
  book: bookMetadataSchema,
  article: articleMetadataSchema,
  link: linkMetadataSchema,
  music: musicMetadataSchema,
  quote: quoteMetadataSchema,
} as const;

export const createObjectSchema = z
  .object({
    type: z.enum(contentTypeValues),
    title: z.string().max(300).optional(),
    body: z.string().optional(),
    status: z.enum(["draft", "published"]).default("draft"),
    sourceUrl: linkUrlSchema.optional(),
    metadata: z.record(z.string(), z.unknown()),
  })
  .superRefine((val, ctx) => {
    const schema = metadataSchemaByType[val.type];
    const result = schema.safeParse(val.metadata);
    if (!result.success) {
      for (const issue of result.error.issues) {
        ctx.addIssue({ ...issue, path: ["metadata", ...issue.path] });
      }
    }
  });

export const updateObjectSchema = z.object({
  title: z.string().max(300).optional(),
  body: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
