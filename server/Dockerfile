FROM node:22-bookworm-slim AS build

WORKDIR /app

# Native modules normally have compatible prebuilds, but keeping the toolchain
# in the build stage also covers less common Synology ARM64 hosts.
RUN apt-get update \
  && apt-get install -y --no-install-recommends g++ make python3 \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
# package.json's postinstall hook validates/rebuilds better-sqlite3 when its
# prebuilt binary is incompatible with the target NAS, so it must be present
# before npm ci runs.
COPY scripts ./scripts
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

# gosu lets the entrypoint repair bind-mount ownership as root, then run the
# application and migrations as the unprivileged node user.
RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY src/db/migrations ./src/db/migrations
COPY public ./public
COPY docker-entrypoint.sh /usr/local/bin/shareblog-entrypoint

RUN chmod +x /usr/local/bin/shareblog-entrypoint \
  && mkdir -p /app/data/uploads \
  && chown -R node:node /app/data

VOLUME ["/app/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "const s=require('node:net').connect(3000,'127.0.0.1');s.setTimeout(3000);s.on('connect',()=>{s.end();process.exit(0)});s.on('timeout',()=>process.exit(1));s.on('error',()=>process.exit(1))"]

ENTRYPOINT ["shareblog-entrypoint"]
CMD ["node", "dist/server.js"]
