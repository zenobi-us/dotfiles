# Troubleshooting: muxer or agent comes back unknown unexpectedly

## Symptom

`scripts/router.mjs detect-muxer` prints `unknown-muxer`, or `detect-agent` prints `unknown-agent`, even though a muxer or agent is actually active.

## Cause

Detection only checks confirmed, self-identifying signals:

- Muxer: `HERDR_ENV=1` (herdr), `$ZELLIJ` (zellij), `$TMUX` (tmux), `HRDX=1` (hrdx — confirmed in `devtools/files/pi/agent/extensions/@zenobius/pi-hrdx-agents/README.md`).
- Agent: `CLAUDECODE=1` (claude), `PI_CODING_AGENT=true` (pi). zot has no confirmed signal. pi's SDK-embedded mode does not set its own markers either — only pi's CLI-launched sessions do.

Anything outside that list reports `unknown-muxer`/`unknown-agent` on purpose, rather than guessing from a weaker signal like a binary being on `PATH`.

## Fix

- Pass the override explicitly: `route "<request>" --agent zot` (or any other case detection cannot see).
- If this is a new, real, confirmed signal (not a guess), update `detectMuxer()`/`detectAgent()` in `scripts/detect.mjs` and the matching `references/muxers/*.md` or `references/agents/*.md` file.
- Never silently pick a muxer or agent when detection returns `unknown-muxer`/`unknown-agent` and no override was given — ask the user.
