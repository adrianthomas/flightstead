# Flightstead

Flightstead is your own place to publish. This repository contains its
open-source, self-hosted server. It turns
thoughts, articles, photographs, links, books, music, and quotes shared from an
iPhone into a personal website on your own domain.

## [Visit the Flightstead website →](https://flightstead.com)

> [!IMPORTANT]
> **The Flightstead iOS app is required.** This repository provides the server
> and public website, without a browser-based publishing dashboard. The app
> connects directly to your server and provides the editor, settings, and share
> extension.

**App Store:** Coming soon. A download link will be added here when the app is
live.

## What you get

- **Your server and your domain.** Posts, media, identity, and backups stay on
  infrastructure you control.
- **An easy share flow.** Send something from the standard iOS share sheet,
  review it in Flightstead, and publish it without copying content between apps.
- **Cookie-free public pages.** Visitors do not need an account, and the site
  loads no analytics script or advertising tracker.
- **Privacy-aware analytics.** Optional page-view totals and broad referral
  categories are built in. Flightstead does not retain visitor IP addresses,
  user agents, session identifiers, full referrer URLs, or individual request
  logs for analytics.
- **Six selectable themes.** Choose from Basic, Cards, Washi, Prism, Ledger,
  and Cabinet, with light/dark and responsive layouts.
- **Useful publishing features out of the box.** Search, archives, RSS,
  sitemaps, social metadata, custom domains, and optional Fediverse publishing
  are included.
- **Simple, portable storage.** The server is one Node process backed by SQLite
  and local media files—no separate database server is required.

## Run your own server

Choose the guide that matches where you want to host it:

- **[Synology NAS](SYNOLOGY.md)** — a Container Manager project with persistent
  storage, automatic migrations, DSM HTTPS, and Hyper Backup guidance.
- **[Generic Linux server](SELF_HOSTING.md)** — Node.js, systemd, and a reverse
  proxy such as Caddy.
- **[Uberspace](UBERSPACE.md)** — a walkthrough tailored to Uberspace accounts.

You will need an always-on host, a domain you control, and the ability to point
DNS records at the server. SMTP is recommended for email sign-in after the
initial device pairing.

After installation, run the owner bootstrap command from your chosen guide. It
prints a short-lived QR code; scan that in Flightstead to connect the app to your
server and sign in. Once paired, publishing happens from the app or directly
from the iOS share sheet.

## Backups and updates

The SQLite database and uploaded media are the only irreplaceable server data.
Keep both together in the configured data directory and back that directory up
regularly. Each hosting guide includes the appropriate update and backup steps.
Database migrations are ordered and safe to apply during an upgrade; the
Synology container applies them automatically at startup.

## Import an existing blog

Flightstead can import a Markdown archive and its local images while preserving
historical dates and slugs. WordPress imports can also use the original WXR/XML
export to recover gallery attachments and legacy permalinks. Imports are dry
runs unless `--commit` is explicitly supplied.

See [WORDPRESS_IMPORT.md](WORDPRESS_IMPORT.md) for the complete export, review,
and import workflow.

## For contributors

The application lives in `server/`. For a local development environment:

```bash
cd server
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Local development serves the API at `api.localhost:3000` and public sites at
`<subdomain>.localhost:3000`. Useful checks are `npm test`, `npm run build`, and
`npm run test:e2e`. With Docker installed, run
`./scripts/test-synology-container.sh` from the repository root to build and
smoke-test the production container. The implementation and maintenance map is
in [server/ARCHITECTURE.md](server/ARCHITECTURE.md).

## License

Flightstead is a [Navigationstack.com](https://navigationstack.com) app. The
repository name, deployment service names and existing `X-Shareblog-*` headers
remain unchanged for compatibility with installed servers and iOS clients.

[MIT](LICENSE)
