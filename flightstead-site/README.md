# Flightstead product site

This is the standalone static website for `flightstead.com`. It has no runtime,
database, framework, analytics, cookies, or dependency on the Flightstead blog
server.

Serve the contents of `dist/` as the document root. `index.html`, the images,
and both fonts are already built and can be copied directly to any ordinary
static web server.

## Caddy

Copy `Caddyfile.example` to your server, replace the path with the absolute path
to `dist/`, and reload Caddy.

## Nginx

Copy the server block from `nginx.conf.example`, replace the domain and root,
then test and reload Nginx.

## Updating

Upload the directory atomically when possible—for example, copy it to a new
release directory and switch a `current` symlink after the upload completes.
There is no build command. The App Store URLs are deliberate placeholders until
the listing is live.
