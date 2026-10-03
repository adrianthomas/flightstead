# Flightstead agent guide

This repository is the public, self-hosted Flightstead server and public-site
renderer. The application lives in `server/`; repository-root files cover
deployment, importing, and project-wide guidance.

## Agent roles and delegation

This guide applies equally to Codex and Claude Code. Both tools use the same
three roles; only the runtime wiring differs:

| Role | Codex | Claude Code |
|---|---|---|
| Lead / orchestrator | Sol (`gpt-6.1-sol`), `.codex/config.toml` | main session on Opus, `.claude/settings.json` |
| `explorer` (read-only) | Luna (`gpt-6-luna`), `.codex/agents/explorer.toml` | `.claude/agents/explorer.md` (Sonnet) |
| `worker` (bounded edits) | Luna (`gpt-6-luna`), `.codex/agents/worker.toml` | `.claude/agents/worker.md` (Sonnet) |

Keep the Codex and Claude Code role definitions in sync when changing either.

- The lead owns task scoping, architectural decisions, delegation,
  integration, final review, validation, and communication with the user.
- Delegate focused repository investigation to the `explorer` role.
  Explorers are read-only and report relevant paths, existing contracts,
  test coverage, and concrete recommendations.
- Delegate bounded implementation tasks to the `worker` role. Give each
  worker an explicit goal, owned files or area, acceptance criteria, and
  required checks. Workers may edit only their assigned scope and must
  preserve concurrent work.
- Use parallel agents when independent tasks justify the coordination cost.
  Keep small, tightly coupled changes with the lead. Never assign overlapping
  file ownership to concurrent workers; all agents share the checkout.
- Workers and explorers report back to the lead and do not delegate further.
  Escalate unclear requirements, cross-repository API decisions, or scope
  changes to the lead instead of guessing or expanding the task.
- The lead reviews every delegated change, resolves integration issues, and
  runs the relevant repository validation before handing the result to the
  user. A worker's report is evidence, not a substitute for review.

Explicit user model choices and runtime restrictions take precedence. If a
client does not expose named roles, pass the helper model explicitly when
spawning an exploration or implementation agent and include the corresponding
role instructions. Project configuration applies to trusted projects; an
existing chat or an explicit client model selection may retain its model.

## Start here

Before changing code:

1. Read this file and `server/ARCHITECTURE.md`.
2. Check `git status --short` and preserve unrelated or unfinished user work.
3. Read the implementation and tests for the area you are changing; the code
   is the source of truth when documentation and implementation disagree.
4. Consult the focused docs when relevant:
   - `README.md` — product overview and common commands.
   - `SELF_HOSTING.md` / `UBERSPACE.md` — production operation and deploys.
   - `WORDPRESS_IMPORT.md` — Markdown and WordPress archive imports.
   - `server/THEME_GUIDELINES.md` — required for theme, public layout,
     typography, navigation, animation, or other web design work.
   - `POTENTIAL_ROADMAP.md` — exploratory ideas only, not committed work.

Do not treat exploratory roadmap items as approved requirements. Do not put
secrets or machine-specific values from `deploy.env` or `server/.env` into
tracked files or command output.

## Repository map

- `server/src/app.ts` — Fastify construction and registration order.
- `server/src/routes/` — authenticated API and public-site routes.
- `server/src/db/schema.ts` and `server/src/db/migrations/` — Drizzle schema
  and ordered SQLite migrations.
- `server/src/render/` — server-rendered React, metadata, feeds, themes, and
  the in-memory page cache. There is no client bundler or hydration layer.
- `server/src/activitypub/` — Fedify adapter, actors, followers, and delivery.
- `server/src/storage/` and `server/src/image/` — asset persistence and image
  variants. Local storage works; the S3 driver remains a placeholder.
- `server/src/import/` — dry-run-by-default archive importer.
- `server/tests/*.test.ts` — Node unit tests.
- `server/tests/e2e/` — Playwright WebKit tests with an isolated database.
- `deploy.sh` — Uberspace deployment from a clean, already-pushed checkout.

## Local workflow

Develop, build, test, and deploy locally. GitHub is only a backup and the
public home of the self-hosted server source; do not add GitHub Actions or
other paid hosted build and deployment services.

