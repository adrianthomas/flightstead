import type { FastifyInstance } from "fastify";
import { themeValues, type Theme } from "../db/schema.js";

interface ThemeOption {
  id: Theme;
  name: string;
  description: string;
}

const themeOptions = [
  {
    id: "classic",
    name: "Basic",
    description: "A simple chronological site with clean typography and article-style posts.",
  },
  {
    id: "cards",
    name: "Cards",
    description: "A visual, full-bleed card layout where posts expand into detail views when tapped.",
  },
  {
    id: "washi",
    name: "Washi",
    description: "A calmer paper-and-ink look with warm tones and serif headings.",
  },
  {
    id: "prism",
    name: "Prism",
    description: "A bright, playful theme with crisp cards, rounded typography, and blue-pink accents.",
  },
  {
    id: "ledger",
    name: "Ledger",
    description: "A polished index-style theme with clean rows, type labels, and iOS-style push detail views.",
  },
  {
    id: "cabinet",
    name: "Cabinet",
    description: "An editorial cabinet of photos, notes, books, music, and essays, wired together as one living personal index.",
  },
  {
    id: "aqua",
    name: "Aqua",
    description: "A bright turn-of-the-century desktop look with pinstripes, polished chrome, and candy-blue controls.",
  },
  {
    id: "think",
    name: "Think",
    description: "An airy early-2000s product homepage with graphite navigation, a bold lead story, and crisp promo tiles.",
  },
] satisfies ThemeOption[];

const missingThemeMetadata = themeValues.filter((theme) => !themeOptions.some((option) => option.id === theme));
if (missingThemeMetadata.length > 0) {
  throw new Error(`Missing theme metadata for: ${missingThemeMetadata.join(", ")}`);
}

// Aqua and Think remain valid persisted values so existing sites keep
// rendering unchanged, but they are intentionally absent from the catalog
// while those designs are held back from new selection.
const selectableThemeIds = new Set<Theme>(["classic", "cards", "washi", "prism", "ledger", "cabinet"]);
const selectableThemeOptions = themeOptions.filter((option) => selectableThemeIds.has(option.id));

export async function themeRoutes(app: FastifyInstance) {
  app.get("/themes", async (_request, reply) => {
    return reply.send({ themes: selectableThemeOptions });
  });
}
