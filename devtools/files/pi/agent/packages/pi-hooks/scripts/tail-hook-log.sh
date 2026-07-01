#!/usr/bin/env bash
#
# Dependencies:
#   - jq (required for filtered or pretty-printed output; optional for --raw with no filters)
#   - tail (BSD or GNU; uses tail -F to follow log rotation)
#
# Behavior:
#   By default the script polls until the log file exists, then follows it.
#   Pass --no-wait to fail fast if the log is missing (legacy behavior).
#
set -euo pipefail

LOG_FILE="${PI_YAML_HOOKS_LOG_FILE:-$HOME/.pi/agent/logs/pi-hooks.ndjson}"
HOOK_FILTER=""
EVENT_FILTER=""
SESSION_FILTER=""
KIND_FILTER=""
LEVEL_FILTER=""
RAW_OUTPUT=0
WAIT_FOR_CREATION=1
WAIT_TIMEOUT_SECONDS=0  # 0 means wait forever
WAIT_POLL_SECONDS=1

usage() {
  cat <<'EOF'
Usage: tail-hook-log.sh [options]

Tail the persistent pi-hooks NDJSON log and pretty-print entries.

Dependencies:
  jq (required for filters and pretty output; --raw without filters works without jq)
  tail (uses -F to follow log rotation)

Options:
  --file PATH        Read a specific log file instead of PI_YAML_HOOKS_LOG_FILE/default
  --hook ID          Show only entries for a specific hookId
  --event EVENT      Show only entries for a specific event
  --session ID       Show only entries for a specific sessionId
  --kind KIND        Show only entries for a specific log kind
  --level LEVEL      Show only entries for a specific level (error|warn|info|debug)
  --raw              Output raw NDJSON lines (still filtered when jq is available)
  --no-wait          Fail fast if the log file does not exist (legacy behavior)
  --wait-timeout N   When waiting, give up after N seconds (default 0 = forever)
  -h, --help         Show this help

Examples:
  ./scripts/tail-hook-log.sh
  ./scripts/tail-hook-log.sh --hook load-writer-skill-when-markdown-changes
  ./scripts/tail-hook-log.sh --event session.idle --session abc123
  ./scripts/tail-hook-log.sh --kind action_result --level info
  ./scripts/tail-hook-log.sh --no-wait                 # fail fast if log missing
  ./scripts/tail-hook-log.sh --wait-timeout 30         # wait up to 30s for the log
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --file)
      LOG_FILE="$2"
      shift 2
      ;;
    --hook)
      HOOK_FILTER="$2"
      shift 2
      ;;
    --event)
      EVENT_FILTER="$2"
      shift 2
      ;;
    --session)
      SESSION_FILTER="$2"
      shift 2
      ;;
    --kind)
      KIND_FILTER="$2"
      shift 2
      ;;
    --level)
      LEVEL_FILTER="$2"
      shift 2
      ;;
    --raw)
      RAW_OUTPUT=1
      shift
      ;;
    --no-wait)
      WAIT_FOR_CREATION=0
      shift
      ;;
    --wait-timeout)
      WAIT_TIMEOUT_SECONDS="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ ! -f "$LOG_FILE" ]]; then
  if [[ "$WAIT_FOR_CREATION" -eq 0 ]]; then
    echo "pi-hooks log file not found yet: $LOG_FILE" >&2
    echo "Start PI with PI_YAML_HOOKS_DEBUG=1 and trigger a hook first." >&2
    exit 1
  fi
  echo "Waiting for log file to be created: $LOG_FILE" >&2
  if [[ "$WAIT_TIMEOUT_SECONDS" -gt 0 ]]; then
    echo "(timeout: ${WAIT_TIMEOUT_SECONDS}s; pass --no-wait to fail fast instead)" >&2
  else
    echo "(no timeout; pass --wait-timeout N or --no-wait to bound the wait)" >&2
  fi
  waited=0
  while [[ ! -f "$LOG_FILE" ]]; do
    sleep "$WAIT_POLL_SECONDS"
    if [[ "$WAIT_TIMEOUT_SECONDS" -gt 0 ]]; then
      waited=$((waited + WAIT_POLL_SECONDS))
      if [[ "$waited" -ge "$WAIT_TIMEOUT_SECONDS" ]]; then
        echo "Timed out waiting for log file: $LOG_FILE" >&2
        exit 1
      fi
    fi
  done
  echo "Log file appeared; tailing." >&2
