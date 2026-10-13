# Troubleshooting: muxer or agent comes back unknown unexpectedly

## Symptom

`scripts/router.ts detect-muxer` prints `unknown-muxer`, or `detect-agent` prints `unknown-agent`, even though a muxer or agent is actually active.

## Cause

Detection checks these agent markers in priority order: `OMPCODE=1` (omp), `PI_CODING_AGENT=true` or `AI_AGENT=pi` (pi), `AGENT=zot` (zot), `AGENT=codex` (codex), and `CLAUDECODE=1` (claude). If none match, the router returns `unknown-agent`. Pi's SDK-embedded mode does not set its markers; its CLI-launched sessions do.

Anything outside that list reports `unknown-muxer`/`unknown-agent` on purpose, rather than guessing from a weaker signal like a binary being on `PATH`.

## Fix

- Pass the override explicitly: `route "<request>" --agent zot` (or any other case detection cannot see).
- If a new, real, confirmed signal appears, update `detectAgent()` in `scripts/session-context.ts` and the matching `references/agents/*.md` file. Do not add weak signals such as executable availability.
- Never silently pick a muxer or agent when detection returns `unknown-muxer`/`unknown-agent` and no override was given — ask the user.