Run application commands from `server/`:

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run dev
```

Useful validation commands:

```bash
npm test
npm run build
npm run test:e2e
```

There is no lint script. `npm run build` is the canonical TypeScript check.
Use the smallest relevant validation while iterating, then run both unit tests
and the build for ordinary server changes. Run Playwright for public rendering,
interactive theme, asset-lifecycle, or route behavior changes. Playwright uses
WebKit and its own throwaway SQLite database and upload directory; do not point
tests at development or production data. Visual and iOS Safari behavior can
still require manual browser/device verification.

When the schema changes, update `server/src/db/schema.ts`, generate a migration
with `npm run db:generate`, inspect the generated SQL, and exercise it with
`npm run db:migrate`. Never rewrite an already-shipped migration.

## Contracts to preserve

- One process is split by `Host`: `api.<BASE_DOMAIN>` serves `/api/v1`, while
  tenant subdomains or a configured canonical custom domain serve public pages.
  Keep public catch-all routes last.
- API errors use `{ "error": { "code": string, "message": string } }`.
- Older iOS clients decode content types as a closed enum. New types require an
  additive feature gate before they can appear in unfiltered API responses;
  follow the checklist in `server/ARCHITECTURE.md`.
- New site settings and API response fields must be additive where possible so
  older installed clients keep working.
- `render/site-url.ts` is the canonical-origin source for HTML metadata, feeds,
  sitemaps, and ActivityPub. Do not reconstruct public origins ad hoc.
- `render/render.ts` owns `PATH_PREFIX`; reuse it for content URLs.
- Object and site mutations must invalidate the public page cache.
- Uploaded asset references live in JSON metadata, not database foreign keys.
  Keep ownership checks and cleanup in sync when adding metadata fields that
  reference assets.
- Rendering must not introduce third-party runtime dependencies. Bundled fonts
  and generated assets are served locally; visitor-locale retailer selection is
  a client-only enhancement because public HTML is shared-cacheable.
- ActivityPub publishing is synchronous and imported historical content must
  not be re-federated. `federationEnabled` gates outbound delivery, not the
  actor, WebFinger, or inbox endpoints.
- Production must have `ALLOWED_SIGNUP_EMAILS`; never weaken that boot-time
  requirement. Treat URL fetching and imports as SSRF-sensitive code.

## Public rendering and feature flags

Read and apply `server/THEME_GUIDELINES.md` before designing or changing public
surfaces. It defines the design principles, interaction requirements, and
visual review process for every theme. Preserve each theme's character while
meeting the shared usability baseline.

All eight selectable themes (`classic`, `cards`, `washi`, `prism`, `ledger`,
`cabinet`, `stream`, `think`) share the accessibility baseline described in
`server/ARCHITECTURE.md`. A rendering change is not complete until the relevant
classic, cards-derived, and Cabinet paths have been considered. Keep hit areas,
keyboard focus, reduced motion, semantic links, dark mode, and responsive layout
intact.

`ENABLE_WORK_PAGE=true` exposes `/my-work` and `/contact`.
The owner-authored Legal Page setting exposes `/impressum` when it has content;
its separate title setting controls the heading and footer label. Clearing the
content returns the route to 404 and omits it from the footer and sitemap.
`ENABLE_WORK_PAGE` remains a server-level, deployment-wide flag. `/about` is
always routable but may have no long-form body.

## Commit, push, and release

This applies to every coding agent (Codex, Claude Code, or otherwise).

- After completing and verifying a task, commit and push without asking,
  unless the user explicitly opts out. Use small logical commits with brief
  imperative messages.
- Stage only the files or hunks you changed for the task; the checkout may hold
  unrelated or concurrent work. Inspect the staged diff before committing, and
  keep secrets and machine-specific values out of commits.
- Check the branch and upstream before pushing, then push the current branch.
  Never force-push, reset, or merge into the release branch just to trigger a
  release. Stop and report authentication, protected-branch, or conflict
  failures instead of bypassing them.
- If verification cannot run or fails because of an unrelated existing issue,
  say so before committing.
- Finish by reporting commit, push, and (for iOS apps) TestFlight status. Never
  describe an upload as processed or available without checking that state.

Remote: `origin`. Deploying (`deploy.sh`) is separate and still needs the
user to ask.

## Companion iOS repository

The private companion iOS app and share extension are in the local checkout:

`/Users/adrian/Library/Mobile Documents/com~apple~CloudDocs/Projects/shareblog-ios`

If work changes the app/server API contract, pairing or authentication, site
settings, content metadata, feature negotiation, or requires an iOS editor,
inspect that repository's `AGENTS.md`, `product-spec.md`, and
`ios/ARCHITECTURE.md` before implementing. Coordinate both repositories and
preserve compatibility with already-installed clients where possible. Merely
changing the public renderer does not require an iOS change.

Use command-line tooling for App Store Connect operations; do not use Safari
to manage App Store Connect.

## Keep the handoff current

Update `server/ARCHITECTURE.md` in the same change when routes, tables, render
pipelines, themes, storage, federation, or test strategy change. Update the
operator docs when commands, environment variables, prerequisites, migrations,
or deployment behavior change. Record speculative product ideas in
`POTENTIAL_ROADMAP.md`, clearly separated from implemented behavior.
