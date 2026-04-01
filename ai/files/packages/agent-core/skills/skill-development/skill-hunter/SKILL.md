---
name: skill-hunter
description: Find and download skills. Use when you need to discover existing skills from GitHub repositories and store them in the correct local skills category. Results in discovered skills being downloaded into the users dotfile repo.
---

# Skill Hunting.


## 1) Search with gh CLI

Use this regex path filter:

```bash
path:/^./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)\/skills?\/.*\.md$/
```

Example:

```bash
gh search code "zellij path:/^./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)\/skills?\/.*\.md$/" \
  --limit 20 \
  --json repository,path,url
```

## 2) Download the full skill directory (using `gh download`)

Given a result path like `.pi/skills/terminal/zellij/SKILL.md`, download the **directory** (`.pi/skills/terminal/zellij/`), not only one file.

```bash
# Install once (if needed)
# gh extension install yuler/gh-download

REPO="owner/repo"
SKILL_FILE_PATH=".pi/skills/terminal/zellij/SKILL.md"
SKILL_DIR_PATH="$(dirname "$SKILL_FILE_PATH")"

DOTFILES_ROOT="${DOTFILE_REPO_ROOT:-$(git rev-parse --show-toplevel)}"
STAGING_ROOT="${DOTFILES_ROOT}/ai/files/skills-research"
mkdir -p "$STAGING_ROOT"

# Download directory directly from GitHub without cloning full repo
gh download "$REPO" "$SKILL_DIR_PATH" --outdir "$STAGING_ROOT"

echo "Downloaded: $STAGING_ROOT/$(basename "$SKILL_DIR_PATH")"
```

## 3) Categorize and move to ${DOTFILES_ROOT}/ai/files/skills/{category}

Pick a category from existing dirs under `${DOTFILES_ROOT}/ai/files/skills/`.

```bash
DOTFILES_ROOT="${DOTFILE_REPO_ROOT:-$(git rev-parse --show-toplevel)}"
SKILLS_ROOT="${DOTFILES_ROOT}/ai/files/skills"

# Show available categories
find "$SKILLS_ROOT" -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort

# Inputs
DOWNLOADED_DIR="${DOTFILES_ROOT}/ai/files/skills-research/zellij"
SKILL_NAME="zellij"
CATEGORY="shells"   # choose from existing categories above

TARGET_DIR="${SKILLS_ROOT}/${CATEGORY}/${SKILL_NAME}"
mkdir -p "$(dirname "$TARGET_DIR")"
mv "$DOWNLOADED_DIR" "$TARGET_DIR"

echo "Stored at: $TARGET_DIR"
```

## Done Criteria

- You used `gh search code` with the regex above.
- You downloaded the **skill directory** (not just `SKILL.md`).
- You moved it to `${DOTFILES_ROOT}/ai/files/skills/{category}/{skill-name}` using an existing category.
