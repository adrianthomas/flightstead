import React from "react";
import type { AssetExif } from "../../db/schema.js";
import { bookRetailerLinksFor } from "../../lib/book-links.js";
import { musicLinksFor } from "../../lib/music-links.js";
import { formatBasicText, formatRichText, isSafeLinkUrl } from "../format.js";
import { t, type MessageKey } from "../i18n.js";
import { formatDate } from "../templates/ThoughtPost.js";
import { BookLinks } from "../templates/BookCard.js";
import { musicLinkLabel } from "../templates/MusicCard.js";
import {
  publicBookCoverUrl,
  publicLinkPreviewImageUrl,
  publicMusicArtworkUrl,
  type ArticleMetadata,
  type BookMetadata,
  type ContentObject,
  type LinkMetadata,
  type MusicMetadata,
  type PhotoMetadata,
  type QuoteMetadata,
} from "../templates/types.js";
import { formatExif } from "../templates/PhotoPost.js";

const TYPE_LABEL: Record<ContentObject["type"], MessageKey> = {
  thought: "typeThought",
  article: "typeArticle",
  link: "typeLink",
  book: "typeBook",
  music: "typeMusic",
  photo: "typePhoto",
  quote: "typeQuote",
};

export interface StreamItemProps {
  object: ContentObject;
  locale: string;
  href: string;
  imageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  exif?: AssetExif;
  eager?: boolean;
  detail?: boolean;
}

function RichBody({ text, rich = false, className }: { text: string | null | undefined; rich?: boolean; className?: string }) {
  if (!text) return null;
  return (
    <div
      className={`stream-body body-content${className ? ` ${className}` : ""}`}
      dangerouslySetInnerHTML={{ __html: rich ? formatRichText(text) : formatBasicText(text) }}
    />
  );
}

function StreamImage({
  src,
  alt,
  width,
  height,
  eager,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  eager?: boolean;
  className: string;
}) {
  return (
    <img
      className={className}
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
    />
  );
}

function LinkHost({ url }: { url?: string | null }) {
  if (!url) return null;
  try {
    return <>{new URL(url).hostname.replace(/^www\./, "")}</>;
  } catch {
    return null;
  }
}

