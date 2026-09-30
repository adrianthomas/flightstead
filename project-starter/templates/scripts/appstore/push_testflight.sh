#!/bin/bash
set -euo pipefail
repository_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repository_root"
release_branch="${RELEASE_BRANCH:-main}"
release_remote="${RELEASE_REMOTE:-origin}"
[[ "$(git branch --show-current)" == "$release_branch" ]] || { echo "Switch to the configured release branch before releasing." >&2; exit 1; }
revision="$(git rev-parse HEAD)"
# Push the captured commit; another session changing HEAD cannot change this release.
git push "$release_remote" "$revision:refs/heads/$release_branch"
exec bash "$repository_root/scripts/appstore/upload_testflight.sh" "$revision"
