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
TOPIC="something interesting"
gh search code "$TOPIC path:/^./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)\/skills?\/.*\.md$/" \
  --limit 20 \
  --json repository,path,url
```

## 2) Download the full skill directory (using `gh download`)

Given a result path like `zellij/SKILL.md`, download the complete **directory** (`zellij/`) and not just the `SKILL.md`.

```bash
# Install once (if needed)
# gh extension install yuler/gh-download

REPO="owner/repo"
SKILL_FILE_PATH="zellij/SKILL.md"
SKILL_DIR_PATH="$(dirname "$SKILL_FILE_PATH")"

AGENT_BUNDLE_STORAGE_PATH_PATTERN="${AGENT_BUNDLE_STORAGE_PATH_PATTERN:?Set AGENT_BUNDLE_STORAGE_PATH_PATTERN in mise}"
BUNDLE_STORAGE_ROOT="${AGENT_BUNDLE_STORAGE_PATH_PATTERN%%\{domain\}*}"
STAGING_ROOT="$(dirname "$BUNDLE_STORAGE_ROOT")/skills-research"
mkdir -p "$STAGING_ROOT"

# Download directory directly from GitHub without cloning full repo
gh download "$REPO" "$SKILL_DIR_PATH" --outdir "$STAGING_ROOT"

echo "Downloaded: $STAGING_ROOT/$(basename "$SKILL_DIR_PATH")"
```

## 3) Determine an appropriate bundle or create a new one.

- Look at the existing bundles in `${BUNDLE_STORAGE_ROOT}` and choose a category that fits the skill you downloaded.
- If no existing category fits, use question/ask tool to present a list of existing and generated bundles to the user to select one.
  - if they select a new bundle, create a new directory under `${BUNDLE_STORAGE_ROOT}`.

## 4) Categorize and move to ${AGENT_BUNDLE_STORAGE_PATH_PATTERN}

With the chosen bundle under `${BUNDLE_STORAGE_ROOT}`, move the downloaded skill directory into the appropriate category.

```bash
AGENT_BUNDLE_STORAGE_PATH_PATTERN="${AGENT_BUNDLE_STORAGE_PATH_PATTERN:?Set AGENT_BUNDLE_STORAGE_PATH_PATTERN in mise}"
BUNDLE_STORAGE_ROOT="${AGENT_BUNDLE_STORAGE_PATH_PATTERN%%\{domain\}*}"
STAGING_ROOT="$(dirname "$BUNDLE_STORAGE_ROOT")/skills-research"

# Show available bundles
find "$BUNDLE_STORAGE_ROOT" -mindepth 1 -maxdepth 1 -type d -printf "%f\n" | sort

# Inputs
DOWNLOADED_DIR="${STAGING_ROOT}/zellij"
SKILL_NAME="zellij"
CATEGORY="shells"   # choose from existing bundles above

TARGET_DIR="${AGENT_BUNDLE_STORAGE_PATH_PATTERN/\{domain\}/$CATEGORY}${SKILL_NAME}"
mkdir -p "$(dirname "$TARGET_DIR")"
mv "$DOWNLOADED_DIR" "$TARGET_DIR"

echo "Stored at: $TARGET_DIR"
```

## Done Criteria

- You used `gh search code` with the regex above.
- You downloaded the **skill directory** (not just `SKILL.md`).
- You moved it to `${AGENT_BUNDLE_STORAGE_PATH_PATTERN}` using an existing bundle.
