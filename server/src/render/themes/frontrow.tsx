import React from "react";
import type { AssetExif } from "../../db/schema.js";
import { musicLinksFor } from "../../lib/music-links.js";
import { bookRetailerLinksFor } from "../../lib/book-links.js";
import { impressumPageEnabled } from "../../lib/impressum-page.js";
import { workPageEnabled } from "../../lib/work-page.js";
import { formatBasicText, formatRichText, isSafeLinkUrl, stripBasicFormatting } from "../format.js";
import { t, type MessageKey } from "../i18n.js";
import { siteOrigin } from "../site-url.js";
import { flattenLinks } from "../templates/BookCard.js";
import { CopyHandleButton, CopyLinkButton } from "../templates/CopyButton.js";
import { musicLinkLabel } from "../templates/MusicCard.js";
import { formatExif } from "../templates/PhotoPost.js";
import type { ArticleMetadata, BookMetadata, ContentObject, LinkMetadata, MusicMetadata, PhotoMetadata, QuoteMetadata, Site } from "../templates/types.js";
import { frontrowStyles } from "./frontrow-styles.js";

export { frontrowStyles };

// Front Row: a dark "stage" with one glossy tile or cover and a remote-control
// menu. The server renders every view as ordinary links; the optional script in
// frontrow-script.ts only moves the highlight, swaps the hero, and maps keys.

export type FrKind = "all" | ContentObject["type"];

export interface FrThumb {
  src: string;
  srcset?: string;
  alt?: string;
}

export interface FrItem {
  object: ContentObject;
  /** Bare permalink; list context is appended by the view. */
  href: string;
  thumb?: FrThumb;
}

/** Where a visitor came from, so the pager and back pill follow that list. */
export interface FrNav {
  kind: FrKind;
  label: string;
  listHref: string;
  position: number;
  total: number;
  prevHref?: string;
  nextHref?: string;
}

export interface FrSection {
  kind: FrKind;
  href: string;
  label: string;
}

const SECTION_ORDER: FrKind[] = ["all", "thought", "article", "link", "book", "music", "photo", "quote"];

export const FR_SECTION_PATH: Record<FrKind, string> = {
  all: "/",
  thought: "/posts",
  article: "/articles",
  link: "/links",
  book: "/books",
  music: "/music",
  photo: "/photos",
  quote: "/quotes",
};

const SECTION_LABEL: Record<FrKind, MessageKey> = {
  all: "all",
  thought: "posts",
  article: "articles",
  link: "links",
  book: "books",
  music: "music",
  photo: "photos",
  quote: "quotes",
};

const TYPE_LABEL: Record<ContentObject["type"], MessageKey> = {
  thought: "typeThought",
  article: "typeArticle",
  link: "typeLink",
  book: "typeBook",
  music: "typeMusic",
  photo: "typePhoto",
  quote: "typeQuote",
};

// 64×64 stroke icons. The "thought" bubble is the only addition to the
// handoff set (Flightstead has a short-post type the prototype did not).
const ICONS: Record<FrKind, string> = {
  all: '<rect x="10" y="10" width="18" height="18" rx="4"/><rect x="36" y="10" width="18" height="18" rx="4"/><rect x="10" y="36" width="18" height="18" rx="4"/><rect x="36" y="36" width="18" height="18" rx="4"/>',
  thought: '<path d="M10 12h44v30H30L18 53V42h-8z"/><path d="M21 24h22"/><path d="M21 32h14"/>',
  article: '<rect x="15" y="8" width="34" height="48" rx="4"/><path d="M23 20h18"/><path d="M23 29h18"/><path d="M23 38h18"/><path d="M23 47h10"/>',
  link: '<path d="M27 37l10-10"/><path d="M23 31l-6 6a8.5 8.5 0 0 0 12 12l6-6"/><path d="M41 33l6-6a8.5 8.5 0 0 0-12-12l-6 6"/>',
  book: '<path d="M8 14c8-3 16-3 24 2 8-5 16-5 24-2v36c-8-3-16-3-24 2-8-5-16-5-24-2z"/><path d="M32 16v36"/>',
  music: '<path d="M25 46V15l24-5v30"/><circle cx="19" cy="46" r="6"/><circle cx="43" cy="40" r="6"/>',
  photo: '<rect x="8" y="12" width="48" height="40" rx="6"/><path d="M8 44l14-14 10 10 8-8 16 16"/><circle cx="42" cy="23" r="4"/>',
  quote: '<path d="M14 40c0-10 4-16 12-20"/><path d="M14 40a6 6 0 1 0 6-6"/><path d="M36 40c0-10 4-16 12-20"/><path d="M36 40a6 6 0 1 0 6-6"/>',
};

