#!/bin/bash
set -euo pipefail
repository_root="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$repository_root"
: "${IOS_PROJECT:?Set IOS_PROJECT}"
: "${IOS_SCHEME:?Set IOS_SCHEME}"
: "${IOS_TARGET:?Set IOS_TARGET}"
: "${IOS_APP_IDENTIFIER:?Set IOS_APP_IDENTIFIER}"
: "${APPLE_TEAM_ID:?Set APPLE_TEAM_ID}"
: "${ASC_KEY_ID:?Set ASC_KEY_ID}"
: "${ASC_ISSUER_ID:?Set ASC_ISSUER_ID}"
: "${ASC_KEY_PATH:?Set ASC_KEY_PATH to an absolute private-key path}"
[[ "$ASC_KEY_PATH" == /* && -f "$ASC_KEY_PATH" ]] || { echo "Private key must exist at an absolute path." >&2; exit 1; }
revision="$(git rev-parse --verify "${1:-HEAD}^{commit}")"
release_branch="${RELEASE_BRANCH:-main}"
release_remote="${RELEASE_REMOTE:-origin}"
remote_revision="$(git ls-remote --exit-code "$release_remote" "refs/heads/$release_branch" | awk '{print $1}')"
[[ "$revision" == "$remote_revision" ]] || { echo "Release revision must match the remote release branch." >&2; exit 1; }
release_source="$(mktemp -d "${TMPDIR:-/tmp}/ios-release.XXXXXX")"
trap 'rm -rf "$release_source"' EXIT
git archive --format=tar "$revision" | tar -xf - -C "$release_source"
cd "$release_source"
if [[ -n "${IOS_PROJECT_SPEC:-}" ]]; then
  xcodegen generate --spec "$IOS_PROJECT_SPEC"
fi
export IOS_RELEASE_OUTPUT="$release_source/release-output"
if [[ -f Gemfile ]]; then
  runner=(bundle exec fastlane)
else
  runner=(fastlane)
fi
echo "Releasing committed revision $revision"
"${runner[@]}" ios asc_preflight
"${runner[@]}" ios beta
