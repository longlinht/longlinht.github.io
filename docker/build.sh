#!/usr/bin/env bash
# Build the site inside Docker. Output goes to ./_site (owned by the current user).
# Usage: docker/build.sh            # build image if needed, then build the site
#        docker/build.sh --rebuild  # force rebuilding the image (e.g. after Gemfile changes)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="longlinht-blog:jekyll"

if [[ "${1:-}" == "--rebuild" ]] || ! docker image inspect "$IMAGE" >/dev/null 2>&1; then
  docker build -t "$IMAGE" -f "$ROOT/docker/Dockerfile" "$ROOT"
fi

docker run --rm \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "$ROOT:/site" \
  "$IMAGE" \
  bundle exec jekyll build --trace