export function frontrowSections(site: Site, availablePaths?: string[]): FrSection[] {
  return SECTION_ORDER
    .filter((kind) => kind === "all" || !availablePaths || availablePaths.includes(FR_SECTION_PATH[kind]))
    .map((kind) => ({ kind, href: FR_SECTION_PATH[kind], label: t(site.locale, SECTION_LABEL[kind]) }));
}

export function frontrowSectionLabel(locale: string, kind: FrKind): string {
  return t(locale, SECTION_LABEL[kind]);
}

/** `?from=` keeps a post's pager on the list the visitor opened it from. */
export function frontrowFromQuery(kind: FrKind | undefined, type: ContentObject["type"]): string {
  return kind && kind !== type ? `?from=${kind}` : "";
}

export const FR_KINDS = SECTION_ORDER;

/** The section menu; the site root opens the All list instead. */
export const FR_MENU_PATH = "/menu";

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function clip(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

function hostOf(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

function authorName(site: Site): string {
  return site.profileName?.trim() || site.title;
}

export function frontrowTitle(object: ContentObject, locale: string): string {
  switch (object.type) {
    case "article":
      return object.title || clip(stripBasicFormatting(object.body ?? ""), 90) || t(locale, "typeArticle");
    case "link":
      return object.title || (object.metadata as LinkMetadata).siteName || hostOf(object.sourceUrl) || object.sourceUrl || t(locale, "typeLink");
    case "book":
      return object.title || t(locale, "typeBook");
    case "music": {
      const metadata = object.metadata as MusicMetadata;
      return metadata.releaseTitle || object.title || t(locale, "typeMusic");
    }
    case "photo":
      return clip((object.metadata as PhotoMetadata).caption ?? "", 90) || t(locale, "typePhoto");
    case "quote":
      return clip(stripBasicFormatting(object.body ?? ""), 120) || t(locale, "typeQuote");
    case "thought":
      return clip(stripBasicFormatting(object.body ?? ""), 90) || t(locale, "typeThought");
  }
}

function frontrowByline(object: ContentObject, site: Site): string {
  switch (object.type) {
    case "link":
      return (object.metadata as LinkMetadata).siteName || hostOf(object.sourceUrl) || "";
    case "book":
      return (object.metadata as BookMetadata).author;
    case "music":
      return (object.metadata as MusicMetadata).artist;
    case "quote":
      return (object.metadata as QuoteMetadata).author;
    default:
      return authorName(site);
  }
}

function frDate(date: Date | null, locale: string): string {
  if (!date) return "";
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function isoDate(date: Date | null): string | undefined {
  return date ? date.toISOString() : undefined;
}

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function Icon({ kind }: { kind: FrKind }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[kind] }}
    />
  );
}

function Chevron({ direction }: { direction: "left" | "right" }) {
  return (
    <svg className="fr-chevron-icon" viewBox="0 0 12 18" width="12" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={direction === "left" ? "M9.5 2 2.5 9l7 7" : "M2.5 2l7 7-7 7"} />
    </svg>
  );
}

function Tile({ kind, size = "mini", label }: { kind: FrKind; size?: "mini" | "large"; label?: string }) {
  return (
    <span
      className={`fr-tile${size === "large" ? " fr-tile--large" : ""}`}
      data-kind={kind}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <Icon kind={kind} />
    </span>
  );
}

