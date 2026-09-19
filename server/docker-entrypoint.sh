#!/bin/sh
set -eu

if [ "$(id -u)" = "0" ]; then
  mkdir -p /app/data/uploads
  chown -R node:node /app/data
  exec gosu node "$0" "$@"
fi

# Applying the ordered migrations on every start is idempotent and makes a
# Container Manager rebuild/restart sufficient for upgrades.
node dist/db/migrate.js
exec "$@"
