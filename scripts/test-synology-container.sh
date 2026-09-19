#!/bin/sh
set -eu

platform="${1:-linux/amd64}"
architecture="${platform##*/}"
image="flightstead-synology-smoke:${architecture}"
container="flightstead-synology-smoke-${architecture}-$$"
data_dir="$(mktemp -d "${TMPDIR:-/tmp}/flightstead-synology-smoke.XXXXXX")"

cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
  rm -rf "$data_dir"
}
trap cleanup EXIT INT TERM

docker buildx build --load --platform "$platform" -t "$image" server
docker run --detach \
  --name "$container" \
  --platform "$platform" \
  --env NODE_ENV=production \
  --env BASE_DOMAIN=example.test \
  --env API_BASE_URL=https://api.example.test \
  --env ALLOWED_SIGNUP_EMAILS=owner@example.test \
  --env DATABASE_URL=/app/data/shareblog.db \
  --env STORAGE_DRIVER=local \
  --env LOCAL_STORAGE_DIR=/app/data/uploads \
  --volume "$data_dir:/app/data" \
  "$image" >/dev/null

attempt=0
while [ "$attempt" -lt 45 ]; do
  status="$(docker inspect --format '{{.State.Health.Status}}' "$container")"
  running="$(docker inspect --format '{{.State.Running}}' "$container")"
  if [ "$status" = "healthy" ]; then
    docker exec "$container" test -f /app/data/shareblog.db
    echo "Synology container smoke test passed for $platform."
    exit 0
  fi
  if [ "$status" = "unhealthy" ] || [ "$running" != "true" ]; then
    break
  fi
  attempt=$((attempt + 1))
  sleep 2
done

docker logs "$container"
echo "Synology container did not become healthy (last status: $status)." >&2
exit 1