function ArtBox({ kind, thumb, alt, eager, reflection }: { kind: FrKind; thumb?: FrThumb; alt?: string; eager?: boolean; reflection?: boolean }) {
  if (!thumb) {
    return (
      <span className="fr-art">
        <span className="fr-tile fr-tile--hero" data-kind={kind} aria-hidden="true"><Icon kind={kind} /></span>
      </span>
    );
  }
  return (
    <span className="fr-art">
      <img
        className="fr-thumb"
        src={thumb.src}
        srcSet={thumb.srcset}
        sizes={thumb.srcset ? "(max-width: 900px) 120px, 280px" : undefined}
        alt={reflection ? "" : alt ?? thumb.alt ?? ""}
        loading={eager && !reflection ? "eager" : "lazy"}
        decoding="async"
      />
    </span>
  );
}

/**
 * The big tile or cover with its mirrored reflection. `decorative` heroes
 * (menu, list) repeat what the rows already say, so they are hidden from
 * assistive technology; a detail hero keeps its image alt text.
 */
function Hero({ kind, thumb, alt, decorative, eager }: { kind: FrKind; thumb?: FrThumb; alt?: string; decorative?: boolean; eager?: boolean }) {
  return (
    <div className="fr-hero" data-fr-hero aria-hidden={decorative ? true : undefined}>
      <div className="fr-hero-main" data-fr-slot="main">
        <ArtBox kind={kind} thumb={thumb} alt={alt} eager={eager} />
      </div>
      <div className="fr-hero-reflect" aria-hidden="true">
        <div className="fr-hero-flip" data-fr-slot="reflect">
          <ArtBox kind={kind} thumb={thumb} reflection />
        </div>
      </div>
    </div>
  );
}

function BackPill({ href, label, locale }: { href: string; label: string; locale: string }) {
  return (
    <a className="fr-pill" href={href} data-fr-back aria-label={t(locale, "backTo", { section: label })}>
      <Chevron direction="left" />
      <span>{label}</span>
    </a>
  );
}

