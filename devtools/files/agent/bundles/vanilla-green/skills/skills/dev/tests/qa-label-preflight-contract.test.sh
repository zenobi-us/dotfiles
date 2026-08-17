#!/usr/bin/env bash
# Regression test for required GitHub QA-label application policy.
set -euo pipefail

TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKFLOW="$TEST_DIR/../workflows/dev-implement.md"

fail() {
    printf 'FAIL: %s\n' "$*" >&2
    exit 1
}

require_text() {
    local needle="$1" description="$2"
    if ! grep -Fq -- "$needle" "$WORKFLOW"; then
        fail "$description"
    fi
    printf 'ok - %s\n' "$description"
}

require_text '`needs-safety-audit`' 'safety QA label remains documented'
require_text '`needs-perf-test`' 'performance QA label remains documented'
require_text '`needs-review`' 'architecture QA label remains documented'
require_text 'label-add [PR_OR_ISSUE] [QA_LABEL] --required' 'GitHub QA mutation uses required capability preflight'
require_text '`configuration_error` (required label missing)' 'missing required label has a configuration outcome'
require_text '`capability_error`' 'insufficient permission has a capability outcome'
require_text 'silently omit the QA gate' 'workflow prohibits silently dropping the QA gate'
require_text '`--optional` is reserved for a label that project policy explicitly declares' 'optional mode requires explicit non-gating policy'

printf 'all pass\n'
