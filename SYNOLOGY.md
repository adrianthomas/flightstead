# Run Flightstead on a Synology NAS

This is the simplest supported Synology setup: DSM 7.2 Container Manager runs
one Flightstead container, DSM handles HTTPS and reverse proxying, and a normal
shared-folder directory contains the SQLite database and every upload. There is
no database container to administer.

## Before you start

You need:

- a Synology model that supports **Container Manager**;
- a domain whose DNS you control;
- TCP ports 80 and 443 forwarded from your router to the NAS (and a public IP
  that is not behind carrier-grade NAT); and
- SMTP credentials if you want to sign in by email after the initial QR-code
  pairing.

Flightstead routes by hostname. In the examples below, `example.com` is the base
domain, `api.example.com` is the iOS API, and `blog.example.com` is the first
public site. Replace all three with your real names.

## 1. Put the project on the NAS

Download the repository's source archive, then use File Station to extract it
to a durable location such as:

```text
/volume1/docker/shareblog
```

The directory should contain `compose.synology.yml`, `synology.env.example`,
and the `server` directory. Copy `synology.env.example` to `synology.env` and
edit at least these values:

```dotenv
BASE_DOMAIN=example.com
API_BASE_URL=https://api.example.com
ALLOWED_SIGNUP_EMAILS=you@example.com
SMTP_HOST=smtp.example.com
SMTP_USER=you@example.com
SMTP_PASS=replace-me
SMTP_FROM=Flightstead <you@example.com>
```

Keep `DATABASE_URL` and `LOCAL_STORAGE_DIR` at their supplied `/app/data/...`
paths. `synology.env` contains secrets and is intentionally ignored by Git.

Also create an empty `data` folder inside the project directory now, using File
Station. Unlike plain Linux Docker, Synology's Container Manager does not
auto-create a bind mount's host directory — starting the project before this
folder exists fails with `Bind mount failed: '.../data' does not exist`.

## 2. Create the Container Manager project

In **Container Manager → Project**, choose **Create**. Use `shareblog` as the
project name, select the extracted directory as its path, and upload
`compose.synology.yml` as the Compose file. Build and start the project.

The first build can take several minutes, especially on an ARM NAS. Every
start applies pending database migrations automatically. In the project details,
the `shareblog` container should become healthy and its log should end with
`Flightstead server listening on :3000`.

The Compose file publishes the app only on the NAS loopback interface at
`127.0.0.1:3100`; do not forward port 3100 on your router. Container logs are
rotated automatically and retain at most three 10 MB files.

## 3. Add DNS, certificates, and reverse-proxy rules

Create DNS records for the base/API host and the first site, all pointing to
your public IP:

```text
example.com
api.example.com
blog.example.com
```

Dynamic-DNS users can use CNAME records pointing at the NAS's DDNS hostname.
If the ISP changes your public IP, make sure DSM or your DNS provider keeps the
target record updated.

In **Control Panel → Security → Certificate**, request or import a certificate
that covers all three names. Then go to **Control Panel → Login Portal →
Advanced → Reverse Proxy** and create one rule for each hostname:

| Setting | Value |
|---|---|
| Source protocol | HTTPS |
| Source hostname | The rule's public hostname |
| Source port | 443 |
| Destination protocol | HTTP |
| Destination hostname | `localhost` |
| Destination port | `3100` |

In each rule's **Custom Header** tab, set the request header `Host` to
`$http_host`. Flightstead needs the original public hostname to distinguish the
API from public sites. Assign the matching certificate to each reverse-proxy
service in DSM's certificate settings.

Forward router ports 80 and 443 to the NAS. Port 80 is needed for ordinary
Let's Encrypt renewal even if visitors are redirected to HTTPS. Do not expose
DSM's management ports or Flightstead's port 3100.

DSM's GUI creates rules one hostname at a time. Add another DNS name,
certificate name, and reverse-proxy rule whenever you add a new Flightstead
subdomain or custom domain.

## 4. Create and pair the owner

Open **Container Manager → Container → shareblog → Details → Terminal** and
create a terminal with this command, replacing the address:

```sh
node dist/db/bootstrap-owner.js --email you@example.com
```

The terminal prints a QR code and a short manual code. In the Flightstead iOS
app, choose **Scan to Connect**. The code expires after 20 minutes and is
single-use; run the same command again to pair another device.

If you use SSH on the NAS, the equivalent command from the project directory
is:

```sh
sudo docker compose -f compose.synology.yml exec shareblog \
  node dist/db/bootstrap-owner.js --email you@example.com
```

## Updating

Stop the Container Manager project, replace the application source with the
new release while preserving `synology.env` and `data/`, then choose **Build**
and **Start** for the project. Startup applies any new migrations before the
server accepts traffic.

With an SSH checkout, the same flow is:

```sh
git pull --ff-only
sudo docker compose -f compose.synology.yml up -d --build
```

## Backups and recovery

Everything irreplaceable is under the project directory's `data/` folder. Add
that folder and `synology.env` to Hyper Backup. For a consistent manual backup,
stop the project first, copy both, and then start it again. Restoring consists
of putting those files back beside the Compose file and rebuilding the project.

Do not use Container Manager's **Clean** action as a backup mechanism. The bind
mounted `data/` directory is deliberately visible outside the container, but a
separate backup is still essential.

## Troubleshooting

- **The container repeatedly exits:** open its Log tab. Missing
  `ALLOWED_SIGNUP_EMAILS` or an unreadable `synology.env` is usually explicit
  in the error.
- **The API shows a public page or a site returns 404:** verify the reverse
  proxy's `Host: $http_host` custom header and the exact `BASE_DOMAIN` value.
- **Uploads work but disappear after an update:** confirm the project still
  mounts `./data:/app/data` and restore the `data/` backup if it was replaced.
- **HTTPS works inside the LAN but not remotely:** check router forwarding,
  the NAS firewall, DNS, and whether the ISP uses carrier-grade NAT.
- **Email codes fail:** QR pairing does not require SMTP, but later email sign-in
  does. Check `SMTP_*` and the container log.

For non-Synology Linux installations and more detail on domains and federation,
see [SELF_HOSTING.md](SELF_HOSTING.md).
