const SETUP_URL = "https://flightstead.com/support#start";
const FAQ_URL = "https://flightstead.com/support#faq";

export function isPendingSiteHost(host: string | undefined, baseDomain: string | undefined): boolean {
  if (!host || !baseDomain) return false;
  const normalizedHost = host.toLowerCase().replace(/\.$/, "");
  const normalizedBase = baseDomain.toLowerCase().replace(/\.$/, "");
  if (normalizedHost === normalizedBase) return true;
  if (!normalizedHost.endsWith(`.${normalizedBase}`)) return false;
  const subdomain = normalizedHost.slice(0, -(normalizedBase.length + 1));
  return Boolean(subdomain && !subdomain.includes(".") && subdomain !== "api");
}

/**
 * Standalone holding page for a fresh installation that has not created its
 * first site yet. It deliberately has no tenant/theme dependencies: there is
 * no site row to supply them until onboarding finishes in the iOS app.
 */
export function renderPendingPage(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <meta name="theme-color" content="#e9f5f8">
  <title>Site setup in progress — Flightstead</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17333d;
      --muted: #58727b;
      --sky: #e9f5f8;
      --blue: #237f9b;
      --blue-dark: #17677f;
      --line: rgba(23, 51, 61, .14);
      --paper: rgba(255, 255, 255, .9);
    }
    * { box-sizing: border-box; }
    html { min-height: 100%; background: var(--sky); }
    body {
      min-height: 100vh;
      margin: 0;
      display: grid;
      place-items: center;
      padding: 2rem 1.25rem;
      color: var(--ink);
      background:
        radial-gradient(circle at 18% 18%, rgba(255,255,255,.95) 0 7rem, transparent 19rem),
        radial-gradient(circle at 82% 78%, rgba(117,190,208,.2), transparent 22rem),
        linear-gradient(145deg, #f6fbfc 0%, var(--sky) 54%, #dceff3 100%);
      font-family: ui-rounded, "SF Pro Rounded", "Avenir Next", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    main {
      width: min(100%, 43rem);
      padding: clamp(2rem, 6vw, 4rem);
      text-align: center;
      background: var(--paper);
      border: 1px solid rgba(255,255,255,.85);
      border-radius: 2rem;
      box-shadow: 0 1.5rem 4rem rgba(35, 87, 101, .14);
      backdrop-filter: blur(12px);
    }
    .mark {
      position: relative;
      width: 7.5rem;
      height: 7.5rem;
      margin: 0 auto 1.5rem;
      display: grid;
      place-items: center;
      color: var(--blue);
    }
    .mark::before {
      content: "";
      position: absolute;
      inset: .35rem;
      border: 1px dashed rgba(35,127,155,.38);
      border-radius: 50%;
      transform: rotate(-12deg) scaleY(.72);
    }
    .mark svg { width: 3.5rem; height: 3.5rem; transform: rotate(-7deg); }
    .eyebrow {
      margin: 0 0 .75rem;
      color: var(--blue-dark);
      font-size: .78rem;
      font-weight: 750;
      letter-spacing: .14em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 12em;
      margin: 0 auto 1rem;
      font-size: clamp(2rem, 6vw, 3.25rem);
      line-height: 1.05;
      letter-spacing: -.035em;
    }
    .status {
      max-width: 34rem;
      margin: 0 auto;
      color: var(--muted);
      font-size: clamp(1rem, 2.5vw, 1.15rem);
      line-height: 1.65;
    }
    .owner {
      margin-top: 2rem;
      padding-top: 1.75rem;
      border-top: 1px solid var(--line);
    }
    .owner strong { display: block; margin-bottom: .45rem; font-size: 1.05rem; }
    .owner p { margin: 0; color: var(--muted); line-height: 1.55; }
    .actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: .75rem;
      margin-top: 1.25rem;
    }
    .actions a {
      min-height: 2.75rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: .72rem 1.15rem;
      color: var(--blue-dark);
      border: 1px solid rgba(35,127,155,.28);
      border-radius: 999px;
      font-weight: 700;
      text-decoration: none;
    }
    .actions a:first-child { color: white; background: var(--blue); border-color: var(--blue); }
    .actions a:hover { transform: translateY(-1px); }
    .actions a:focus-visible { outline: 3px solid rgba(35,127,155,.32); outline-offset: 3px; }
    footer { margin-top: 1.65rem; color: var(--muted); font-size: .86rem; }
    footer a { color: inherit; text-underline-offset: .2em; }
    @media (prefers-reduced-motion: reduce) { .actions a:hover { transform: none; } }
  </style>
</head>
<body>
  <main>
    <div class="mark" aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7 35 57 13 39 54l-9-15-23-4Z"/>
        <path d="m30 39 27-26M30 39l-1 12 10 3"/>
      </svg>
    </div>
    <p class="eyebrow">Pre-flight</p>
    <h1>This new Flightstead site is being set up.</h1>
    <p class="status">The server is online. Its owner still needs to connect the Flightstead app and finish setup before the site is ready for visitors.</p>
    <section class="owner" aria-labelledby="owner-heading">
      <strong id="owner-heading">Own this site?</strong>
      <p>Follow the setup instructions for the next steps, or check the answers to common connection questions.</p>
      <div class="actions">
        <a href="${SETUP_URL}">Setup instructions</a>
        <a href="${FAQ_URL}">FAQs</a>
      </div>
    </section>
    <footer><a href="https://flightstead.com">Flightstead</a> — your own place to publish.</footer>
  </main>
</body>
</html>`;
}
