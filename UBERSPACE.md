# Running Flightstead on Uberspace

Uberspace-specific walkthrough for [SELF_HOSTING.md](SELF_HOSTING.md): shared
hosting, no root/sudo, no systemd, no Docker. The database is a single
SQLite file in your account's own storage — nothing to provision. You also
get `supervisord` instead of systemd, and `uberspace web
domain`/`uberspace web backend` instead of your own reverse proxy —
Uberspace terminates TLS for you automatically via Let's Encrypt.

Every command below runs as your normal Uberspace user over SSH — nothing
needs `sudo`, and nothing here will work if you try to use it.

## 0. Prerequisites

- An Uberspace 7 account (SSH access is included from signup).
- A domain you control, OR just use the free `<username>.uber.space` domain
  Uberspace gives every account to get started — either way, every
  subdomain you use still has to be added individually (see the wildcard
  note at the end).

## 1. Get the code onto your account

```bash
ssh <username>@<host>.uberspace.de
git clone <your-fork-or-this-repo> flightstead
cd flightstead/server
```

## 2. Pick a Node.js version and install

```bash
uberspace tools version list node
uberspace tools version use node 22
```

Uberspace 7 tops out at Node 22 (its GCC is too old to build anything
newer) — that's exactly what Flightstead targets, so nothing to reconcile.

```bash
npm install
npm run build
```

`sharp` (image processing) has native bindings but ships prebuilt Linux x64
binaries, so this should just work with a plain `npm install` — as with any
host, always run it on the box itself, never copy over a `node_modules`
built elsewhere.

## 3. Configure the environment

```bash
cp .env.example .env
```

Fill in:

```
NODE_ENV=production
BASE_DOMAIN=yourdomain.com
API_BASE_URL=https://api.yourdomain.com
SMTP_HOST=<your account's hostname, e.g. stardust.uberspace.de — see below>
SMTP_PORT=587
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=<password you set in the mailbox step below>
SMTP_FROM=Flightstead <noreply@yourdomain.com>
ALLOWED_SIGNUP_EMAILS=you@yourdomain.com
```

**Don't skip `NODE_ENV=production`.** It's what actually switches auth
codes from console-logged (dev only, never emailed) to sent via `SMTP_*`,
and it's what the `ALLOWED_SIGNUP_EMAILS` requirement below is gated on —
leave it as `development` and both protections silently don't apply.

**`ALLOWED_SIGNUP_EMAILS` is required for an email-enabled production
instance** — the server refuses to boot without it (`server.ts`). Set it to whichever address(es) should be
able to sign in at all; without it, anyone who finds your API could request
a code, verify it, and create their own account and site on your account.
Everyone else's request still returns success either way, so it can't be
used to probe which addresses are allowlisted (see
[server/src/auth/magic-code.ts](server/src/auth/magic-code.ts)).

`PORT` just needs to be free and in Uberspace's allowed range (1024–65535);
the webserver in front of it is what's actually reachable from the
internet. `SMTP_HOST` is your account's own Uberspace host name (e.g.
`stardust.uberspace.de`, shown by `hostname` over SSH) — not `localhost`,
or TLS cert validation fails.

Uberspace's SMTP needs a real mailbox to authenticate as; create one before
using email sign-in. Production auth codes are only emailed and never
console-logged, so a missing SMTP configuration makes an email request fail
instead of leaking its code into the logs:

```bash
uberspace mail user add noreply
```

