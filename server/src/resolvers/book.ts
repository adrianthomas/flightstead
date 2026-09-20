import got from "got";
import { buildBookRetailerLinks } from "../lib/book-links.js";
import type { ResolvedBookCandidate } from "./types.js";
import { resolveArticle } from "./article.js";

interface OpenLibraryDoc {
  title: string;
  author_name?: string[];
  isbn?: string[];
  cover_i?: number;
}

interface OpenLibrarySearchResponse {
  docs: OpenLibraryDoc[];
}

export async function resolveBook(query: string): Promise<ResolvedBookCandidate[]> {
  let searchQuery = query.trim();
  try {
    const url = new URL(searchQuery);
    if (url.protocol === "http:" || url.protocol === "https:") {
      const isbn = `${url.pathname} ${url.search}`.match(/(?:97[89][\d-]{10,16}|\b\d{9}[\dXx]\b)/)?.[0];
      if (isbn) {
        searchQuery = isbn.replace(/-/g, "");
      } else {
        const article = await resolveArticle(url.toString());
        searchQuery = article.title ?? url.pathname.split("/").filter(Boolean).pop() ?? query;
      }
    }
  } catch {
    // Plain titles, author/title pairs, and ISBNs already are search terms.
  }
  const response = await got("https://openlibrary.org/search.json", {
    searchParams: { q: searchQuery, limit: 5, fields: "title,author_name,isbn,cover_i" },
    responseType: "json",
    timeout: { request: 8000 },
  }).json<OpenLibrarySearchResponse>();

  return response.docs.slice(0, 3).map((doc) => {
    const isbn13 = doc.isbn?.find((i) => i.length === 13);
    const isbn10 = doc.isbn?.find((i) => i.length === 10);
    const author = doc.author_name?.[0] ?? "Unknown author";
    return {
      title: doc.title,
      author,
      isbn13,
      isbn10,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : undefined,
      source: "open_library",
      links: buildBookRetailerLinks(doc.title, author, { isbn13, isbn10 }),
    };
  });
}
