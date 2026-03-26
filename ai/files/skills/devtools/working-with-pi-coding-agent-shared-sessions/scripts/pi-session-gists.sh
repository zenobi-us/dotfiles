#!/usr/bin/env bash
set -euo pipefail

LIMIT="${PI_SESSION_GIST_LIMIT:-200}"

require_tools() {
  command -v gh >/dev/null 2>&1 || { echo "ERROR: gh CLI is required" >&2; exit 1; }
  command -v jq >/dev/null 2>&1 || { echo "ERROR: jq is required" >&2; exit 1; }
}

human_size() {
  local bytes="${1:-0}"
  if command -v numfmt >/dev/null 2>&1; then
    numfmt --to=iec-i --suffix=B "$bytes"
  else
    echo "${bytes}B"
  fi
}

is_pi_session_gist() {
  local gist_id="$1"
  # Pi session shares exported as HTML include this marker.
  gh gist view "$gist_id" --raw 2>/dev/null | head -n 40 | grep -q '<title>Session Export</title>'
}

collect_rows_tsv() {
  local line id description files visibility updated json total_size first_file
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue

    id="$(awk '{print $1}' <<<"$line")"
    description="$(awk -F '\t' '{print $2}' <<<"$line")"
    files="$(awk -F '\t' '{print $3}' <<<"$line")"
    visibility="$(awk -F '\t' '{print $4}' <<<"$line")"
    updated="$(awk -F '\t' '{print $5}' <<<"$line")"

    if ! is_pi_session_gist "$id"; then
      continue
    fi

    json="$(gh api "gists/$id")"
    total_size="$(jq -r '[.files[]?.size // 0] | add // 0' <<<"$json")"
    first_file="$(jq -r '.files | to_entries[0].value.filename // ""' <<<"$json")"

    printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
      "$id" "$updated" "$(human_size "$total_size")" "$description" "$first_file" "$files" "$visibility"
  done < <(gh gist list --limit "$LIMIT")
}

print_table() {
  local rows
  rows="$(collect_rows_tsv || true)"

  if [[ -z "$rows" ]]; then
    echo "No Pi shared-session gists found."
    return 0
  fi

  printf '%-34s  %-20s  %-10s  %-34s  %-18s\n' "GIST ID" "UPDATED" "SIZE" "TITLE" "VISIBILITY"
  printf '%-34s  %-20s  %-10s  %-34s  %-18s\n' "----------------------------------" "--------------------" "----------" "----------------------------------" "------------------"

  while IFS=$'\t' read -r id updated size description first_file files visibility; do
    [[ -n "$id" ]] || continue
    local title="$description"
    if [[ -z "$title" ]]; then
      title="$first_file"
    fi
    printf '%-34s  %-20s  %-10s  %-34.34s  %-18s\n' "$id" "$updated" "$size" "$title" "$visibility"
  done <<<"$rows"

  echo
  echo "Next actions:"
  echo "  Open in browser:  $0 open <gist_id>"
  echo "  Delete one:       $0 delete <gist_id>"
  echo "  Delete all listed Pi session gists: $0 delete-all [--yes]"
}

open_gist() {
  local gist_id="${1:-}"
  [[ -n "$gist_id" ]] || { echo "ERROR: missing gist_id" >&2; exit 1; }

  local url="https://pi.dev/session/#${gist_id}"

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  fi

  echo "$url"
}

delete_one() {
  local gist_id="${1:-}"
  local yes_flag="${2:-}"
  [[ -n "$gist_id" ]] || { echo "ERROR: missing gist_id" >&2; exit 1; }

  if [[ "$yes_flag" == "--yes" ]]; then
    gh gist delete "$gist_id" --yes
  else
    gh gist delete "$gist_id"
  fi
}

delete_all() {
  local yes_flag="${1:-}"
  local ids
  ids="$(collect_rows_tsv | awk -F '\t' '{print $1}')"

  if [[ -z "$ids" ]]; then
    echo "No Pi shared-session gists to delete."
    return 0
  fi

  echo "About to delete the following Pi shared-session gists:"
  echo "$ids"

  if [[ "$yes_flag" != "--yes" ]]; then
    read -r -p "Continue? [y/N] " answer
    [[ "$answer" =~ ^[Yy]$ ]] || { echo "Aborted."; return 0; }
  fi

  while IFS= read -r id; do
    [[ -n "$id" ]] || continue
    echo "Deleting $id"
    gh gist delete "$id" --yes
  done <<<"$ids"
}

usage() {
  cat <<'EOF'
pi-session-gists.sh - manage Pi shared-session gists

Usage:
  pi-session-gists.sh list
  pi-session-gists.sh open <gist_id>
  pi-session-gists.sh delete <gist_id> [--yes]
  pi-session-gists.sh delete-all [--yes]

Environment:
  PI_SESSION_GIST_LIMIT  Max gists to inspect from gh gist list (default: 200)
EOF
}

main() {
  require_tools

  local cmd="${1:-list}"
  case "$cmd" in
    list)
      print_table
      ;;
    open)
      shift
      open_gist "${1:-}"
      ;;
    delete)
      shift
      delete_one "${1:-}" "${2:-}"
      ;;
    delete-all)
      shift
      delete_all "${1:-}"
      ;;
    help|-h|--help)
      usage
      ;;
    *)
      echo "ERROR: unknown command '$cmd'" >&2
      usage
      exit 1
      ;;
  esac
}

main "$@"
