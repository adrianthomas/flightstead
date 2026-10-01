// Think: an independent studio journal with the optimism of early personal
// computing. Silver tabs, a spectral signature, cobalt lead stories, and
// precise Helvetica typography; ordinary server-rendered links throughout.
export const thinkStyles = `
  html[data-theme="think"] {
    --fg: #202124;
    --bg: #f0f0eb;
    --muted: #5b5e64;
    --border: #777b82;
    --focus: #143bd1;
    --think-paper: #fafaf7;
    --think-silver: #e3e4e3;
    --think-blue: #163bea;
    --think-on-blue: #fff;
    --think-blue-muted: #dbe3ff;
    --think-line: #202124;
    --think-display: "Helvetica Neue", Helvetica, Arial, sans-serif;
    --think-mono: ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace;
  }
  @media (prefers-color-scheme: dark) {
    html[data-theme="think"] {
      --fg: #f0f1ed;
      --bg: #141517;
      --muted: #b0b3bb;
      --border: #858a94;
      --focus: #a5bcff;
      --think-paper: #202225;
      --think-silver: #303338;
      --think-blue: #2547da;
      --think-line: #c2c5cb;
    }
  }
  html[data-theme="think"] body {
    max-width: none;
    margin: 0;
    padding: 0 0 2rem;
    font-family: var(--think-display);
    font-size: 1rem;
    line-height: 1.6;
    letter-spacing: -.015em;
  }
  html[data-theme="think"] header.site-header,
  html[data-theme="think"] main,
  html[data-theme="think"] footer.site-footer {
    width: min(calc(100% - 4rem), 1160px);
    margin-left: auto;
    margin-right: auto;
  }
  html[data-theme="think"] header.site-header {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 1.5rem;
    align-items: end;
    margin-top: 3rem;
    margin-bottom: 2rem;
  }
  html[data-theme="think"] .site-header-left { grid-column: 1; gap: 1rem; }
  html[data-theme="think"] .site-header-right { display: contents; }
  html[data-theme="think"] .site-identity { position: relative; padding-left: 1.6rem; gap: .65rem; }
  html[data-theme="think"] .site-identity::before {
    content: "";
    position: absolute;
    left: 0; top: .15rem; bottom: .15rem;
    width: .5rem;
    background: linear-gradient(to bottom, #38954c 0 16.66%, #eebf32 16.66% 33.33%, #e78027 33.33% 50%, #d33b45 50% 66.66%, #9665aa 66.66% 83.33%, #316add 83.33%);
  }
  html[data-theme="think"] header.site-header h1 {
    font-size: clamp(2.5rem, 5.8vw, 4.75rem);
    font-weight: 750;
    line-height: .95;
    letter-spacing: -.075em;
    overflow-wrap: anywhere;
    text-wrap: initial;
  }
  html[data-theme="think"] header.site-header h1 a { display: block; min-height: 44px; }
  html[data-theme="think"] .site-tagline {
    color: var(--muted);
    max-width: 42rem;
    font-size: 1rem;
    line-height: 1.45;
    letter-spacing: -.015em;
  }
  html[data-theme="think"] .header-links {
    grid-column: 2;
    justify-self: end;
    margin: 0;
    gap: .75rem;
    flex-wrap: wrap;
  }
  html[data-theme="think"] .rss-link,
  html[data-theme="think"] .link-btn-reset {
    min-height: 44px;
    font-family: var(--think-mono);
    font-size: .75rem;
    letter-spacing: -.025em;
  }
  html[data-theme="think"] .category-filter { display: none; }
  html[data-theme="think"] .think-navigation {
    grid-column: 1 / -1;
    display: flex;
    gap: 0;
    flex-wrap: wrap;
    padding: .25rem;
    border: 1px solid var(--border);
    border-radius: .5rem;
    background: linear-gradient(180deg, var(--think-paper), var(--think-silver));
    box-shadow: inset 0 1px 0 var(--think-paper), 0 2px 0 rgb(0 0 0 / .07);
  }
  html[data-theme="think"] .think-navigation a {
    display: flex;
    flex: 1 1 auto;
    justify-content: center;
    align-items: center;
    min-height: 44px;
    padding: .5rem .8rem;
    color: var(--fg);
    font-size: .875rem;
    font-weight: 600;
    line-height: 1.4;
    border-radius: .25rem;
  }
  html[data-theme="think"] .think-navigation a:hover { background: var(--think-paper); }
  html[data-theme="think"] .think-navigation a[aria-current="page"] {
    color: var(--think-on-blue);
    background: var(--think-blue);
    box-shadow: inset 0 1px 0 rgb(255 255 255 / .22), 0 1px 3px rgb(0 0 0 / .18);
  }
  html[data-theme="think"] .think-navigation a:focus-visible { outline-offset: -3px; }
  html[data-theme="think"] .think-navigation a[aria-current="page"]:focus-visible { outline-color: white; }
  html[data-theme="think"] main { min-height: 40vh; }
  html[data-theme="think"] .think-feed {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    align-items: stretch;
  }
  html[data-theme="think"] .think-entry {
    min-width: 0;
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border-top: 2px solid var(--think-line);
    background: var(--think-paper);
    overflow-wrap: anywhere;
  }
  html[data-theme="think"] .think-entry-label {
    margin: 0 0 1.75rem;
    font-family: var(--think-mono);
    font-size: .75rem;
    line-height: 1.5;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--muted);
  }
  html[data-theme="think"] .think-entry-content { min-width: 0; flex: 1; }
  html[data-theme="think"] .think-entry .card {
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  html[data-theme="think"] .think-entry h2 {
    font-size: clamp(1.5rem, 2.2vw, 2rem);
    line-height: 1.08;
    letter-spacing: -.055em;
    font-weight: 750;
    margin: 0 0 .85rem;
  }
  html[data-theme="think"] .think-entry h2 a { text-decoration: none; }
  html[data-theme="think"] .think-entry h2 a:hover { text-decoration: underline; }
  html[data-theme="think"] .think-entry p { margin-top: 0; }
  html[data-theme="think"] .think-entry .article-excerpt { color: var(--muted); font-size: 1rem; }
  html[data-theme="think"] .meta {
    font-family: var(--think-mono);
    font-size: .75rem;
    line-height: 1.6;
    color: var(--muted);
    letter-spacing: -.03em;
  }
  html[data-theme="think"] .think-entry .meta { margin: 1.1rem 0 0; }
  html[data-theme="think"] .think-entry-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 44px;
    margin-top: 1.5rem;
    border-top: 1px solid var(--border);
    padding-top: .5rem;
    font-size: .8125rem;
    font-weight: 600;
    color: var(--fg);
    text-decoration: none;
  }
  html[data-theme="think"] .think-entry-action span { font-size: 1.35rem; line-height: 1; }
  html[data-theme="think"] .think-entry-action:hover { color: var(--focus); }
  html[data-theme="think"] .think-entry:first-child {
    grid-column: 1 / -1;
    padding: clamp(1.5rem, 4vw, 3rem);
    border: 0;
    background: var(--think-blue);
    color: var(--think-on-blue);
    --fg: var(--think-on-blue);
    --muted: var(--think-blue-muted);
    --border: #7d98ff;
    --focus: #fff;
  }
  html[data-theme="think"] .think-entry:first-child .think-entry-label { margin-bottom: 2rem; }
  html[data-theme="think"] .think-entry:first-child h2 {
    max-width: 18ch;
    font-size: clamp(2.5rem, 5.5vw, 4.5rem);
    line-height: 1.02;
    letter-spacing: -.065em;
  }
  html[data-theme="think"] .think-entry:first-child .article-excerpt { max-width: 46ch; font-size: 1.125rem; }
  html[data-theme="think"] .think-entry:first-child .think-entry-action { max-width: 18rem; }
  html[data-theme="think"] .think-entry[data-type="article"]:first-child:has(.article-card-cover) .article-card {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
    gap: 0 2.5rem;
    align-items: start;
  }
  html[data-theme="think"] .think-entry[data-type="article"]:first-child .article-card-cover {
    grid-column: 2; grid-row: 1 / 4;
    margin: 0;
  }
  html[data-theme="think"] .think-entry[data-type="article"]:first-child .article-card > h2,
  html[data-theme="think"] .think-entry[data-type="article"]:first-child .article-card > p { grid-column: 1; }
  html[data-theme="think"] .card img { display: block; border-radius: 0; }
  html[data-theme="think"] .article-card-cover { margin: 0 0 1.25rem; }
  html[data-theme="think"] .article-card-cover img { aspect-ratio: 4 / 3; object-fit: cover; }
  html[data-theme="think"] .think-entry[data-type="photo"] .card > a { display: block; }
  html[data-theme="think"] .think-entry[data-type="photo"] .card img { width: 100%; height: auto; }
  html[data-theme="think"] .think-entry[data-type="photo"]:first-child .card img { max-height: 36rem; object-fit: contain; object-position: left; }
  html[data-theme="think"] .think-entry[data-type="photo"]:first-child .card {
    display: grid;
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
    gap: 0 2.5rem;
    align-items: start;
  }
  html[data-theme="think"] .think-entry[data-type="photo"]:first-child .card > a { grid-column: 1; grid-row: 1 / 3; }
  html[data-theme="think"] .think-entry[data-type="photo"]:first-child .card > p { grid-column: 2; font-size: clamp(1.5rem, 3.5vw, 3rem); line-height: 1.15; letter-spacing: -.05em; }
  html[data-theme="think"] .think-entry[data-type="photo"]:first-child .card > .meta { grid-column: 2; }
  html[data-theme="think"] .think-entry[data-type="photo"]:first-child .card:not(:has(> p)) { display: block; }
  html[data-theme="think"] .think-entry .book,
  html[data-theme="think"] .think-entry .music { display: block; }
  html[data-theme="think"] .think-entry .book > img,
  html[data-theme="think"] .think-entry .music > img.artwork {
    width: min(100%, 10rem);
    height: auto;
    margin: 0 0 1.5rem;
    object-fit: contain;
    border-radius: 0;
    box-shadow: 4px 5px 0 rgb(0 0 0 / .12);
  }
  html[data-theme="think"] .think-entry .book > img { width: min(100%, 7rem); }
  html[data-theme="think"] .think-entry:first-child .book,
  html[data-theme="think"] .think-entry:first-child .music { display: flex; align-items: center; gap: 3rem; }
  html[data-theme="think"] .think-entry:first-child .book > img,
  html[data-theme="think"] .think-entry:first-child .music > img.artwork {
    height: auto;
    width: min(30%, 14rem);
    margin: 0;
    flex-shrink: 0;
  }
  html[data-theme="think"] .think-entry .book > div,
  html[data-theme="think"] .think-entry .music > div { min-width: 0; }
  html[data-theme="think"] .quote-text { border: 0; padding: 0; margin: 0 0 1.5rem; }
  html[data-theme="think"] .quote-text p {
    font-family: Georgia, "Times New Roman", serif;
    font-style: italic;
    font-size: 1.75rem;
    letter-spacing: -.045em;
    line-height: 1.3;
  }
  html[data-theme="think"] .think-entry:first-child .quote-text p { max-width: 28ch; font-size: clamp(2rem, 4vw, 3.5rem); }
  html[data-theme="think"] .think-entry[data-type="thought"] .card > .body-content { font-size: 1.125rem; line-height: 1.6; }
  html[data-theme="think"] .think-entry[data-type="thought"]:first-child .card > .body-content { max-width: 46ch; font-size: clamp(1.5rem, 3vw, 2.25rem); line-height: 1.35; }
  html[data-theme="think"] .link-preview-image { width: 100%; margin: 0 0 1.25rem; border-radius: 0; }
  html[data-theme="think"] .link-topline { flex-wrap: wrap; }
  html[data-theme="think"] .link-topline .meta { margin: 0; }
  html[data-theme="think"] .think-entry .link-topline .meta { display: none; }
  html[data-theme="think"] .link-host { color: var(--muted); overflow-wrap: anywhere; white-space: normal; overflow: visible; }
  html[data-theme="think"] a { color: var(--focus); }
  html[data-theme="think"] a.title-link { color: inherit; }
  html[data-theme="think"] .content-action-button,
  html[data-theme="think"] .pagination a,
  html[data-theme="think"] .back-link {
    min-height: 44px;
    border: 1px solid var(--border);
    border-radius: .25rem;
    color: var(--fg);
    padding: .55rem .85rem;
    background: linear-gradient(var(--think-paper), var(--think-silver));
    font-size: .875rem;
    font-weight: 600;
    box-shadow: 0 1px 0 rgb(0 0 0 / .08);
  }
  html[data-theme="think"] .think-entry:first-child .content-action-button { background: transparent; }
  html[data-theme="think"] .back-link { margin: 0 0 1.5rem; }
  html[data-theme="think"] .copy-btn { min-width: 44px; min-height: 44px; justify-content: center; opacity: 1; }
  html[data-theme="think"] main > article,
  html[data-theme="think"] main > .about-page,
  html[data-theme="think"] main > .release-history,
  html[data-theme="think"] main > .archive-page,
  html[data-theme="think"] main > .search-page {
    max-width: 52rem;
    margin: 0 auto;
    padding: clamp(1.5rem, 4vw, 3rem);
    background: var(--think-paper);
    border-top: 2px solid var(--think-line);
    overflow-wrap: anywhere;
  }
  html[data-theme="think"] main > .card { border-bottom: 0; }
  html[data-theme="think"] .article-detail > h1,
  html[data-theme="think"] .about-page > h1,
  html[data-theme="think"] main > article > h1 {
    font-size: clamp(2.5rem, 5vw, 4.5rem);
    font-weight: 750;
    line-height: 1.02;
    letter-spacing: -.065em;
    margin: .75rem 0 1.5rem;
  }
  html[data-theme="think"] .article-detail > .article-excerpt { font-size: 1.25rem; line-height: 1.5; }
  html[data-theme="think"] .article-detail-cover { max-height: none; height: auto; object-fit: contain; border-radius: 0; }
  html[data-theme="think"] main > article .body-content,
  html[data-theme="think"] main > .about-page .body-content {
    max-width: 65ch;
    font-size: 1.125rem;
    line-height: 1.75;
    letter-spacing: -.01em;
  }
  html[data-theme="think"] main > .book,
  html[data-theme="think"] main > .music { gap: 2rem; }
  html[data-theme="think"] main > .book > div,
  html[data-theme="think"] main > .music > div { min-width: 0; }
  html[data-theme="think"] main > .book > img,
  html[data-theme="think"] main > .music > img.artwork { width: 9rem; max-width: 28%; height: auto; border-radius: 0; }
  html[data-theme="think"] footer.site-footer { margin-top: 4rem; }
  html[data-theme="think"] .site-footer-inner {
    padding: 1.5rem 0 0;
    border: 0;
    border-top: 2px solid var(--think-line);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
  }
  html[data-theme="think"] .site-profile-name { font-size: 1.5rem; letter-spacing: -.04em; }
  html[data-theme="think"] .site-footer-nav a { display: inline-flex; align-items: center; min-height: 44px; }
  html[data-theme="think"] .site-footer-nav { gap: .25rem 1.5rem; }
  html[data-theme="think"] .site-profile-location { font-family: var(--think-mono); }
  @media (max-width: 900px) {
    html[data-theme="think"] .think-feed { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    html[data-theme="think"] .think-entry[data-type="article"]:first-child:has(.article-card-cover) .article-card { gap: 0 1.5rem; }
    html[data-theme="think"] .header-links { grid-column: 1 / -1; justify-self: start; }
    html[data-theme="think"] header.site-header { gap: 1rem; }
  }
  @media (max-width: 640px) {
    html[data-theme="think"] header.site-header,
    html[data-theme="think"] main,
    html[data-theme="think"] footer.site-footer { width: calc(100% - 2rem); }
    html[data-theme="think"] header.site-header { margin-top: 1.5rem; margin-bottom: 1.5rem; grid-template-columns: minmax(0, 1fr); }
    html[data-theme="think"] .site-header-left { gap: 1.5rem; }
    html[data-theme="think"] .site-identity { padding-left: 1.25rem; }
    html[data-theme="think"] .header-links { gap: 1rem; }
    html[data-theme="think"] .think-navigation { display: none; }
    html[data-theme="think"] .category-filter { display: block; max-width: 100%; }
    html[data-theme="think"] .category-filter-trigger { border-radius: .25rem; color: var(--fg); background: linear-gradient(var(--think-paper), var(--think-silver)); white-space: normal; line-height: 1.4; }
    html[data-theme="think"] .category-filter-menu { min-width: min(12rem, calc(100vw - 2rem)); max-width: calc(100vw - 2rem); border-radius: .25rem; background: var(--think-paper); backdrop-filter: none; }
    html[data-theme="think"] .think-feed { grid-template-columns: minmax(0, 1fr); gap: 1rem; }
    html[data-theme="think"] .think-entry { padding: 1.5rem; }
    html[data-theme="think"] .think-entry:first-child { padding: 1.5rem; }
    html[data-theme="think"] .think-entry-label { margin-bottom: 1.25rem; }
    html[data-theme="think"] .think-entry[data-type="article"]:first-child:has(.article-card-cover) .article-card { display: block; }
    html[data-theme="think"] .think-entry[data-type="photo"]:first-child .card { display: block; }
    html[data-theme="think"] .think-entry[data-type="article"]:first-child .article-card-cover { margin: 0 0 1.5rem; }
    html[data-theme="think"] .think-entry:first-child .book,
    html[data-theme="think"] .think-entry:first-child .music { display: block; }
    html[data-theme="think"] .think-entry:first-child .book > img,
    html[data-theme="think"] .think-entry:first-child .music > img.artwork { width: min(100%, 10rem); height: auto; margin-bottom: 1.5rem; }
    html[data-theme="think"] .think-entry:first-child .book > img { width: min(100%, 7rem); }
    html[data-theme="think"] main > article,
    html[data-theme="think"] main > .about-page,
    html[data-theme="think"] main > .archive-page,
    html[data-theme="think"] main > .search-page { padding: 1.5rem; }
    html[data-theme="think"] main > .book,
    html[data-theme="think"] main > .music { display: block; }
    html[data-theme="think"] main > .book > img,
    html[data-theme="think"] main > .music > img.artwork { max-width: 100%; width: 8rem; margin-bottom: 1.5rem; }
  }
  @media (forced-colors: active) {
    html[data-theme="think"] .site-identity::before { background: Highlight; }
    html[data-theme="think"] .think-entry:first-child { border: 2px solid CanvasText; }
    html[data-theme="think"] .think-navigation a[aria-current="page"] { outline: 2px solid Highlight; }
  }
`;
