#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SMOKE_DIR="${1:-$(mktemp -d "${TMPDIR:-/tmp}/pi-hooks-runtime-smoke.XXXXXX")}" 
HOOK_DIR="$SMOKE_DIR/.pi/hook"
EVIDENCE_DIR="$SMOKE_DIR/.pi/hooks-smoke"
LOG_FILE="$EVIDENCE_DIR/pi-hooks.ndjson"

mkdir -p "$HOOK_DIR" "$EVIDENCE_DIR"
cp "$ROOT_DIR/scripts/smoke/pi-runtime-smoke-hooks.yaml" "$HOOK_DIR/hooks.yaml"

node --input-type=module - "$HOOK_DIR/hooks.yaml" "$ROOT_DIR/scripts/smoke/pi-runtime-smoke-invalid-hooks.yaml" <<'NODE'
import fs from 'node:fs';
import YAML from 'yaml';
for (const file of process.argv.slice(2)) {
  YAML.parse(fs.readFileSync(file, 'utf8'));
}
NODE

# Pre-fill SDK versions from the local node_modules so testers don't have to
# look them up by hand. Each lookup falls back to `unknown` when the package
# is missing (e.g., a fresh checkout that has not run `npm install`). We read
# package.json directly because some SDK packages do not export ./package.json.
sdk_version() {
  local pkg="$1"
  local pj="$ROOT_DIR/node_modules/$pkg/package.json"
  if [[ -f "$pj" ]]; then
    node --input-type=module --eval "
      import fs from 'node:fs';
      try {
        const v = JSON.parse(fs.readFileSync(process.argv[1], 'utf8')).version;
        console.log(v ?? 'unknown');
      } catch { console.log('unknown'); }
    " -- "$pj" 2>/dev/null || echo "unknown"
  else
    echo "unknown"
  fi
}

CURRENT_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
TESTER="${USER:-${LOGNAME:-unknown}}"
CODING_AGENT_VERSION="$(cd "$ROOT_DIR" && sdk_version "@earendil-works/pi-coding-agent")"
TUI_VERSION="$(cd "$ROOT_DIR" && sdk_version "@earendil-works/pi-tui")"
if command -v pi >/dev/null 2>&1; then
  # Some PI builds emit --version on stderr, so merge both streams.
  PI_VERSION="$(pi --version 2>&1 | head -n 1)"
  PI_VERSION="${PI_VERSION:-TODO: capture pi --version}"
else
  PI_VERSION="TODO: install pi or capture --version manually"
fi

cat > "$EVIDENCE_DIR/evidence.md" <<EOF
# pi-hooks runtime smoke evidence

- Date: $CURRENT_DATE
- Tester: $TESTER (replace if running on behalf of someone else)
- pi-hooks checkout: $ROOT_DIR
- Smoke project: $SMOKE_DIR
- PI version: $PI_VERSION
- @earendil-works/pi-coding-agent version: $CODING_AGENT_VERSION
- @earendil-works/pi-tui version: $TUI_VERSION
- Node version: $(node --version)
- OS: $(uname -a)
- Extension entry: $ROOT_DIR/extensions/index.ts
- Hook config: $HOOK_DIR/hooks.yaml
- Log file: $LOG_FILE

> Reminder: review pre-filled values before sharing. The Results table below is the human-required section — fill each row.

## Automated prep

\`scripts/smoke/pi-runtime-smoke.sh\` created the smoke project and parsed both fixture YAML files successfully.

## Manual run command

\`\`\`bash
cd "$SMOKE_DIR"
PI_YAML_HOOKS_TRUST_PROJECT=1 \\
PI_YAML_HOOKS_DEBUG=1 \\
PI_YAML_HOOKS_LOG_FILE="$LOG_FILE" \\
PI_YAML_HOOKS_ENABLE_USER_BASH=1 \\
pi -e "$ROOT_DIR/extensions/index.ts"
\`\`\`

## Results

| Step | Result | Notes or evidence |
|---|---|---|
| /hooks-status |  |  |
| /hooks-validate |  |  |
| /hooks-reload |  |  |
| custom diagnostics |  |  |
| tool.before.bash confirm |  |  |
| tool.after.read follow-up prompt |  |  |
| tool.after.write and file.changed |  |  |
| user_bash opt-in |  |  |
| session.created / idle / deleted |  |  |
| /new or session switch |  |  |
| /quit |  |  |
| Future SDK no-builtin-tools gate |  |  |

## Attachments

- Copy relevant excerpts from \`$LOG_FILE\`.
- Copy \`.pi/hooks-smoke/events.ndjson\`.
- Save screenshots or terminal transcript for UI notifications, confirmations, status, and custom diagnostic messages.
EOF

cat <<EOF
Prepared pi-hooks runtime smoke project.

Smoke project: $SMOKE_DIR
Hook config:    $HOOK_DIR/hooks.yaml
Event log:      $EVIDENCE_DIR/events.ndjson
Hook log:       $LOG_FILE
Evidence:       $EVIDENCE_DIR/evidence.md

Run PI manually with:

  cd "$SMOKE_DIR"
  PI_YAML_HOOKS_TRUST_PROJECT=1 \\
  PI_YAML_HOOKS_DEBUG=1 \\
  PI_YAML_HOOKS_LOG_FILE="$LOG_FILE" \\
  PI_YAML_HOOKS_ENABLE_USER_BASH=1 \\
  pi -e "$ROOT_DIR/extensions/index.ts"

Then follow docs/maintaining.md#runtime-pi-smoke-checklist.
EOF