fi

if ! command -v jq >/dev/null 2>&1; then
  if [[ -n "$HOOK_FILTER" || -n "$EVENT_FILTER" || -n "$SESSION_FILTER" || -n "$KIND_FILTER" || -n "$LEVEL_FILTER" ]]; then
    echo "jq is required for filtered tail output." >&2
    exit 1
  fi
  tail -F "$LOG_FILE"
  exit 0
fi

read -r -d '' JQ_FILTER <<'EOF' || true
($hook == "" or (.hookId // "") == $hook) and
($event == "" or (.event // "") == $event) and
($session == "" or (.sessionId // "") == $session) and
($kind == "" or (.kind // "") == $kind) and
($level == "" or (.level // "") == $level)
EOF

if [[ "$RAW_OUTPUT" -eq 1 ]]; then
  tail -F "$LOG_FILE" | jq -c \
    --arg hook "$HOOK_FILTER" \
    --arg event "$EVENT_FILTER" \
    --arg session "$SESSION_FILTER" \
    --arg kind "$KIND_FILTER" \
    --arg level "$LEVEL_FILTER" \
    "select($JQ_FILTER)"
  exit 0
fi

read -r -d '' JQ_PROGRAM <<'EOF' || true
def details_summary:
  [
    (if .details.reason then "reason=" + (.details.reason | tostring) else empty end),
    (if .details.prompt then "prompt=" + (.details.prompt | tostring) else empty end),
    (if .details.targetSessionID then "target=" + (.details.targetSessionID | tostring) else empty end),
    (if .details.blockReason then "block=" + (.details.blockReason | tostring) else empty end),
    (if .details.approved != null then "approved=" + (.details.approved | tostring) else empty end),
    (if .details.status then "status=" + (.details.status | tostring) else empty end),
    (if .details.exitCode != null then "exit=" + (.details.exitCode | tostring) else empty end),
    (if .details.durationMs != null then "durationMs=" + (.details.durationMs | tostring) else empty end),
    (if .details.files then "files=" + (.details.files | @json) else empty end),
    (if .details.changedPaths then "changedPaths=" + (.details.changedPaths | @json) else empty end),
    (if .details.error then "error=" + (.details.error | tostring) else empty end)
  ] | map(select(length > 0)) | join(" | ");

select(
  ($hook == "" or (.hookId // "") == $hook) and
  ($event == "" or (.event // "") == $event) and
  ($session == "" or (.sessionId // "") == $session) and
  ($kind == "" or (.kind // "") == $kind) and
  ($level == "" or (.level // "") == $level)
)
| [
    (.ts // "-"),
    (.level // "info"),
    (.kind // "-"),
    (if .event then "event=" + .event else empty end),
    (if .sessionId then "session=" + .sessionId else empty end),
    (if .hookId then "hook=" + .hookId else empty end),
    (if .action then "action=" + .action else empty end),
    (if .toolName then "tool=" + .toolName else empty end),
    (if .message then .message else empty end),
    details_summary
  ]
| map(select(. != null and . != ""))
| join(" | ")
EOF

tail -F "$LOG_FILE" | jq -r \
  --arg hook "$HOOK_FILTER" \
  --arg event "$EVENT_FILTER" \
  --arg session "$SESSION_FILTER" \
  --arg kind "$KIND_FILTER" \
  --arg level "$LEVEL_FILTER" \
  "$JQ_PROGRAM"
