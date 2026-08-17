#!/usr/bin/env bash

if [[ -n "${CLAUDE_CODE:-}" || -n "${CLAUDE_PROJECT_DIR:-}" ]]; then
	printf '%s\n' claude
elif [[ -n "${CODEX_SANDBOX:-}" ]]; then
	printf '%s\n' codex
elif [[ -n "${PI_CODING_AGENT_DIR:-}" || -n "${PI_CODING_AGENT:-}" ]]; then
	printf '%s\n' pi
elif [[ -n "${OPENCODE:-}" ]]; then
	printf '%s\n' opencode
else
	printf '%s\n' unknown
	exit 1
fi
