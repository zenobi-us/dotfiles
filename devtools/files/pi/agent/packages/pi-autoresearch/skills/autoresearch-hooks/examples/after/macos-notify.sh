#!/usr/bin/env bash
# Fires a native macOS banner (and optional steer) only on milestone runs.
# Uses osascript, which is built into macOS. For other platforms swap to
# terminal-notifier, notify-send (Linux), or a webhook curl.

set -euo pipefail

readonly TITLE="🏆 autoresearch: new best"

is_new_best() {
  local status="$1" metric="$2" best="$3"
  [ "$status" = "keep" ] && [ -n "$best" ] && [ "$metric" = "$best" ]
}

send_mac_notification() {
  osascript -e "display notification \"$1\" with title \"$TITLE\"" >/dev/null
}

input="$(cat)"
status=$(jq -r '.run_entry.status' <<<"$input")
metric=$(jq -r '.run_entry.metric' <<<"$input")
best=$(jq -r '.session.best_metric // empty' <<<"$input")
name=$(jq -r '.session.metric_name' <<<"$input")
unit=$(jq -r '.session.metric_unit // ""' <<<"$input")

is_new_best "$status" "$metric" "$best" || exit 0

body="$name = $metric$unit"
send_mac_notification "$body"
echo "🏆 New best: $body"
