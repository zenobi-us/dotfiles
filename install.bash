#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if ! command -v mise >/dev/null 2>&1; then
  curl https://mise.run | sh
  export PATH="$HOME/.local/bin:$PATH"
fi

if ! mise help bootstrap >/dev/null 2>&1; then
  mise self-update
fi

mise trust "$repo_root/mise.toml" >/dev/null 2>&1 || true
mise -C "$repo_root" bootstrap --yes "$@"