function Pager({ nav, locale, className }: { nav: FrNav; locale: string; className?: string }) {
  if (nav.total < 2) return <span />;
  return (
    <nav className={`fr-pager${className ? ` ${className}` : ""}`} aria-label={nav.label}>
      {nav.prevHref ? (
        <a className="fr-pill fr-pill--round" rel="prev" href={nav.prevHref} data-fr-prev aria-label={t(locale, "previousPost")}>
          <Chevron direction="left" />
        </a>
      ) : (
        <span className="fr-pill fr-pill--round is-off" aria-hidden="true"><Chevron direction="left" /></span>
      )}
      <span className="fr-pager-count">{t(locale, "positionOf", { position: nav.position, total: nav.total })}</span>
      {nav.nextHref ? (
        <a className="fr-pill fr-pill--round" rel="next" href={nav.nextHref} data-fr-next aria-label={t(locale, "nextPost")}>
          <Chevron direction="right" />
        </a>
      ) : (
        <span className="fr-pill fr-pill--round is-off" aria-hidden="true"><Chevron direction="right" /></span>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Shell, menu, list
// ---------------------------------------------------------------------------

export function FrontRowShell({
  site,
  title,
  currentPath,
  composed,
  children,
}: {
  site: Site;
  title?: string;
  currentPath: string;
  /** True when the children already provide their own Front Row view. */
  composed: boolean;
  children: React.ReactNode;
}) {
  const origin = siteOrigin(site);
  const host = new URL(origin).host;
  const hasWorkPage = workPageEnabled();
  const hasImpressumPage = impressumPageEnabled(site.legalPage);
  const fediverseHandle = `@${site.subdomain}@${host}`;
  const ownHeading = currentPath === "/about" || currentPath === "/impressum";
  return (
    <>
      <a className="skip-link" href="#main-content">{t(site.locale, "skipToContent")}</a>
      <header className="fr-top">
        <a href="/">{host}</a>
        <span>{site.title}</span>
      </header>
      <main id="main-content">
        {composed ? children : (
          <div className="fr-page" data-fr-view="page">
            <BackPill href={FR_MENU_PATH} label={t(site.locale, "menu")} locale={site.locale} />
            {ownHeading || !title ? null : <h1 className="fr-sr">{title}</h1>}
            <div className="fr-page-body">{children}</div>
          </div>
        )}
      </main>
      <footer className="fr-foot">
        <nav aria-label={t(site.locale, "primaryNavigation")}>
          <a href="/archive">{t(site.locale, "archive")}</a>
          <a href="/search">{t(site.locale, "search")}</a>
          <a href="/about">{t(site.locale, "about")}</a>
          {hasWorkPage ? <><a href="/my-work">My work</a><a href="/contact">Contact</a></> : null}
          {hasImpressumPage ? <a href="/impressum">{site.legalPageTitle?.trim() || "Legal"}</a> : null}
        </nav>
        <p>
          <a href="/feed.xml">{t(site.locale, "followRss")}</a>
          {site.federationEnabled ? (
            <CopyHandleButton handle={fediverseHandle} label={t(site.locale, "fediverseLabel")} locale={site.locale} />
          ) : null}
        </p>
      </footer>
    </>
  );
}

export function FrontRowMenu({ site, sections }: { site: Site; sections: FrSection[] }) {
  const first = sections[0];
  return (
    <div className="fr-layout fr-layout--menu" data-fr-view="menu">
      <div className="fr-hero-col"><Hero kind={first.kind} decorative eager /></div>
      <div className="fr-main">
        <h1 className="fr-display">{site.title}</h1>
        {site.tagline ? <p className="fr-tagline">{site.tagline}</p> : null}
        <nav className="fr-menu-nav" aria-label={t(site.locale, "sections")}>
          <ul className="fr-rows" data-fr-rows>
            {sections.map((section, index) => (
              <li key={section.kind}>
                <a className="fr-row fr-row--menu" href={section.href} data-kind={section.kind} data-hl={index === 0 ? "true" : undefined}>
                  <span className="fr-row-label">{section.label}</span>
                  <Tile kind={section.kind} />
                  <span className="fr-chevron" aria-hidden="true"><Chevron direction="right" /></span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}

export function FrontRowList({
  site,
  title,
  kind,
  items,
  emptyKind = "all",
  pageHrefs = {},
  prefix,
}: {
  site: Site;
  title: string;
  /** The section being listed; undefined for search and archive results. */
  kind?: FrKind;
  items: FrItem[];
  emptyKind?: FrKind;
  pageHrefs?: { prev?: string; next?: string };
  prefix?: React.ReactNode;
}) {
  const first = items[0];
  return (
    <div className="fr-layout fr-layout--list" data-fr-view="list">
      <div className="fr-hero-col">
        <Hero kind={first ? first.object.type : emptyKind} thumb={first?.thumb} decorative eager />
      </div>
      <div className="fr-main">
        <div className="fr-head">
          <BackPill href={FR_MENU_PATH} label={t(site.locale, "menu")} locale={site.locale} />
          <h1 className="fr-display">{title}</h1>
        </div>
        {prefix}
        {items.length === 0 ? (
          <p className="fr-empty">{t(site.locale, "nothingHereYet")}</p>
        ) : (
          <ul className="fr-rows" data-fr-rows>
            {items.map((item, index) => {
              const { object } = item;
              const label = t(site.locale, TYPE_LABEL[object.type]);
              const byline = frontrowByline(object, site);
              const date = frDate(object.publishedAt, site.locale);
              const heading = frontrowTitle(object, site.locale);
              return (
                <li key={object.id}>
                  <a
                    className="fr-row fr-row--post"
                    id={`r-${object.slug}`}
                    href={`${item.href}${frontrowFromQuery(kind, object.type)}`}
                    data-kind={object.type}
                    data-hl={index === 0 ? "true" : undefined}
                    data-thumb={item.thumb?.src}
                    data-srcset={item.thumb?.srcset}
                  >
                    <span className="fr-row-text">
                      <span className="fr-row-title">{object.type === "quote" ? `“${heading}”` : heading}</span>
                      <span className="fr-row-meta">
                        {byline}
                        {byline && date ? <span className="fr-row-sep" aria-hidden="true"> · </span> : null}
                        <time className="fr-row-meta-date" dateTime={isoDate(object.publishedAt)}>{date}</time>
                      </span>
                    </span>
                    <time className="fr-row-date" dateTime={isoDate(object.publishedAt)}>{date}</time>
                    <Tile kind={object.type} label={label} />
                  </a>
                </li>
              );
            })}
            {pageHrefs.prev ? (
              <li>
                <a className="fr-row fr-row--more" href={pageHrefs.prev} rel="prev">
                  <Chevron direction="left" />
                  <span className="fr-row-label">{t(site.locale, "newerItems")}</span>
                </a>
              </li>
            ) : null}
            {pageHrefs.next ? (
              <li>
                <a className="fr-row fr-row--more" href={pageHrefs.next} rel="next">
                  <span className="fr-row-label">{t(site.locale, "moreItems")}</span>
                  <Chevron direction="right" />
                </a>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail views
// ---------------------------------------------------------------------------

function Rich({ html, className }: { html: string; className?: string }) {
  if (!html) return null;
  return <div className={`body-content${className ? ` ${className}` : ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Stars({ rating, locale }: { rating: number; locale: string }) {
  return (
    <span className="fr-stars" role="img" aria-label={t(locale, "ratingLabel", { rating })}>
      {"★".repeat(rating)}{"☆".repeat(5 - rating)}
    </span>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M4 10 10 4M5 4h5v5" />
    </svg>
  );
}

function ActionLink({ href, children, primary }: { href: string; children: React.ReactNode; primary?: boolean }) {
  return (
    <a className={`fr-btn${primary ? " fr-btn--primary" : ""}`} href={href} target="_blank" rel="noopener noreferrer">
      <span>{children}</span>
      <ExternalIcon />
    </a>
  );
}

function MusicActions({ object, locale }: { object: ContentObject; locale: string }) {
  const links = Object.entries(musicLinksFor(object.metadata as MusicMetadata))
    .filter((entry): entry is [string, string] => Boolean(entry[1]) && isSafeLinkUrl(entry[1] as string));
  if (links.length === 0) return null;
  const hasApple = links.some(([platform]) => platform === "appleMusic");
  return (
    <div className="fr-actions">
      {links.map(([platform, url]) => platform === "appleMusic" ? (
        // Apple's badge guidelines call for the official badge, not a restyled button.
        <a key={platform} className="fr-apple-badge" href={url} target="_blank" rel="noopener noreferrer" aria-label={musicLinkLabel(locale, platform, url)}>
          <img src="/static/apple-music/listen-on-apple-music.png" alt="" width="135" height="40" />
        </a>
      ) : (
        <ActionLink key={platform} href={url} primary={!hasApple && platform === links[0][0]}>{musicLinkLabel(locale, platform, url)}</ActionLink>
      ))}
      {hasApple ? (
        <p className="fr-credit">Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.</p>
      ) : null}
    </div>
  );
}

function BookActions({ object }: { object: ContentObject }) {
  const metadata = object.metadata as BookMetadata;
  const retailers = bookRetailerLinksFor(object.title ?? "", metadata.author, metadata);
  const entries = retailers ? flattenLinks(retailers) : [];
  if (entries.length === 0) return null;
  return (
    <div className="fr-actions">
      {entries.map((entry, index) => (
        <a
          key={entry.key}
          className={`fr-btn${index === 0 ? " fr-btn--primary" : ""}`}
          href={entry.url}
          target="_blank"
          rel="noopener noreferrer"
          data-amazon-region={entry.amazonRegion}
          hidden={entry.amazonRegion ? entry.amazonRegion !== "us" : undefined}
        >
          <span>{entry.label}</span>
          <ExternalIcon />
        </a>
      ))}
    </div>
  );
}

function MediaDetail({ site, item, nav }: { site: Site; item: FrItem; nav: FrNav }) {
  const { object } = item;
  const locale = site.locale;
  const title = frontrowTitle(object, locale);
  const date = frDate(object.publishedAt, locale);
  const typeLabel = t(locale, TYPE_LABEL[object.type]);
  let name = frontrowByline(object, site);
  let rating: number | undefined;
  let lead = "";
  let bodyHtml = "";
  let actions: React.ReactNode = null;
  let heading = title;
  let alt = "";

  switch (object.type) {
    case "article": {
      const metadata = object.metadata as ArticleMetadata;
      lead = metadata.excerpt ?? "";
      bodyHtml = formatRichText(object.body ?? "");
      alt = metadata.coverAltText ?? "";
      break;
    }
    case "link": {
      const metadata = object.metadata as LinkMetadata;
      lead = metadata.excerpt ?? "";
      bodyHtml = formatBasicText(object.body ?? "");
      const site_ = metadata.siteName || hostOf(object.sourceUrl);
      if (object.sourceUrl && isSafeLinkUrl(object.sourceUrl)) {
        actions = (
          <div className="fr-actions">
            <ActionLink href={object.sourceUrl} primary>{t(locale, "visitSite", { site: site_ ?? t(locale, "typeLink") })}</ActionLink>
          </div>
        );
      }
      break;
    }
    case "book": {
      const metadata = object.metadata as BookMetadata;
      rating = metadata.rating;
      bodyHtml = formatBasicText(object.body ?? "");
      alt = object.title ? `Cover of ${object.title}` : "";
      actions = <BookActions object={object} />;
      break;
    }
    case "music": {
      bodyHtml = formatBasicText(object.body ?? "");
      alt = `Artwork for ${title}`;
      actions = <MusicActions object={object} locale={locale} />;
      break;
    }
    case "thought": {
      // A short post is its own headline; a long one gets a leading excerpt
      // as the heading and the complete text below.
      const plain = stripBasicFormatting(object.body ?? "");
      bodyHtml = plain.length > 90 || /\n/.test(plain) ? formatRichText(object.body ?? "") : "";
      name = authorName(site);
      heading = bodyHtml ? title : clip(plain, 240) || title;
      break;
    }
  }

  return (
    <div className="fr-layout fr-layout--detail" data-fr-view="detail" data-kind={object.type}>
      <div className="fr-hero-col"><Hero kind={object.type} thumb={item.thumb} alt={alt} eager /></div>
      <div className="fr-main">
        <div className="fr-detail-nav">
          <BackPill href={nav.listHref} label={nav.label} locale={locale} />
          <Pager nav={nav} locale={locale} />
        </div>
        <article className="fr-article">
          <p className="fr-eyebrow"><span className="fr-swatch" data-kind={object.type} aria-hidden="true" />{typeLabel}</p>
          <h1 className="fr-detail-title">{heading}</h1>
          <div className="fr-byline">
            {name ? <span className="fr-byline-name">{name}</span> : null}
            {rating ? <Stars rating={rating} locale={locale} /> : null}
            <span className="fr-date"><time dateTime={isoDate(object.publishedAt)}>{date}</time><CopyLinkButton locale={locale} /></span>
          </div>
          {lead || bodyHtml ? (
            <div className="fr-body">
              {lead ? <p className="fr-lead">{lead}</p> : null}
              <Rich html={bodyHtml} />
            </div>
          ) : null}
          {actions}
        </article>
      </div>
    </div>
  );
}

function PhotoDetail({ site, item, nav, exif, width, height, original }: { site: Site; item: FrItem; nav: FrNav; exif?: AssetExif; width?: number; height?: number; original?: string }) {
  const { object } = item;
  const locale = site.locale;
  const metadata = object.metadata as PhotoMetadata;
  const heading = frontrowTitle(object, locale);
  const rows = formatExif(exif, locale);
  const thumb = item.thumb;
  const ratio = width && height ? { aspectRatio: `${width} / ${height}` } : undefined;
  return (
    <article className="fr-photo-stage" data-fr-view="detail" data-kind="photo">
      <div className="fr-photo-fig">
        {thumb ? (
          <div className="fr-photo-box">
            <img
              className="fr-photo"
              src={thumb.src}
              srcSet={original ? `${thumb.src} 1200w, ${original} 2400w` : thumb.srcset}
              sizes="(max-width: 900px) 100vw, 1100px"
              alt={metadata.altText ?? ""}
              width={width}
              height={height}
              style={ratio}
              loading="eager"
              decoding="async"
            />
            <div className="fr-photo-reflect" aria-hidden="true">
              <img className="fr-photo fr-photo--reflection" src={thumb.src} alt="" width={width} height={height} style={ratio} loading="lazy" decoding="async" />
            </div>
          </div>
        ) : (
          <div className="fr-photo-empty"><Tile kind="photo" size="large" /></div>
        )}
      </div>
      <div className="fr-photo-bar">
        <div className="fr-photo-caption">
          <BackPill href={nav.listHref} label={nav.label} locale={locale} />
          <h1>{heading}</h1>
          <p className="fr-date">
            <time dateTime={isoDate(object.publishedAt)}>{frDate(object.publishedAt, locale)}</time>
            {rows ? <span className="fr-exif"> · {rows.map((row) => row.value).join(" · ")}</span> : null}
            <CopyLinkButton locale={locale} />
          </p>
        </div>
        <Pager nav={nav} locale={locale} />
      </div>
    </article>
  );
}

function QuoteDetail({ site, item, nav }: { site: Site; item: FrItem; nav: FrNav }) {
  const { object } = item;
  const locale = site.locale;
  const metadata = object.metadata as QuoteMetadata;
  const text = object.body ?? "";
  const long = text.length > 200;
  return (
    <article className="fr-quote-stage" data-fr-view="detail" data-kind="quote">
      <h1 className="fr-sr">{metadata.author ? `${t(locale, "typeQuote")}: ${metadata.author}` : t(locale, "typeQuote")}</h1>
      <Tile kind="quote" size="large" />
      <blockquote className={`fr-quote${long ? " fr-quote--long" : ""}`}>
        <p>{text}</p>
      </blockquote>
      <p className="fr-quote-by">
        {metadata.author ? <span className="fr-byline-name">— {metadata.author}</span> : null}
        <span className="fr-date"><time dateTime={isoDate(object.publishedAt)}>{frDate(object.publishedAt, locale)}</time><CopyLinkButton locale={locale} /></span>
      </p>
      {metadata.comment ? <div className="fr-body"><Rich html={formatBasicText(metadata.comment)} /></div> : null}
      <div className="fr-quote-bar">
        <BackPill href={nav.listHref} label={nav.label} locale={locale} />
        <Pager nav={nav} locale={locale} />
      </div>
    </article>
  );
}

export function FrontRowDetail({
  site,
  item,
  nav,
  exif,
  imageWidth,
  imageHeight,
  originalSrc,
}: {
  site: Site;
  item: FrItem;
  nav: FrNav;
  exif?: AssetExif;
  imageWidth?: number;
  imageHeight?: number;
  originalSrc?: string;
}) {
  if (item.object.type === "photo") {
    return <PhotoDetail site={site} item={item} nav={nav} exif={exif} width={imageWidth} height={imageHeight} original={originalSrc} />;
  }
  if (item.object.type === "quote") return <QuoteDetail site={site} item={item} nav={nav} />;
  return <MediaDetail site={site} item={item} nav={nav} />;
}
