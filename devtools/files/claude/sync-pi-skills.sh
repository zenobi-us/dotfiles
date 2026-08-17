#!/usr/bin/env bash
# Symlinks every pi-coding-agent skill (devtools/files/agent/bundles/**/SKILL.md)
# into ~/.claude/skills/<name>, so Claude Code can use the same skills without
# any file being duplicated or copied. Safe to re-run: only ever touches
# symlinks whose target resolves back into this dotfiles repo.
set -euo pipefail

DOTFILES_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
BUNDLES_DIR="$DOTFILES_ROOT/devtools/files/agent/bundles"
SKILLS_DIR="$HOME/.claude/skills"

mkdir -p "$SKILLS_DIR"

# Drop symlinks we previously created whose source has since disappeared
# (e.g. a skill was removed or renamed upstream).
for link in "$SKILLS_DIR"/*; do
  [ -L "$link" ] || continue
  target="$(readlink "$link")"
  case "$target" in
    "$DOTFILES_ROOT"/*) [ -e "$target" ] || rm "$link" ;;
  esac
done

declare -A claimed_by=()

while IFS= read -r -d '' skill_md; do
  skill_dir="$(dirname "$skill_md")"
  name="$(sed -n "s/^name:[[:space:]]*//p" "$skill_md" | head -n1 | tr -d '"'"'"'')"

  if [ -z "$name" ]; then
    echo "warn: no 'name:' frontmatter in $skill_md, skipping" >&2
    continue
  fi

  if [ -n "${claimed_by[$name]:-}" ] && [ "${claimed_by[$name]}" != "$skill_dir" ]; then
    echo "error: skill name '$name' claimed by both:" >&2
    echo "  ${claimed_by[$name]}" >&2
    echo "  $skill_dir" >&2
    exit 1
  fi
  claimed_by[$name]="$skill_dir"

  dest="$SKILLS_DIR/$name"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    echo "warn: $dest exists and isn't a managed symlink, skipping $skill_dir" >&2
    continue
  fi
  if [ -L "$dest" ]; then
    [ "$(readlink "$dest")" = "$skill_dir" ] && continue
    rm "$dest"
  fi
  ln -s "$skill_dir" "$dest"
  echo "linked $name -> $skill_dir"
done < <(find "$BUNDLES_DIR" -type f -iname "SKILL.md" -path "*/skills/*" -not -path "*/node_modules/*" -print0)
