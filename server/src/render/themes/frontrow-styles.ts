// Front Row stylesheet. Tokens mirror the handoff's design/tokens.css; the
// stage is dark-only by design, so the shared --fg/--bg/--muted/--border/--focus
// contract is pinned to dark values and the base templates (About, Archive,
// search) inherit them.
export const frontrowStyles = `
  html[data-theme="frontrow"] {
    color-scheme: dark;
    --fg: #ffffff; --bg: #000000; --muted: #a8a8a8; --border: rgba(255, 255, 255, 0.22); --focus: #9cc4ff;

    --fr-stage: #000000;
    --fr-stage-glow: #202226;
    --fr-stage-mid: #0b0b0c;
    --fr-stage-bg: radial-gradient(ellipse 70% 45% at 50% 100%, var(--fr-stage-glow) 0%, var(--fr-stage-mid) 55%, var(--fr-stage) 100%);

    --fr-text: #ffffff;
    --fr-text-body: #dadada;
    --fr-text-secondary: #d0d0d0;
    --fr-text-muted: #a8a8a8;
    --fr-text-faint: #8c8c8c;
    --fr-focus: #9cc4ff;

    --fr-highlight: linear-gradient(180deg, #7a7d82 0%, #4a4d52 49%, #33363a 50%, #45484c 100%);
    --fr-highlight-border: rgba(255, 255, 255, 0.30);
    --fr-highlight-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 4px 14px rgba(0, 0, 0, 0.6);

    --fr-pill-bg: rgba(255, 255, 255, 0.06);
    --fr-pill-bg-over-image: rgba(0, 0, 0, 0.55);
    --fr-pill-border: rgba(255, 255, 255, 0.22);
    --fr-pill-text: #c8c8c8;

    --fr-panel-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.07) 0%, rgba(255, 255, 255, 0.03) 100%);
    --fr-panel-border: rgba(255, 255, 255, 0.10);

    --fr-tile-all:     linear-gradient(160deg, #d6d9de 0%, #7f858d 50%, #33373d 100%);
    --fr-tile-thought: linear-gradient(160deg, #d8ec7a 0%, #8fb81f 50%, #4d6a0b 100%);
    --fr-tile-article: linear-gradient(160deg, #c4aaff 0%, #774ddb 50%, #3f1f8f 100%);
    --fr-tile-link:    linear-gradient(160deg, #6fe0bd 0%, #1aa382 50%, #0b5e4a 100%);
    --fr-tile-book:    linear-gradient(160deg, #ffc46b 0%, #e5791f 50%, #9a400c 100%);
    --fr-tile-music:   linear-gradient(160deg, #6fb0ff 0%, #2a6fe0 50%, #0f3d96 100%);
    --fr-tile-photo:   linear-gradient(160deg, #ff9a8a 0%, #de4238 50%, #85160f 100%);
    --fr-tile-quote:   linear-gradient(160deg, #ff9ad5 0%, #d63f9a 50%, #7d1356 100%);
    --fr-gloss: linear-gradient(180deg, rgba(255, 255, 255, 0.55) 0%, rgba(255, 255, 255, 0.10) 100%);
    --fr-tile-shadow: 0 30px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 6px rgba(0, 0, 0, 0.35);
    --fr-star: #ffd27a;

    --fr-reflection-opacity: 0.4;

    --fr-font: "Lucida Grande", "Lucida Sans Unicode", "Helvetica Neue", Helvetica, sans-serif;
    --fr-hero: clamp(200px, 22vw, 280px);

    --fr-ease: cubic-bezier(0.25, 0.1, 0.25, 1);
    --fr-dur-highlight: 120ms;
    --fr-dur-hero: 260ms;
    --fr-dur-view: 380ms;
  }
  @media (prefers-reduced-motion: reduce) {
    html[data-theme="frontrow"] { --fr-dur-highlight: 0ms; --fr-dur-hero: 0ms; --fr-dur-view: 0ms; }
  }
  @media (max-width: 900px) {
    html[data-theme="frontrow"] { --fr-hero: 120px; }
  }

  /* ---------- Stage ---------- */
  body.theme-frontrow {
    max-width: none; margin: 0; padding: 0; min-height: 100vh; min-height: 100svh;
    display: flex; flex-direction: column; position: relative; isolation: isolate;
    background: var(--fr-stage); color: var(--fr-text);
    font-family: var(--fr-font); font-size: 1rem; line-height: 1.4; letter-spacing: 0;
  }
  body.theme-frontrow::before {
    content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; background: var(--fr-stage-bg);
  }
  body.theme-frontrow a { color: inherit; }
  body.theme-frontrow a:focus-visible,
  body.theme-frontrow button:focus-visible,
  body.theme-frontrow input:focus-visible,
  body.theme-frontrow summary:focus-visible { outline: 2px solid var(--fr-focus); outline-offset: 2px; }
  body.theme-frontrow .skip-link { background: #000; color: #fff; }
  .fr-sr { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

  .fr-top {
    display: flex; justify-content: space-between; align-items: center; gap: 16px;
    padding: 20px clamp(16px, 3.75vw, 48px) 0;
    font-size: 13px; letter-spacing: 3px; text-transform: uppercase; color: var(--fr-text-faint);
  }
  .fr-top a { color: inherit; text-decoration: none; display: inline-flex; align-items: center; min-height: 44px; }
  .fr-top a:hover, .fr-top a:focus-visible { color: var(--fr-text); }
  .fr-top span { text-align: right; overflow-wrap: anywhere; }

  main#main-content { flex: 1; display: grid; align-content: center; width: 100%; view-transition-name: fr-main; }

  /* ---------- Two-column layout (menu, list, media detail) ---------- */
  .fr-layout {
    width: 100%; max-width: 1280px; margin: 0 auto;
    padding: 16px clamp(24px, 7vw, 96px) 40px clamp(24px, 10vw, 128px);
    display: grid; grid-template-columns: var(--fr-hero) minmax(0, 1fr);
    column-gap: clamp(32px, 8.6vw, 110px); align-items: start;
  }
  .fr-hero-col { position: sticky; top: 16px; margin-top: var(--fr-hero-offset, 56px); }
  .fr-layout--menu { --fr-hero-offset: 40px; }
  .fr-layout--detail { --fr-hero-offset: 72px; }
  .fr-menu-nav { display: block; font-size: inherit; }
  .fr-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }

  /* Hero: a tile or cover with a mirrored, fading reflection. */
  .fr-hero { position: relative; width: var(--fr-hero); }
  .fr-hero-main { position: relative; width: 100%; height: var(--fr-hero); view-transition-name: fr-hero; }
  .fr-art { position: absolute; inset: 0; display: block; }
  .fr-art.is-enter { animation: fr-fade var(--fr-dur-hero) var(--fr-ease) both; }
  .fr-hero-reflect {
    position: relative; margin-top: 10px; height: calc(var(--fr-hero) * 0.55); overflow: hidden; pointer-events: none;
    opacity: var(--fr-reflection-opacity);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
            mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
    view-transition-name: fr-reflect;
  }
  .fr-hero-flip { position: relative; height: var(--fr-hero); transform: scaleY(-1); }
  /* Covers keep their own proportions and rest on the stage floor. */
  .fr-thumb {
    position: absolute; inset: 0; width: 100%; height: 100%; display: block;
    object-fit: contain; object-position: center bottom;
    filter: drop-shadow(0 22px 30px rgba(0, 0, 0, 0.7)) drop-shadow(0 0 0.5px rgba(255, 255, 255, 0.55));
  }
  .fr-hero-reflect .fr-thumb { filter: none; }

  /* ---------- Tiles ---------- */
  .fr-tile {
    --s: 36px; --r: 9px; --sw: 5.5; --icon: 61%;
    position: relative; display: inline-flex; align-items: center; justify-content: center; flex: none;
    width: var(--s); height: var(--s); border-radius: var(--r); overflow: hidden;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5), 0 2px 6px rgba(0, 0, 0, 0.5);
  }
  .fr-tile::before {
    content: ""; position: absolute; inset: 0 0 auto 0; height: 50%; background: var(--fr-gloss); opacity: 0.9;
    border-radius: var(--r) var(--r) calc(var(--s) * 0.55) calc(var(--s) * 0.55) / var(--r) var(--r) calc(var(--s) * 0.17) calc(var(--s) * 0.17);
  }
  .fr-tile svg { position: relative; width: var(--icon); height: var(--icon); color: #fff; stroke-width: var(--sw); filter: drop-shadow(0 1px 1.5px rgba(0, 0, 0, 0.35)); }
  .fr-tile--large { --s: 64px; --r: 16px; --sw: 5; --icon: 60%; }
  .fr-tile--hero { --s: var(--fr-hero); --r: calc(var(--s) * 0.2143); --sw: 4; --icon: 54%; position: absolute; inset: 0; box-shadow: none; }
  .fr-tile--hero::before { height: 53.5%; opacity: 1; border-radius: var(--r) var(--r) calc(var(--s) * 0.5714) calc(var(--s) * 0.5714) / var(--r) var(--r) calc(var(--s) * 0.157) calc(var(--s) * 0.157); }
  .fr-tile--hero svg { filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.35)); }
  .fr-hero-main .fr-tile--hero { box-shadow: var(--fr-tile-shadow); }
  .fr-tile[data-kind="all"], .fr-swatch[data-kind="all"] { background: var(--fr-tile-all); }
  .fr-tile[data-kind="thought"], .fr-swatch[data-kind="thought"] { background: var(--fr-tile-thought); }
  .fr-tile[data-kind="article"], .fr-swatch[data-kind="article"] { background: var(--fr-tile-article); }
  .fr-tile[data-kind="link"], .fr-swatch[data-kind="link"] { background: var(--fr-tile-link); }
  .fr-tile[data-kind="book"], .fr-swatch[data-kind="book"] { background: var(--fr-tile-book); }
  .fr-tile[data-kind="music"], .fr-swatch[data-kind="music"] { background: var(--fr-tile-music); }
  .fr-tile[data-kind="photo"], .fr-swatch[data-kind="photo"] { background: var(--fr-tile-photo); }
  .fr-tile[data-kind="quote"], .fr-swatch[data-kind="quote"] { background: var(--fr-tile-quote); }

  /* ---------- Headings ---------- */
  .fr-display { margin: 0; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.1; font-weight: 400; letter-spacing: -0.5px; text-shadow: 0 2px 12px rgba(0, 0, 0, 0.8); overflow-wrap: anywhere; text-wrap: balance; }
  .fr-tagline { margin: -10px 0 0; font-size: 16px; line-height: 1.4; color: var(--fr-text-muted); max-width: 34rem; }
  .fr-head { display: flex; flex-direction: column; align-items: flex-start; gap: 14px; }
  .fr-empty { margin: 8px 0; color: var(--fr-text-muted); font-size: 18px; }

  /* ---------- Rows (menu + list) ---------- */
  .fr-rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .fr-row {
    position: relative; display: flex; align-items: center; gap: 16px; width: 100%;
    border-radius: 12px; border: 1px solid transparent; color: var(--fr-text); text-decoration: none;
    scroll-margin-block: 96px; -webkit-tap-highlight-color: transparent;
  }
  .fr-row::before {
    content: ""; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none;
    background: var(--fr-highlight); border: 1px solid var(--fr-highlight-border); box-shadow: var(--fr-highlight-shadow);
    opacity: 0; transition: opacity var(--fr-dur-highlight) var(--fr-ease);
  }
  .fr-row > * { position: relative; }
  .fr-row[data-hl="true"]::before, .fr-row:focus-visible::before { opacity: 1; }
  /* Without script the first row is highlighted; keyboard focus then takes over. */
  .fr-rows:has(.fr-row:focus-visible) .fr-row[data-hl="true"]:not(:focus-visible)::before { opacity: 0; }
  .fr-row:focus-visible { outline: 2px solid var(--fr-focus); outline-offset: 2px; }

  .fr-row--menu { min-height: 58px; padding: 4px 16px 4px 24px; font-size: 27px; }
  .fr-row-label { flex: 1; min-width: 0; overflow-wrap: anywhere; }
  .fr-chevron { width: 18px; height: 28px; display: inline-flex; align-items: center; justify-content: center; flex: none; visibility: hidden; }
  .fr-row[data-hl="true"] .fr-chevron, .fr-row:focus-visible .fr-chevron { visibility: visible; }
  .fr-rows:has(.fr-row:focus-visible) .fr-row[data-hl="true"]:not(:focus-visible) .fr-chevron { visibility: hidden; }

  .fr-row--post { min-height: 62px; padding: 8px 14px 8px 24px; gap: 18px; }
  .fr-row-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .fr-row-title { font-size: 22px; line-height: 1.25; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fr-row-meta { font-size: 14px; line-height: 1.3; color: var(--fr-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .fr-row-meta-date, .fr-row-sep { display: none; }
  .fr-row-date { font-size: 15px; color: var(--fr-text-muted); flex: none; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .fr-row[data-hl="true"] .fr-row-meta, .fr-row[data-hl="true"] .fr-row-date,
  .fr-row:focus-visible .fr-row-meta, .fr-row:focus-visible .fr-row-date { color: #e4e4e4; }
  .fr-rows:has(.fr-row:focus-visible) .fr-row[data-hl="true"]:not(:focus-visible) .fr-row-meta,
  .fr-rows:has(.fr-row:focus-visible) .fr-row[data-hl="true"]:not(:focus-visible) .fr-row-date { color: var(--fr-text-muted); }

  .fr-row--more { min-height: 52px; padding: 4px 16px 4px 24px; font-size: 20px; color: var(--fr-text-secondary); }
  .fr-row--more svg { flex: none; }

  /* ---------- Pills ---------- */
  .fr-pill {
    min-height: 44px; padding: 0 16px 0 10px; display: inline-flex; align-items: center; gap: 8px;
    border-radius: 22px; border: 1px solid var(--fr-pill-border); background: var(--fr-pill-bg);
    color: var(--fr-pill-text); font: inherit; font-size: 15px; line-height: 1.2; text-decoration: none;
  }
  a.fr-pill:hover, a.fr-pill:focus-visible { color: #fff; border-color: rgba(255, 255, 255, 0.45); background: rgba(255, 255, 255, 0.12); }
  .fr-pill--round { width: 44px; padding: 0; justify-content: center; }
  .fr-pill.is-off { opacity: 0.35; }
  .fr-detail-nav { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .fr-pager { display: flex; align-items: center; gap: 6px; color: var(--fr-text-faint); font-size: 14px; }
  .fr-pager-count { min-width: 64px; text-align: center; font-variant-numeric: tabular-nums; }

  /* ---------- Media detail ---------- */
  .fr-article { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
  .fr-eyebrow { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 13px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--fr-text-muted); }
  .fr-swatch { width: 12px; height: 12px; border-radius: 3px; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5); }
  .fr-detail-title { margin: 0; font-size: clamp(28px, 3.2vw, 40px); line-height: 1.12; font-weight: 400; letter-spacing: -0.4px; overflow-wrap: anywhere; text-wrap: balance; }
  .fr-byline { display: flex; align-items: center; gap: 6px 16px; flex-wrap: wrap; }
  .fr-byline-name { font-size: 22px; line-height: 1.3; color: var(--fr-text-secondary); overflow-wrap: anywhere; }
  .fr-stars { font-size: 20px; letter-spacing: 3px; color: var(--fr-star); }
  .fr-date { font-size: 15px; color: var(--fr-text-muted); display: inline-flex; align-items: center; flex-wrap: wrap; gap: 0 4px; }
  body.theme-frontrow .copy-btn { min-width: 44px; min-height: 44px; justify-content: center; margin: 0; color: var(--fr-text-muted); opacity: 1; }
  body.theme-frontrow .copy-btn:hover, body.theme-frontrow .copy-btn:focus-visible { color: #fff; }
  .fr-body {
    padding: 18px 22px; border-radius: 14px; background: var(--fr-panel-bg); border: 1px solid var(--fr-panel-border);
    font-size: 17px; line-height: 1.6; color: var(--fr-text-body);
  }
  .fr-body > :last-child { margin-bottom: 0; }
  .fr-lead { margin: 0 0 12px; font-size: 18px; line-height: 1.5; color: var(--fr-text-secondary); font-style: italic; }
  .fr-body .body-content { max-width: 68ch; color: inherit; }
  .fr-body .body-content p, .fr-body .body-content ul, .fr-body .body-content ol { margin: 0 0 1rem; }
  .fr-body .body-content > :last-child { margin-bottom: 0; }
  .fr-body .body-content h1, .fr-body .body-content h2, .fr-body .body-content h3,
  .fr-body .body-content h4, .fr-body .body-content h5, .fr-body .body-content h6 {
    margin: 1.6rem 0 0.6rem; font-size: 15px; line-height: 1.3; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--fr-text);
  }
  .fr-body .body-content > :first-child { margin-top: 0; }
  .fr-body .body-content a { color: var(--fr-focus); text-decoration: underline; text-underline-offset: 0.18em; overflow-wrap: anywhere; }
  .fr-body .body-content a:hover { color: #fff; }
  .fr-body .body-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 0.5rem 0 1rem; }
  .fr-body .body-content blockquote { margin: 1.2rem 0; padding-left: 1rem; border-left: 3px solid var(--fr-pill-border); color: var(--fr-text-secondary); }
  .fr-body .body-content pre { overflow-x: auto; padding: 1rem; border-radius: 8px; background: rgba(0, 0, 0, 0.45); border: 1px solid var(--fr-panel-border); }
  .fr-body .body-content hr { border: 0; border-top: 1px solid var(--fr-panel-border); margin: 1.6rem 0; }
  .fr-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; padding-top: 2px; }
  .fr-btn {
    min-height: 48px; padding: 0 22px; display: inline-flex; align-items: center; gap: 10px;
    border-radius: 24px; font-size: 17px; line-height: 1.2; text-decoration: none;
    border: 1px solid var(--fr-pill-border); background: var(--fr-pill-bg); color: var(--fr-pill-text);
  }
  a.fr-btn:hover { color: #fff; border-color: rgba(255, 255, 255, 0.45); }
  .fr-btn--primary { background: var(--fr-highlight); border-color: var(--fr-highlight-border); box-shadow: var(--fr-highlight-shadow); color: #fff; }
  .fr-btn svg { flex: none; }
  .fr-apple-badge { display: inline-flex; align-items: center; min-height: 44px; padding: 2px; border-radius: 6px; }
  .fr-apple-badge img { display: block; width: 135px; height: auto; }
  .fr-credit { flex-basis: 100%; margin: 0; font-size: 11px; line-height: 1.4; color: var(--fr-text-faint); }

  /* ---------- Photo detail ---------- */
  .fr-photo-stage {
    width: 100%; max-width: 1280px; margin: 0 auto; padding: 8px clamp(16px, 3.75vw, 48px) 28px;
    display: flex; flex-direction: column; gap: 22px; overflow-x: clip;
  }
  .fr-photo-fig { display: flex; justify-content: center; padding-top: 8px; }
  .fr-photo-box { position: relative; width: fit-content; max-width: 100%; }
  .fr-photo {
    display: block; width: auto; height: auto; max-width: 100%; max-height: min(540px, calc(100svh - 260px));
    min-height: 120px; border-radius: 4px; box-shadow: 0 30px 70px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.12);
  }
  .fr-photo-reflect {
    position: absolute; left: 0; top: calc(100% + 6px); width: 100%; height: 32%; overflow: hidden; pointer-events: none;
    opacity: 0.35;
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
            mask-image: linear-gradient(to bottom, #000 0%, transparent 100%);
  }
  .fr-photo--reflection { position: relative; width: 100%; height: auto; max-height: none; transform: scaleY(-1); box-shadow: none; }
  .fr-photo-empty { padding: 60px 0; }
  .fr-photo-bar { position: relative; z-index: 1; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px 24px; flex-wrap: wrap; }
  .fr-photo-caption { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; min-width: 0; flex: 1 1 18rem; }
  .fr-photo-caption .fr-pill { background: var(--fr-pill-bg-over-image); }
  .fr-photo-caption h1 { margin: 0; font-size: clamp(22px, 2.4vw, 28px); line-height: 1.2; font-weight: 400; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9); overflow-wrap: anywhere; text-wrap: balance; }
  .fr-photo-caption .fr-date { color: var(--fr-text-secondary); text-shadow: 0 1px 6px rgba(0, 0, 0, 0.9); }

  /* ---------- Quote detail ---------- */
  .fr-quote-stage {
    width: 100%; max-width: 1040px; margin: 0 auto; padding: 24px clamp(16px, 8vw, 160px) 40px;
    display: flex; flex-direction: column; align-items: flex-start; gap: 26px;
  }
  .fr-quote { margin: 0; font-size: clamp(26px, 3.4vw, 42px); line-height: 1.35; text-shadow: 0 2px 16px rgba(0, 0, 0, 0.8); overflow-wrap: anywhere; text-wrap: pretty; }
  .fr-quote p { margin: 0; }
  .fr-quote--long { font-size: clamp(21px, 2.4vw, 30px); }
  .fr-quote-by { margin: 0; display: flex; align-items: center; flex-wrap: wrap; gap: 4px 16px; }
  .fr-quote-stage .fr-body { align-self: stretch; }
  .fr-quote-bar { align-self: stretch; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-top: 12px; }

  /* ---------- Generic pages (About, Archive, Search, Legal …) ---------- */
  .fr-page { width: 100%; max-width: 780px; margin: 0 auto; padding: 16px clamp(16px, 4vw, 32px) 40px; display: flex; flex-direction: column; align-items: flex-start; gap: 24px; }
  .fr-page-body { width: 100%; color: var(--fr-text-body); font-size: 17px; line-height: 1.6; }
  .fr-page-body h1 { margin: 0 0 20px; font-size: clamp(32px, 3.6vw, 46px); line-height: 1.1; font-weight: 400; letter-spacing: -0.5px; color: var(--fr-text); }
  .fr-page-body h2, .fr-page-body h3 { color: var(--fr-text); font-weight: 600; letter-spacing: 0; }
  .fr-page-body a { color: var(--fr-focus); text-underline-offset: 0.18em; }
  .fr-page-body .site-footer-profile { margin-top: 32px; }
  .fr-page-body .search-form { margin: 0 0 24px; }
  .fr-page-body .search-form input { min-height: 48px; padding: 0 18px; border-radius: 24px; border: 1px solid var(--fr-pill-border); background: var(--fr-pill-bg); color: var(--fr-text); }
  .fr-page-body .search-form input::placeholder { color: var(--fr-text-muted); }
  .fr-page-body .search-form button { min-height: 48px; padding: 0 22px; border-radius: 24px; border: 1px solid var(--fr-highlight-border); background: var(--fr-highlight); color: #fff; box-shadow: var(--fr-highlight-shadow); }
  .fr-main .search-form { display: flex; gap: 8px; margin: 0; }
  .fr-main .search-form input { min-width: 0; flex: 1; min-height: 48px; padding: 0 18px; border-radius: 24px; border: 1px solid var(--fr-pill-border); background: var(--fr-pill-bg); color: var(--fr-text); font-size: 17px; }
  .fr-main .search-form input::placeholder { color: var(--fr-text-muted); }
  .fr-main .search-form button { min-height: 48px; padding: 0 22px; border-radius: 24px; border: 1px solid var(--fr-highlight-border); background: var(--fr-highlight); color: #fff; box-shadow: var(--fr-highlight-shadow); font-size: 17px; cursor: pointer; }
  .fr-page-body .archive-months a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 16px; border-radius: 22px; border: 1px solid var(--fr-pill-border); background: var(--fr-pill-bg); color: var(--fr-pill-text); text-decoration: none; }
  .fr-page-body .archive-months a:hover { color: #fff; }
  .fr-page-body .archive-list h2 { font-size: 22px; }
  .fr-page-body .content-action-button { min-height: 48px; padding: 0 22px; display: inline-flex; align-items: center; gap: 10px; border-radius: 24px; border: 1px solid var(--fr-pill-border); background: var(--fr-pill-bg); color: var(--fr-pill-text); text-decoration: none; }
  .fr-page-body .meta { color: var(--fr-text-muted); }

  /* ---------- Footer ---------- */
  .fr-foot {
    display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0 32px;
    max-width: 1280px; width: 100%; margin: 0 auto; padding: 8px clamp(16px, 3.75vw, 48px) 20px;
    font-size: 14px; color: var(--fr-text-muted);
  }
  .fr-foot nav { display: flex; flex-wrap: wrap; gap: 0 4px; font-size: inherit; }
  .fr-foot p { margin: 0; display: flex; flex-wrap: wrap; gap: 0 4px; }
  .fr-foot a, .fr-foot .rss-link, .fr-foot button {
    display: inline-flex; align-items: center; min-height: 44px; padding: 0 10px; color: var(--fr-text-muted); font-size: 14px;
    text-decoration: none; background: none; border: 0; font-family: inherit; cursor: pointer; position: relative;
  }
  .fr-foot a:hover, .fr-foot button:hover, .fr-foot a:focus-visible, .fr-foot button:focus-visible { color: #fff; text-decoration: underline; text-underline-offset: 0.2em; }
  .fr-foot .copy-feedback { position: absolute; bottom: 100%; right: 0; top: auto; margin: 0 0 0.2rem; max-width: none; white-space: nowrap; pointer-events: none; color: #fff; }

  /* ---------- Motion ---------- */
  @view-transition { navigation: auto; }
  ::view-transition-group(fr-main) { animation: none; }
  ::view-transition-old(fr-main) { animation: fr-vt-out calc(var(--fr-dur-view) * 0.45) var(--fr-ease) both; }
  ::view-transition-new(fr-main) { animation: fr-vt-in var(--fr-dur-view) var(--fr-ease) both; }
  html:active-view-transition-type(fr-back)::view-transition-new(fr-main) { animation-name: fr-vt-in-back; }
  @keyframes fr-vt-out { to { opacity: 0; } }
  @keyframes fr-vt-in { from { opacity: 0; transform: translateX(40px); } }
  @keyframes fr-vt-in-back { from { opacity: 0; transform: translateX(-40px); } }
  @keyframes fr-fade { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    @view-transition { navigation: none; }
    .fr-art.is-enter { animation: none; }
  }

  /* ---------- Narrow screens: the hero shrinks above the content ---------- */
  @media (max-width: 900px) {
    .fr-top { padding-top: 8px; font-size: 11px; letter-spacing: 2px; }
    .fr-top span { display: none; }
    .fr-layout { grid-template-columns: minmax(0, 1fr); padding: 8px 16px 32px; row-gap: 20px; }
    .fr-hero-col { position: static; margin: 0; justify-self: center; }
    .fr-hero-reflect { display: none; }
    .fr-hero-main { height: var(--fr-hero); }
    .fr-tile--hero { --r: 26px; }
    .fr-tile--hero::before { border-radius: 26px 26px 80px 80px / 26px 26px 20px 20px; }
    .fr-row--menu { min-height: 52px; font-size: 22px; padding-left: 16px; }
    .fr-row--post { min-height: 58px; padding: 8px 10px 8px 16px; gap: 12px; }
    .fr-row-title { font-size: 18px; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .fr-row-date { display: none; }
    .fr-row-meta-date, .fr-row-sep { display: inline; }
    .fr-byline-name { font-size: 19px; }
    .fr-body { padding: 16px 18px; }
    .fr-photo-stage { padding-top: 4px; }
    .fr-photo { max-height: 60vh; }
    .fr-quote-stage { padding-top: 12px; }
    .fr-foot { padding-bottom: 12px; }
  }
  @media (max-width: 480px) {
    .fr-pager-count { min-width: 56px; }
    .fr-row--menu { font-size: 20px; }
  }

  @media (forced-colors: active) {
    .fr-row[data-hl="true"], .fr-row:focus-visible { border-color: Highlight; }
    .fr-tile, .fr-pill, .fr-btn, .fr-body { border: 1px solid CanvasText; }
  }
`;
