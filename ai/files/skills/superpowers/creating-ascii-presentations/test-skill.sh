#!/usr/bin/env bash
set -euo pipefail

base=".pi/skills/presenterm"

fail() { echo "FAIL: $1"; exit 1; }
pass() { echo "PASS: $1"; }
assert_has() {
  local file="$1" pattern="$2" msg="$3"
  grep -q "$pattern" "$file" || fail "$msg"
}

[ -f "$base/SKILL.md" ] || fail "SKILL.md missing"

assert_has "$base/SKILL.md" "references/overview.md" "SKILL.md missing overview reference"
assert_has "$base/SKILL.md" "references/slides-syntax.md" "SKILL.md missing syntax reference"
assert_has "$base/SKILL.md" "references/workflow.md" "SKILL.md missing workflow reference"
assert_has "$base/SKILL.md" "references/starter-template.md" "SKILL.md missing starter template reference"

[ -f "$base/references/overview.md" ] || fail "overview.md missing"
[ -f "$base/references/slides-syntax.md" ] || fail "slides-syntax.md missing"
[ -f "$base/references/workflow.md" ] || fail "workflow.md missing"
[ -f "$base/references/starter-template.md" ] || fail "starter-template.md missing"

assert_has "$base/references/overview.md" "mfontanini/presenterm" "overview.md missing upstream repo"
assert_has "$base/references/overview.md" "mfontanini.github.io/presenterm" "overview.md missing docs site"

assert_has "$base/references/slides-syntax.md" "examples/demo.md" "slides-syntax.md missing demo reference"
assert_has "$base/references/slides-syntax.md" "speaker-notes.md" "slides-syntax.md missing speaker notes reference"

assert_has "$base/references/workflow.md" "Quality checks" "workflow.md missing quality checks section"
assert_has "$base/references/workflow.md" "Run local Presenterm rendering" "workflow.md missing render step"

assert_has "$base/references/starter-template.md" "# " "starter-template.md missing title"
assert_has "$base/references/starter-template.md" "<!--" "starter-template.md missing guidance comments"
assert_has "$base/references/starter-template.md" "Speaker notes" "starter-template.md missing speaker notes guidance"

pass "presenterm skill wrapper, references, and content checks are valid"