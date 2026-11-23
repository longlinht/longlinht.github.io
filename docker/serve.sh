#!/usr/bin/env bash
# Serve the site locally with live reload at http://localhost:4000
# Usage: docker/serve.sh [port]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="longlinht-blog:jekyll"
PORT="${1:-4000}"

docker image inspect "$IMAGE" >/dev/null 2>&1 || "$ROOT/docker/build.sh"

docker run --rm -it \
  -u "$(id -u):$(id -g)" \
  -e HOME=/tmp \
  -v "$ROOT:/site" \
  -p "$PORT:4000" \
  "$IMAGE" \
  bundle exec jekyll serve --host 0.0.0.0 --port 4000 --watch --force_polling --drafts
