#!/usr/bin/env bash
# Tag every new best with a sortable git tag so `git log --tags` becomes
# a progression record. Pure side effect — no steer.

set -euo pipefail

readonly TAG_PREFIX="autoresearch/best-run"

is_new_best() {
  local status="$1" metric="$2" best="$3"
  [ "$status" = "keep" ] && [ -n "$best" ] && [ "$metric" = "$best" ]
}

tag_name_for() {
  local run="$1" metric="$2"
  printf '%s-%s-%s' "$TAG_PREFIX" "$run" "$(printf '%g' "$metric")"
}

write_tag() {
  git -C "$1" tag -f "$2" >/dev/null
}

input="$(cat)"
status=$(jq -r '.run_entry.status' <<<"$input")
metric=$(jq -r '.run_entry.metric' <<<"$input")
best=$(jq -r '.session.best_metric // empty' <<<"$input")

is_new_best "$status" "$metric" "$best" || exit 0

workdir=$(jq -r '.cwd' <<<"$input")
run=$(jq -r '.run_entry.run' <<<"$input")
write_tag "$workdir" "$(tag_name_for "$run" "$metric")"
