import React from "react";
import { formatDate } from "./ThoughtPost.js";
import { CopyLinkButton } from "./CopyButton.js";
import { BackLink } from "./BackLink.js";
import { t } from "../i18n.js";
import { formatRichText } from "../format.js";
import { quickPostPreview, quickPostTitle } from "../quick-post.js";
import { CabinetClose, CabinetThoughtFeedItem } from "../themes/cabinet.js";
import { CloseButton } from "../themes/cards.js";
import type { ContentObject } from "./types.js";

/** Inline Quick Post card shared by the public article listing renderers. */
export function QuickPostCard({ object, locale = "en", theme = "classic" }: {
  object: ContentObject;
  locale?: string;
  theme?: string;
}) {
  const body = object.body ?? "";
  const preview = quickPostPreview(body);
  const href = `/articles/${object.slug}`;
  const bodyHtml = preview.html;
  const readMore = preview.truncated ? (
    <a className="quick-post-read-more" href={href}>{t(locale, "readMore")} <span aria-hidden="true">→</span></a>
  ) : null;
  const title = quickPostTitle(body) || t(locale, "typeQuickPost");
  const date = <a className="quick-post-permalink" href={href} aria-label={`${t(locale, "permalink")}: ${title}`}><time dateTime={object.publishedAt?.toISOString()}>{formatDate(object.publishedAt, locale)}</time></a>;
  const classes = `quick-post-card${theme === "cards" || theme === "prism" || theme === "ledger" ? " cards-item" : " card"}`;

  if (theme === "cabinet") {
    return <CabinetThoughtFeedItem
      href={href}
      type={object.type}
      eyebrow={t(locale, "typeQuickPost")}
      title={title}
      richHtml={bodyHtml}
      dateLabel={date}
      detailLabel={`${t(locale, "permalink")}: ${title}`}
      actionLabel={readMore}
      quickPost
      truncated={preview.truncated}
    />;
  }

  return (
    <article className={classes} data-quick-post data-quick-post-truncated={preview.truncated || undefined}>
      <div className="body-content quick-post-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      <p className="meta quick-post-meta">
        {date}
        {readMore}
      </p>
    </article>
  );
}

/** Full Quick Post permalink page. The post body supplies its accessible heading. */
export function QuickPostPage({ object, locale = "en", theme = "classic", backHref = "/", backLabel = "Back" }: {
  object: ContentObject;
  locale?: string;
  theme?: string;
  backHref?: string;
  backLabel?: string;
}) {
  const body = object.body ?? "";
  const title = quickPostTitle(body);
  const heading = title || t(locale, "typeQuickPost");
  const bodyHtml = formatRichText(body);
  return (
    <>
      {theme === "classic" || theme === "washi" || theme === "aqua" ? <BackLink href={backHref} label={backLabel} /> : null}
      {theme === "cabinet" ? <CabinetClose backHref={backHref} backLabel={backLabel} /> : null}
      {theme === "cards" || theme === "prism" || theme === "ledger" ? <CloseButton backHref={backHref} backLabel={backLabel} /> : null}
      <article className={`quick-post-detail${theme === "cards" || theme === "prism" || theme === "ledger" ? " cards-article-detail" : " article-detail"}`} data-quick-post>
        <h1 className="quick-post-sr-heading">{heading}</h1>
        <p className="meta quick-post-meta">
          {formatDate(object.publishedAt, locale)}
          <CopyLinkButton locale={locale} />
        </p>
        <div className="body-content quick-post-body" dangerouslySetInnerHTML={{ __html: bodyHtml }} />
      </article>
    </>
  );
}