That prompts for a password — use it as `SMTP_PASS`, and use the resulting
address (`noreply@yourdomain.com` once that domain is added via
`uberspace mail domain add yourdomain.com`, or just
`noreply@<username>.uber.space` if you'd rather skip that step) as both
`SMTP_USER` and the address in `SMTP_FROM`.

`DATABASE_URL` is just a path in your account's own storage — SQLite
creates the file automatically on first migration, no role/database to
provision. Keeping it under `data/` next to `LOCAL_STORAGE_DIR` means a
full backup is just `supervisorctl stop flightstead && cp -r data/ backup/`.

## 4. Run migrations

```bash
npm run db:migrate
```

## 5. Create the owner account

```bash
npm run bootstrap-owner
```

Mints the single owner account directly in the database over this same SSH
session — no working mailbox needed just to get signed in the first time.
Run interactively like this, it also prints a QR code (plus a manual-entry
fallback code) that the iOS app's **Scan to Connect** button reads
directly: one scan sets the server address and signs in, no email step at
all. The code expires in 20 minutes and is single-use — just re-run this
command whenever you want to pair another device. (Run non-interactively —
[deploy.sh](deploy.sh) calls this on every deploy — it skips the code/QR
and only handles the idempotent "create the owner if none exists yet"
part, so automated deploys don't spam unused codes.)

If you'd rather not scan, day-to-day sign-in can still go through the email
code flow instead, which is why step 3's `ALLOWED_SIGNUP_EMAILS` matters:
set it to the same address you bootstrap with.

## 6. Keep the server running — supervisord, not systemd

Uberspace has no systemd or sudo; long-running processes are supervised by
`supervisord` instead, via one `.ini` file per service in
`~/etc/services.d/`. Flightstead already loads `.env` itself on boot (see
`import "dotenv/config"` in `server.ts`), so the service file doesn't need
to pass environment variables through — it just needs the right working
directory.

Find the node binary Uberspace set up in step 2 first:

```bash
which node
```

Then create `~/etc/services.d/flightstead.ini`:

```ini
[program:flightstead]
command=/home/<username>/bin/node dist/server.js
directory=/home/<username>/flightstead/server
autostart=true
autorestart=true
startsecs=5
stdout_logfile=/home/<username>/logs/flightstead.log
stderr_logfile=/home/<username>/logs/flightstead-error.log
```

(swap the `command=` path for whatever `which node` actually printed if
it differs)

```bash
supervisorctl reread
supervisorctl update
supervisorctl status flightstead
```

## 7. Domains and routing

One Flightstead process serves everything, split by the `Host` header (see
[tenant.ts](server/src/middleware/tenant.ts)): the apex/API host, plus one
hostname per site you create. Each one needs both a domain added and a
backend pointed at the app's port:

```bash
uberspace web domain add yourdomain.com
uberspace web domain add api.yourdomain.com
uberspace web backend set yourdomain.com --http --port 3000
uberspace web backend set api.yourdomain.com --http --port 3000
```

`uberspace web domain add` prints the exact DNS records (A/AAAA) to create
at your registrar for that hostname — use whatever it prints rather than a
copied value, since it's specific to the cluster your account lives on.
Uberspace requests the Let's Encrypt cert automatically once the DNS record
resolves; no Caddy/certbot config to write yourself.

Repeat both commands for every site subdomain you create afterwards:

```bash
uberspace web domain add myfirstsite.yourdomain.com
uberspace web backend set myfirstsite.yourdomain.com --http --port 3000
```

## 8. Point the iOS app at your server

Easiest path: tap **Scan to Connect** on the app's first screen and scan
the QR code step 5 printed (or re-run `npm run bootstrap-owner` if it's
already expired) — this sets the server address and signs you in together.

Otherwise, same as any other host — see step 7 in
[SELF_HOSTING.md](SELF_HOSTING.md): enter `yourdomain.com` (no scheme
needed), and it assumes the `api.<domain>` convention set up above. Sign-in
codes go to whichever address(es) you put in `ALLOWED_SIGNUP_EMAILS`.

## Dedicated App Store Review instance on the same Uberspace account

Do not put a durable review credential on the instance that contains your own
site. Run a second Flightstead process in a separate checkout, on a separate
port, SQLite database, uploads directory, and hostname. It can use the
same Uberspace account without sharing application data.

The single-host example below uses:

- API and public review site: `review.yourdomain.com`
- process name: `flightstead-review`
- port: `3100`
- checkout: `/home/<username>/flightstead-review`

Choose another unused port if `3100` is already present in
`uberspace web backend list`.

### 1. Install an isolated checkout

```bash
cd ~
git clone <your-fork-or-this-repo> flightstead-review
cd flightstead-review/server
```

On a second checkout in the same memory-constrained Uberspace account, prefer
reusing the production checkout's already-installed dependency tree. A fresh
`npm install` was observed to be OOM-killed. First confirm both checkouts have
the same `package-lock.json`, then:

```bash
ln -s /home/<username>/flightstead/server/node_modules node_modules
npm run build
```

Do not copy the production `.env`, `data/`, or `dist/`; only the dependency
tree is shared. Re-run the review build after a production dependency update.
On a host with enough memory, or where no matching production dependency tree
exists, use `npm install && npm run build` instead.

Only application source belongs in Git. Never add the review `.env`, database,
uploads, generated access code, or App Store Connect notes to the repository.
The repository ignores `.env` and `server/data/`, but the restrictive file
permissions below are still required.

### 2. Generate the durable credential

```bash
npm run app-review:credential
```

This prints two different values:

- **Access code** — save this once in your password manager and later in App
  Store Connect. Do not put it in `.env` or source control.
- **`APP_REVIEW_ACCESS_CODE_HASH=...`** — put this hash in `.env`. The original
  code cannot be recovered from it.

### 3. Create the private review configuration

```bash
umask 077
cp .env.example .env
chmod 600 .env
nano .env
```

Use the following values, substituting your real domain, a dedicated display
email, and the generated hash:

```dotenv
NODE_ENV=production
PORT=3100
BASE_DOMAIN=yourdomain.com
API_BASE_URL=https://review.yourdomain.com

DATABASE_URL=./data/review.db
STORAGE_DRIVER=local
LOCAL_STORAGE_DIR=./data/review-uploads

ENABLE_WORK_PAGE=false
DISABLE_EMAIL_AUTH=true

APP_REVIEW_EMAIL=app-review@yourdomain.com
APP_REVIEW_ACCESS_CODE_HASH=<generated-64-character-hash>
APP_REVIEW_SITE_SUBDOMAIN=review
APP_REVIEW_SITE_TITLE=Flightstead App Review
```

`DISABLE_EMAIL_AUTH=true` deliberately removes the SMTP/email-code path from
this instance, so it does not need `SMTP_*` or `ALLOWED_SIGNUP_EMAILS`. The only
login is the high-entropy review pairing code. The review site is created with
federation disabled so test posts are not broadcast.

```bash
npm run db:migrate
chmod 700 data
```

Do **not** run `npm run bootstrap-owner` for this instance; the first valid
review login provisions exactly the dedicated review account and site.

### 4. Add a separate supervised process

Run `which node`, then create `~/etc/services.d/flightstead-review.ini` with
the returned Node path:

```ini
[program:flightstead-review]
command=/home/<username>/bin/node dist/server.js
directory=/home/<username>/flightstead-review/server
autostart=true
autorestart=true
startsecs=5
stdout_logfile=/home/<username>/logs/flightstead-review.log
stderr_logfile=/home/<username>/logs/flightstead-review-error.log
```

```bash
supervisorctl reread
supervisorctl update
supervisorctl status flightstead-review
```

### 5. Add the TLS domain and route only it to the review port

```bash
uberspace web domain add review.yourdomain.com
uberspace web backend set review.yourdomain.com --http --port 3100
```

Create the exact DNS records printed by `domain add` and wait for
Uberspace to issue the certificates. Verify the API without exposing the
credential:

```bash
curl --fail https://review.yourdomain.com/api/v1/themes
```

This dedicated deployment intentionally serves both its API and its only public
tenant from `review.yourdomain.com`; its process, database, media, and login
remain separate from production.

### 6. Provision and test the account end to end

In a Release/TestFlight build of Flightstead:

1. Enter the full URL `https://review.yourdomain.com` as the server. Including
   `https://` makes the app use this host directly instead of inferring an
   `api.` subdomain.
2. Open **Have a pairing code instead of a QR?**
3. Enter the generated access code.
4. Create representative draft and published posts, upload an image, open the
   public site, sign out, and sign in again with the same code.
5. Keep the sample content suitable for an external reviewer. Do not use real
   personal data or production credentials.

The credential stays valid across devices and server restarts until its hash
is removed or replaced. Account deletion removes the review data, but a later
login with the configured code safely recreates the review account.

### 7. Put the login in App Store Connect

Use the dedicated review email as the demo-account username and the generated
access code as its password. In Review Notes say:

> Server: `https://review.yourdomain.com`. On the first screen, enter that full URL,
> choose “Have a pairing code instead of a QR?”, and enter the supplied demo
> account password as the pairing code. The credential is reusable and does
> not require email or two-factor authentication.

### Rotation and shutdown

To rotate a suspected or previously submitted credential, generate a new one,
replace only `APP_REVIEW_ACCESS_CODE_HASH` in `.env`, revoke every previously
issued review session, and restart:

```bash
npm run app-review:credential
nano .env
npm run app-review:revoke-sessions
supervisorctl restart flightstead-review
```

Update App Store Connect with the new plaintext access code. To disable review
access after review, first run `npm run app-review:revoke-sessions`, remove all
four `APP_REVIEW_*` values, and restart the process. Removing the hash alone
prevents new logins but does not revoke tokens already issued to devices.

Update this review checkout independently from the production process:

```bash
cd ~/flightstead-review
git pull --ff-only
cd server
npm install
npm run build
npm run db:migrate
supervisorctl restart flightstead-review
supervisorctl status flightstead-review
```

Do not use the repository-root `deploy.sh` unchanged for this process: its
default service name is `flightstead`, and it runs `bootstrap-owner`, neither of
which is appropriate for the isolated review instance.

## Updating

```bash
git pull
npm install
npm run build
npm run db:migrate
npm run bootstrap-owner
supervisorctl restart flightstead
```

(`bootstrap-owner` is a no-op once an owner exists — harmless to run on
every update, same as `deploy.sh` does.)

## Automating this

[deploy.sh](deploy.sh) at the repo root runs the update steps above over
SSH: copy `deploy.env.example` to `deploy.env`, fill in `UBERSPACE_USER`,
`UBERSPACE_HOST`, `REMOTE_PATH` (the repo path from step 1), and
`REPO_URL` (an `https://` clone URL — the Uberspace box has no GitHub
credentials of its own, so this only works against a public repo), then
run

```bash
./deploy.sh
```

from your own machine. It refuses to run with uncommitted local changes,
then SSHes in and either `git pull`s the existing clone at `REMOTE_PATH`
or, on the very first run, `git clone`s `REPO_URL` there — followed by
`npm install`, `npm run build`, `npm run db:migrate`,
`npm run bootstrap-owner`, and `supervisorctl restart flightstead` in
`server/`, the same commands you'd type by hand. Push to `origin` yourself
first; the script's own push step is commented out, since the remote
`git pull` needs your commits to already be there. `deploy.env` is
gitignored since it's machine-specific. Note this only handles
updates/first clone — the one-time account setup (steps 2, 3, 6, and 7
above: Node version, `.env`, the supervisord service file, domains) still
has to be done by hand before the first `./deploy.sh` run will fully
succeed.

## No wildcard subdomains

Uberspace's automatic domain/cert tooling only does HTTP-01 validation, so
there's no way to get a wildcard cert here — every site subdomain has to be
added by hand with `uberspace web domain add` + a matching DNS record +
`uberspace web backend set`, each time you create a site. See the note at
the end of [SELF_HOSTING.md](SELF_HOSTING.md) for the DNS-01/wildcard
alternative available on hosts where you control the reverse proxy
directly.