function SafeOutbound({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  if (!isSafeLinkUrl(href)) return <span className={className}>{children}</span>;
  return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
}

function MusicActions({ metadata, locale }: { metadata: MusicMetadata; locale: string }) {
  const links = Object.entries(musicLinksFor(metadata)).filter(
    (entry): entry is [string, string] => Boolean(entry[1]) && isSafeLinkUrl(entry[1]!),
  );
  if (!links.length) return null;
  return (
    <nav className="stream-actions stream-music-actions" aria-label={t(locale, "music")}>
      {links.map(([platform, url]) => platform === "appleMusic" ? (
        <span className="stream-music-badge-wrap" key={platform}>
          <a href={url} aria-label={musicLinkLabel(locale, platform, url)} target="_blank" rel="noopener noreferrer">
            <img className="apple-music-badge-image" src="/static/apple-music/listen-on-apple-music.png" alt="Listen on Apple Music" />
          </a>
          <span className="apple-music-credit">Apple and Apple Music are trademarks of Apple Inc., registered in the U.S. and other countries.</span>
        </span>
      ) : (
        <a className="stream-action" href={url} key={platform} target="_blank" rel="noopener noreferrer">
          {musicLinkLabel(locale, platform, url)} <span aria-hidden="true">↗</span>
        </a>
      ))}
    </nav>
  );
}

function StreamContent({ object, locale, imageUrl, imageWidth, imageHeight, exif, eager, detail }: StreamItemProps) {
  const Heading = detail ? "h1" : "h2";
  switch (object.type) {
    case "thought":
      return <RichBody text={object.body} rich className="stream-thought" />;
    case "article": {
      const metadata = object.metadata as ArticleMetadata;
      return (
        <>
          <Heading className="stream-entry-title">{object.title || t(locale, "typeArticle")}</Heading>
          {metadata.excerpt ? <p className="stream-excerpt">{metadata.excerpt}</p> : null}
          {imageUrl ? <StreamImage className="stream-feature-image" src={imageUrl} alt={metadata.coverAltText ?? ""} width={imageWidth} height={imageHeight} eager={eager} /> : null}
          <RichBody text={object.body} rich />
        </>
      );
    }
    case "link": {
      const metadata = object.metadata as LinkMetadata;
      const previewUrl = publicLinkPreviewImageUrl(metadata);
      const outbound = object.sourceUrl && isSafeLinkUrl(object.sourceUrl) ? object.sourceUrl : undefined;
      const host = metadata.siteName || (object.sourceUrl ? <LinkHost url={object.sourceUrl} /> : undefined);
      const title = object.title || host || object.sourceUrl || t(locale, "links");
      return (
        <>
          {previewUrl ? <StreamImage className="stream-link-preview" src={previewUrl} alt="" width={imageWidth} height={imageHeight} eager={eager} /> : null}
          <div className="stream-link-heading">
            <Heading className="stream-content-title">
              {outbound ? <SafeOutbound href={outbound}>{title} <span aria-hidden="true">↗</span></SafeOutbound> : title}
            </Heading>
            {host ? <p className="stream-link-host">{host}</p> : null}
          </div>
          {metadata.excerpt ? <p className="stream-excerpt">{metadata.excerpt}</p> : null}
          <RichBody text={object.body} />
          {outbound ? <nav className="stream-actions" aria-label={t(locale, "links")}><SafeOutbound className="stream-action" href={outbound}>{t(locale, "openLink")} <span aria-hidden="true">↗</span></SafeOutbound></nav> : null}
        </>
      );
    }
    case "book": {
      const metadata = object.metadata as BookMetadata;
      const cover = publicBookCoverUrl(metadata);
      const links = bookRetailerLinksFor(object.title ?? "", metadata.author, metadata);
      return (
        <>
          <div className="stream-artwork-heading">
            {cover ? <StreamImage className="stream-artwork stream-artwork--book" src={cover} alt={object.title ? `Cover of ${object.title}` : ""} eager={eager} /> : null}
            <div className="stream-artwork-copy">
              <Heading className="stream-content-title">{object.title}</Heading>
              <p className="stream-subtitle">{metadata.author}</p>
              {metadata.rating ? <p className="stream-rating"><span aria-hidden="true">{"★".repeat(metadata.rating)}{"☆".repeat(5 - metadata.rating)}</span><span className="sr-only">{t(locale, "ratingLabel", { rating: metadata.rating })}</span></p> : null}
            </div>
          </div>
          <RichBody text={object.body} />
          <BookLinks links={links} />
        </>
      );
    }
    case "music": {
      const metadata = object.metadata as MusicMetadata;
      const artwork = publicMusicArtworkUrl(metadata);
      return (
        <>
          <div className="stream-artwork-heading">
            {artwork ? <StreamImage className="stream-artwork stream-artwork--music" src={artwork} alt={`Artwork for ${metadata.releaseTitle}`} eager={eager} /> : null}
            <div className="stream-artwork-copy">
              <Heading className="stream-content-title">{metadata.releaseTitle}</Heading>
              <p className="stream-subtitle">{metadata.artist}</p>
            </div>
          </div>
          <RichBody text={object.body} />
          <MusicActions metadata={metadata} locale={locale} />
        </>
      );
    }
    case "photo": {
      const metadata = object.metadata as PhotoMetadata;
      const rows = formatExif(exif, locale);
      return (
        <>
          <Heading className="stream-sr-only">{t(locale, "typePhoto")}</Heading>
          {imageUrl ? <StreamImage className="stream-feature-image stream-photo-image" src={imageUrl} alt={metadata.altText ?? ""} width={imageWidth} height={imageHeight} eager={eager} /> : null}
          {metadata.caption ? <p className="stream-caption">{metadata.caption}</p> : null}
          {rows?.length ? <dl className="stream-exif">{rows.map((row) => <div key={row.label}><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl> : null}
        </>
      );
    }
    case "quote": {
      const metadata = object.metadata as QuoteMetadata;
      return (
        <>
          <Heading className="stream-sr-only">{t(locale, "typeQuote")}</Heading>
          <blockquote className="stream-quote"><p>“{object.body}”</p><footer>— <cite>{metadata.author}</cite></footer></blockquote>
          <RichBody text={metadata.comment} />
        </>
      );
    }
  }
}

export function StreamItem(props: StreamItemProps) {
  const { object, locale, href, detail = false } = props;
  const label = t(locale, TYPE_LABEL[object.type]);
  const date = formatDate(object.publishedAt, locale);
  const title = label;
  return (
    <article className={`stream-item stream-item--${object.type}${detail ? " stream-item--detail" : ""}`}>
      <aside className="stream-rail" aria-label={`${label}${date ? ` · ${date}` : ""}`}>
        <span className="stream-type">{label}</span>
        {date ? <time className="stream-date" dateTime={object.publishedAt?.toISOString()}>{date}</time> : null}
        <a className="stream-permalink" href={href} aria-label={`${t(locale, "permalink")}: ${object.title || label}${date ? ` · ${date}` : ""}`}>
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 .1l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7-.1l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></svg>
          <span className="stream-permalink-label">{t(locale, "permalink")}</span>
        </a>
      </aside>
      <div className="stream-entry">
        {object.type === "thought" ? (detail ? <h1 className="stream-sr-only">{title}</h1> : <h2 className="stream-sr-only">{title}</h2>) : null}
        <StreamContent {...props} />
      </div>
    </article>
  );
}

export const streamStyles = `
html[data-theme="stream"] {
  color-scheme: light dark;
  --stream-paper: #faf9f6;
  --stream-ink: #20251f;
  --stream-muted: #626a60;
  --stream-rule: #dcdfd8;
  --stream-accent: #526a57;
  --stream-focus: #3f6848;
  --bg: var(--stream-paper);
  --fg: var(--stream-ink);
  --muted: var(--stream-muted);
  --border: var(--stream-rule);
  --focus: var(--stream-focus);
  background: var(--stream-paper);
  color: var(--stream-ink);
  font-family: Charter, "Bitstream Charter", "Sitka Text", Georgia, serif;
  font-size: 1rem;
  line-height: 1.72;
}
@media (prefers-color-scheme: dark) {
  html[data-theme="stream"] {
    --stream-paper: #171b18;
    --stream-ink: #e8e9e2;
    --stream-muted: #a8b0a5;
    --stream-rule: #373d38;
    --stream-accent: #a9c1a9;
    --stream-focus: #c5e2c6;
    --bg: var(--stream-paper);
    --fg: var(--stream-ink);
    --muted: var(--stream-muted);
    --border: var(--stream-rule);
    --focus: var(--stream-focus);
  }
}
html[data-theme="stream"] body { max-width: 1080px; padding: 3rem 40px 2rem; background: var(--stream-paper); color: var(--stream-ink); font-family: Charter, "Bitstream Charter", "Sitka Text", Georgia, serif; overflow-wrap: anywhere; }
html[data-theme="stream"] header.site-header { display: grid; grid-template-columns: minmax(0, 1fr) auto; max-width: 920px; margin: 0 auto .75rem; padding-bottom: 1.3rem; border-bottom: 1px solid var(--stream-rule); align-items: center; gap: .8rem 1rem; }
html[data-theme="stream"] .site-header-left { display: contents; }
html[data-theme="stream"] .site-identity { grid-column: 1 / -1; }
html[data-theme="stream"] .category-filter { grid-column: 1; }
html[data-theme="stream"] .site-header-right { grid-column: 2; }
html[data-theme="stream"] .site-identity h1 { font-family: Charter, "Bitstream Charter", Georgia, serif; font-size: 1.75rem; font-weight: 500; letter-spacing: -.04em; }
html[data-theme="stream"] .site-identity h1 a { text-decoration: none; }
html[data-theme="stream"] .site-identity h1 a::after { content: ""; display: inline-block; width: .36em; height: .36em; margin: 0 0 .12em .38em; border-radius: 50%; background: var(--stream-accent); }
html[data-theme="stream"] .site-tagline { max-width: 34rem; margin: .4rem 0 0; color: var(--stream-muted); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .86rem; line-height: 1.5; }
html[data-theme="stream"] .site-header-right { align-items: flex-end; gap: .5rem; }
html[data-theme="stream"] .header-links { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .76rem; }
html[data-theme="stream"] .header-links a { min-height: 44px; display: inline-flex; align-items: center; color: var(--stream-muted); }
html[data-theme="stream"] .site-header-right nav { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .2rem .9rem; }
html[data-theme="stream"] .site-header-right nav a { min-height: 44px; display: inline-flex; align-items: center; color: var(--stream-ink); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .75rem; text-decoration: none; }
html[data-theme="stream"] .site-header-right nav a:hover, html[data-theme="stream"] .header-links a:hover { color: var(--stream-accent); }
html[data-theme="stream"] .category-filter-trigger { min-height: 44px; max-width: 100%; border-color: var(--stream-rule); border-radius: 3px; background: transparent; color: var(--stream-ink); }
html[data-theme="stream"] .category-filter-trigger svg { flex-shrink: 0; }
html[data-theme="stream"] .category-filter-trigger span { min-width: 0; }
html[data-theme="stream"] .category-filter-menu { width: min(14rem, calc(100vw - 3rem)); min-width: 0; max-height: min(70vh, 32rem); overflow: auto; background: var(--stream-paper); border-radius: 6px; }
html[data-theme="stream"] main { max-width: 920px; margin: 0 auto; }
html[data-theme="stream"] :where(a, button, summary) { color: inherit; }
html[data-theme="stream"] :where(a, button, summary):focus-visible { outline: 2px solid var(--stream-focus); outline-offset: 4px; border-radius: 2px; }
html[data-theme="stream"] :where(.site-header, .site-nav, .site-main, .site-footer) { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
html[data-theme="stream"] .stream-item { position: relative; display: grid; grid-template-columns: minmax(0, 124px) minmax(0, 640px); column-gap: clamp(24px, 5vw, 64px); max-width: 920px; margin: 0 auto; padding: 2.75rem 0 3.5rem; border-bottom: 1px solid var(--stream-rule); }
html[data-theme="stream"] .stream-feed > .stream-item:last-child { border-bottom: 0; }
html[data-theme="stream"] .stream-rail { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; padding-top: 10px; color: var(--stream-muted); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .78rem; line-height: 1.45; text-align: right; }
html[data-theme="stream"] .stream-type { color: var(--stream-accent); font-size: .66rem; font-weight: 650; letter-spacing: .11em; text-transform: uppercase; }
html[data-theme="stream"] .stream-date { font-variant-numeric: tabular-nums; }
html[data-theme="stream"] .stream-permalink { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; margin-right: -10px; padding: 0 10px; color: var(--stream-muted); font-size: .7rem; text-decoration: none; }
html[data-theme="stream"] .stream-permalink:hover { color: var(--stream-accent); }
html[data-theme="stream"] .stream-permalink svg { color: var(--stream-accent); flex-shrink: 0; }
html[data-theme="stream"] .stream-entry { min-width: 0; }
html[data-theme="stream"] .stream-entry-title, html[data-theme="stream"] .stream-content-title { margin: 0 0 17px; color: var(--stream-ink); font-family: Charter, "Bitstream Charter", "Sitka Display", Georgia, serif; font-size: clamp(1.75rem, 3.4vw, 2.4rem); font-weight: 500; letter-spacing: -.025em; line-height: 1.2; overflow-wrap: anywhere; }
html[data-theme="stream"] .stream-entry-title { margin-bottom: 17px; }
html[data-theme="stream"] .stream-entry-title + .stream-excerpt { margin-top: -5px; }
html[data-theme="stream"] .stream-content-title a { text-decoration-thickness: 1px; text-decoration-color: var(--stream-rule); text-underline-offset: .15em; }
html[data-theme="stream"] .stream-body { max-width: 68ch; color: var(--stream-ink); font-size: 1.125rem; line-height: 1.72; overflow-wrap: anywhere; }
html[data-theme="stream"] .stream-body > :first-child { margin-top: 0; }
html[data-theme="stream"] .stream-body > :last-child { margin-bottom: 0; }
html[data-theme="stream"] .stream-body :where(h1,h2,h3,h4,h5,h6) { margin: 1.65em 0 .55em; font-family: Charter, Georgia, serif; font-size: 1.35em; font-weight: 550; line-height: 1.25; }
html[data-theme="stream"] .stream-body h1 { font-size: 1.55em; }
html[data-theme="stream"] .stream-body h3 { font-size: 1.2em; }
html[data-theme="stream"] .stream-body :where(h4,h5,h6) { font-size: 1.05em; }
html[data-theme="stream"] .stream-body :where(p,ul,ol,blockquote,pre,table) { margin-block: 0 1.15em; }
html[data-theme="stream"] .stream-body blockquote { margin-left: 0; padding-left: 1.15rem; border-left: 2px solid var(--stream-accent); color: var(--stream-muted); }
html[data-theme="stream"] .stream-body img { display: block; max-width: 100%; height: auto; margin: 1.5rem auto; }
html[data-theme="stream"] .stream-excerpt, html[data-theme="stream"] .stream-subtitle { margin: -3px 0 20px; color: var(--stream-muted); font-size: 1.02rem; line-height: 1.55; }
html[data-theme="stream"] .stream-artwork-heading { display: flex; align-items: flex-start; gap: 22px; margin-bottom: 21px; }
html[data-theme="stream"] .stream-artwork { flex: 0 0 auto; width: clamp(90px, 13vw, 116px); height: auto; object-fit: contain; border: 1px solid var(--stream-rule); }
html[data-theme="stream"] .stream-artwork--music { aspect-ratio: 1; }
html[data-theme="stream"] .stream-artwork--book { aspect-ratio: 2 / 3; }
html[data-theme="stream"] .stream-artwork-copy { min-width: 0; padding-top: 3px; }
html[data-theme="stream"] .stream-artwork-copy .stream-content-title { margin-bottom: 8px; font-size: clamp(1.4rem, 3vw, 1.9rem); }
html[data-theme="stream"] .stream-subtitle { margin: 0; }
html[data-theme="stream"] .stream-rating { margin: 10px 0 0; color: var(--stream-accent); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .92rem; letter-spacing: .08em; }
html[data-theme="stream"] .stream-feature-image, html[data-theme="stream"] .stream-link-preview { display: block; width: auto; max-width: 100%; height: auto; margin: 23px auto; }
html[data-theme="stream"] .stream-photo-image { max-height: 75vh; }
html[data-theme="stream"] .stream-caption { margin: -8px 0 16px; color: var(--stream-muted); font-size: .9rem; }
html[data-theme="stream"] .stream-exif { display: flex; flex-wrap: wrap; gap: 7px 18px; margin: 15px 0 0; color: var(--stream-muted); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .72rem; line-height: 1.4; }
html[data-theme="stream"] .stream-exif > div { display: flex; gap: 5px; }
html[data-theme="stream"] .stream-exif dt { font-weight: 600; }
html[data-theme="stream"] .stream-exif dd { margin: 0; }
html[data-theme="stream"] .stream-quote { margin: 0 0 19px; font-size: clamp(1.4rem, 3vw, 1.95rem); line-height: 1.48; }
html[data-theme="stream"] .stream-quote p { margin: 0 0 12px; }
html[data-theme="stream"] .stream-quote footer { color: var(--stream-muted); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .82rem; }
html[data-theme="stream"] .stream-link-heading { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 15px; }
html[data-theme="stream"] .stream-link-heading .stream-content-title { margin-bottom: 8px; }
html[data-theme="stream"] .stream-link-host { margin: 0 0 10px; color: var(--stream-muted); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; font-size: .78rem; }
html[data-theme="stream"] .stream-actions, html[data-theme="stream"] .book-actions, html[data-theme="stream"] .music-links { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin: 20px 0 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
html[data-theme="stream"] .stream-action, html[data-theme="stream"] .book-more summary { display: inline-flex; align-items: center; justify-content: center; min-height: 44px; padding: 0 14px; border: 1px solid var(--stream-rule); border-radius: 3px; color: var(--stream-ink); font-size: .8rem; text-decoration: none; }
html[data-theme="stream"] .stream-action:hover, html[data-theme="stream"] .book-more summary:hover { border-color: var(--stream-accent); color: var(--stream-accent); }
html[data-theme="stream"] .stream-music-badge-wrap { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 5px; }
html[data-theme="stream"] .stream-music-badge-wrap > a { display: flex; min-height: 44px; align-items: center; }
html[data-theme="stream"] .stream-music-badge-wrap .apple-music-badge-image { width: auto; max-width: 100%; height: 34px; }
html[data-theme="stream"] .stream-music-badge-wrap .apple-music-credit { color: var(--stream-muted); font-size: .62rem; line-height: 1.3; }
html[data-theme="stream"] .book-more { position: relative; }
html[data-theme="stream"] .book-more summary { cursor: pointer; }
html[data-theme="stream"] .book-more-links { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 8px; }
html[data-theme="stream"] .book-more-links .content-action-button { display: inline-flex; min-height: 44px; align-items: center; padding: 0 12px; border: 1px solid var(--stream-rule); border-radius: 3px; color: var(--stream-ink); font-size: .76rem; text-decoration: none; }
html[data-theme="stream"] .book-more-links .content-action-button:hover { border-color: var(--stream-accent); color: var(--stream-accent); }
html[data-theme="stream"] .stream-sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
html[data-theme="stream"] .stream-item--detail { padding-top: 34px; border-bottom: 0; }
html[data-theme="stream"] .stream-item--detail .stream-entry-title { font-size: clamp(1.8rem, 4.2vw, 2.8rem); }
html[data-theme="stream"] .stream-item--detail .stream-permalink { pointer-events: auto; }
html[data-theme="stream"] .stream-entry :where(a) { text-underline-offset: .16em; }
html[data-theme="stream"] .site-footer { border-top: 1px solid var(--stream-rule); }
html[data-theme="stream"] footer.site-footer { max-width: 920px; margin: 3.5rem auto 0; padding-top: 1.5rem; }
html[data-theme="stream"] .site-footer-inner { padding: 0; border: 0; border-radius: 0; background: transparent; }
html[data-theme="stream"] .site-footer-nav { flex-wrap: wrap; }
@media (max-width: 700px) {
  html[data-theme="stream"] body { padding: 2rem 22px 1.5rem; }
  html[data-theme="stream"] header.site-header { margin-bottom: .25rem; }
  html[data-theme="stream"] .site-header-right { align-items: flex-end; }
  html[data-theme="stream"] .site-header-right nav { justify-content: flex-start; }
  html[data-theme="stream"] .stream-item { grid-template-columns: minmax(0, 1fr); gap: 11px; padding: 34px 0 39px; }
  html[data-theme="stream"] .stream-rail { order: 0; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 4px 10px; padding: 0; text-align: left; }
  html[data-theme="stream"] .stream-permalink { min-height: 44px; margin: -8px 0 -8px -8px; padding-inline: 8px; }
  html[data-theme="stream"] .stream-entry { grid-row: 2; }
  html[data-theme="stream"] .stream-artwork-heading { gap: 16px; }
  html[data-theme="stream"] .stream-artwork { width: clamp(84px, 24vw, 108px); }
}
@media (max-width: 360px) {
  html[data-theme="stream"] body { padding-inline: 16px; }
  html[data-theme="stream"] .stream-permalink-label { display: none; }
  html[data-theme="stream"] .stream-artwork-heading { gap: 12px; }
}
@media (max-width: 560px) {
  html[data-theme="stream"] .header-links { flex-wrap: wrap; justify-content: flex-end; }
  html[data-theme="stream"] .site-header-right { min-width: 0; max-width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  html[data-theme="stream"] *, html[data-theme="stream"] *::before, html[data-theme="stream"] *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
}
@media (forced-colors: active) {
  html[data-theme="stream"] { --stream-paper: Canvas; --stream-ink: CanvasText; --stream-muted: CanvasText; --stream-rule: GrayText; --stream-accent: LinkText; --stream-focus: Highlight; --bg: Canvas; --fg: CanvasText; --muted: CanvasText; --border: GrayText; --focus: Highlight; }
  html[data-theme="stream"] :where(.stream-action, .book-more summary, .book-more-links .content-action-button) { border-color: ButtonText; }
}
@media (min-width: 701px) {
  html[data-theme="stream"] .stream-item--thought .stream-thought { padding-top: 1px; }
}
`;
