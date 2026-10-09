#!/usr/bin/env bash
# On a discard, ask a cheap model to critique the failed hypothesis.
# Swap llm-cli for any short-prompt CLI (claude-haiku, llama-cli, ollama,
# a local endpoint via curl, etc.).

set -euo pipefail

readonly MODEL="claude-haiku-4-5"

fired_on_discard() {
  [ "$(jq -r '.last_run.status // empty' <<<"$1")" = "discard" ]
}

critique_prompt() {
  local hyp="$1" reason="$2"
  printf 'Hypothesis "%s" was discarded because: %s.\n' "$hyp" "$reason"
  printf 'Name two adjacent directions that might work instead. One sentence each.'
}

ask_model() {
  llm-cli --model "$MODEL" --prompt "$1"
}

input="$(cat)"
fired_on_discard "$input" || exit 0

hyp=$(jq -r '.last_run.asi.hypothesis // "unknown"' <<<"$input")
reason=$(jq -r '.last_run.asi.rollback_reason // "unknown"' <<<"$input")
ask_model "$(critique_prompt "$hyp" "$reason")"
