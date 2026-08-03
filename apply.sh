#!/usr/bin/env bash
set -euo pipefail

repo_root=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)

if (($# == 0)); then
  exec mise -C "$repo_root" bootstrap --yes
fi

exec mise -C "$repo_root" bootstrap --yes "$@"
