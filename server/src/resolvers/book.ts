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

interface AppleBookResult {
  trackName?: string;
  artistName?: string;
  trackId?: number;
  artworkUrl100?: string;
  trackViewUrl?: string;
  isbn?: string;
}

interface AppleBookLookupResponse { results: AppleBookResult[] }
interface AppleBookSearchResponse { results: AppleBookResult[] }

export function mapAppleBookResult(item: AppleBookResult, fallbackUrl: string): ResolvedBookCandidate | undefined {
  if (!item.trackName) return undefined;
  const author = item.artistName ?? "Unknown author";
  const isbn13 = item.isbn && /^\d{13}$/.test(item.isbn) ? item.isbn : undefined;
  const appleBooks = item.trackViewUrl ?? fallbackUrl;
  return {
    title: item.trackName, author, isbn13,
    coverUrl: item.artworkUrl100?.replace(/100x100(?:bb)?/, "600x600bb"),
    source: "apple_books",
    links: { ...buildBookRetailerLinks(item.trackName, author, { isbn13 }), appleBooks },
  };
}

async function searchAppleBooks(query: string): Promise<ResolvedBookCandidate[]> {
  try {
    const response = await got("https://itunes.apple.com/search", {
      searchParams: { term: query, media: "ebook", entity: "ebook", limit: 10 },
      responseType: "json", timeout: { request: 8000 },
    }).json<AppleBookSearchResponse>();
    return response.results.flatMap((item) => {
      const candidate = mapAppleBookResult(item, item.trackViewUrl ?? "");
      return candidate ? [candidate] : [];
    }).slice(0, 5);
  } catch {
    return [];
  }
}

async function resolveAppleBook(url: URL): Promise<ResolvedBookCandidate | undefined> {
  const id = url.pathname.match(/\/id(\d+)(?:\/|$)/)?.[1];
  if (!id) return undefined;
  try {
    const country = url.pathname.split("/").filter(Boolean)[0];
    const response = await got("https://itunes.apple.com/lookup", {
      searchParams: { id, entity: "ebook", ...(country && /^[a-z]{2}$/i.test(country) ? { country } : {}) },
      responseType: "json", timeout: { request: 8000 },
    }).json<AppleBookLookupResponse>();
    const item = response.results.find((result) => result.trackId === Number(id));
    return item ? mapAppleBookResult(item, url.toString()) : undefined;
  } catch {
    return undefined;
  }
}

export function bookUrlSearchFallback(url: URL): string | undefined {
  // Apple uses a catalog ID as its last path segment, not a searchable
  // book identifier. Keep the readable title when page scraping fails.
  const appleSlug = url.hostname.toLowerCase() === "books.apple.com"
    ? url.pathname.match(/\/book\/([^/]+)\/id\d+\/?$/)?.[1]
    : undefined;
  if (appleSlug) {
    try {
      return decodeURIComponent(appleSlug).replace(/-/g, " ").trim() || undefined;
    } catch {
      // Malformed escaping must not prevent the ordinary URL fallback.
    }
  }
  return url.pathname.split("/").filter(Boolean).pop();
}

export async function resolveBook(query: string): Promise<ResolvedBookCandidate[]> {
  let searchQuery = query.trim();
  try {
    const url = new URL(searchQuery);
    if (url.protocol === "http:" || url.protocol === "https:") {
      if (url.hostname.toLowerCase() === "books.apple.com") {
        const appleBook = await resolveAppleBook(url);
        if (appleBook) return [appleBook];
      }
      const isbn = `${url.pathname} ${url.search}`.match(/(?:97[89][\d-]{10,16}|\b\d{9}[\dXx]\b)/)?.[0];
      if (isbn) {
        searchQuery = isbn.replace(/-/g, "");
      } else {
        const article = await resolveArticle(url.toString());
        searchQuery = article.title ?? bookUrlSearchFallback(url) ?? query;
      }
    }
  } catch {
    // Plain titles, author/title pairs, and ISBNs already are search terms.
  }
  if (!/^(?:97[89][\d-]{10,16}|\d{9}[\dXx])$/.test(searchQuery.replace(/\s/g, ""))) {
    const appleBooks = await searchAppleBooks(searchQuery);
    if (appleBooks.length) return appleBooks;
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
