---
name: skill-hunter
description: Use when you need to discover existing skills from GitHub repositories.
---

# Skill Hunter

**Use when:** You need to discover existing skills from GitHub repositories that use AI agent frameworks (pi, cursor, opencode, etc.) - searches across multiple agent directories to find reusable skill patterns, implementations, and best practices.

## Core Capability

Search GitHub for skills in AI agent repositories using path-based search to discover:

- Skill implementations from other projects
- Common patterns and approaches
- Reusable skill definitions
- Best practices from the community

## Prerequisites

- `gh` CLI installed and authenticated
- `jq` for JSON processing
- `$DOTFILES_REPO_ROOT` environment variable set (or will auto-detect)
- Skills stored in `$DOTFILES_REPO_ROOT/ai/files/skills/`

## GitHub Search Syntax

The core search pattern targets skill directories in AI agent repos:

```bash
path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/
```

This pattern finds files in paths like:

- `.pi/skills/`
- `.ai/skills/`
- `.opencode/skill/`
- `pi/skills/`
- `agents/skills/`
- `cursor/skills/`
- `factory/skill/`

## Implementation Pattern

### 1. Basic Skill Search

Search for all skills matching a keyword:

```bash
# Search for skills related to "testing"
gh search code "testing path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20

# Search for zellij skills
gh search code "zellij path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20
```

### 2. Find Skills by File Type

Search for specific file types (e.g., all SKILL.md files):

```bash
# Find SKILL.md files
gh search code "SKILL.md path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 50

# Find skill implementations in TypeScript
gh search code "extension:ts path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20

# Find shell script skills
gh search code "extension:sh path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20
```

### 3. Language-Specific Skills

```bash
# Find Python skills
gh search code "language:python path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20

# Find JavaScript/TypeScript skills
gh search code "language:typescript path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20

# Find Rust skills
gh search code "language:rust path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20
```

### 4. Find Skills by Domain

```bash
# Database skills
gh search code "database OR postgres OR mysql path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20

# DevOps skills
gh search code "docker OR kubernetes OR terraform path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20

# Web development skills
gh search code "react OR vue OR angular path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20

# Testing skills
gh search code "playwright OR selenium OR jest path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 20
```

### 5. Discover Popular Repositories

Find repos with the most skills:

```bash
# Search and group by repository
gh search code "path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" --limit 100 --json repository,path | \
  jq -r '.[] | .repository.fullName' | sort | uniq -c | sort -rn | head -10
```

### 6. Download and Inspect Skills

Once you find an interesting skill:

```bash
# View a specific file directly
gh browse <owner>/<repo> --branch main <path-to-skill-file>

# Clone the entire repository
gh repo clone <owner>/<repo>

# Download a specific file
gh api repos/<owner>/<repo>/contents/<path-to-skill-file> \
  --jq '.content' | base64 -d > downloaded-skill.md
```

## Complete Workflow Example

### Scenario: Finding and Adapting a Zellij Skill

```bash
# 1. Search for zellij skills
echo "Searching for zellij skills..."
gh search code "zellij path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20 \
  --json repository,path,url

# 2. Search more broadly for terminal multiplexer skills
echo "Searching for terminal/tmux/multiplexer skills..."
gh search code "tmux OR terminal OR multiplexer path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20 \
  --json repository,path,url

# 3. Examine a promising result
REPO="username/repo-name"
SKILL_PATH=".pi/skills/terminal-management/SKILL.md"

gh api "repos/${REPO}/contents/${SKILL_PATH}" \
  --jq '.content' | base64 -d | less

# 4. Download for adaptation
gh api "repos/${REPO}/contents/${SKILL_PATH}" \
  --jq '.content' | base64 -d > /tmp/reference-skill.md

echo "Downloaded to /tmp/reference-skill.md for review"
```

## Advanced Search Patterns

### Find Recently Updated Skills

```bash
# Skills updated in the last month
gh search code "path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/ pushed:>$(date -d '1 month ago' +%Y-%m-%d)" \
  --limit 30
```

### Find Skills by Star Count

```bash
# Skills from popular repositories (>100 stars)
gh search code "path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/ stars:>100" \
  --limit 30
```

### Find Skills with Specific Patterns

```bash
# Skills that use subagents
gh search code "subagent path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20

# Skills that use MCP (Model Context Protocol)
gh search code "MCP OR 'Model Context Protocol' path:/./.?.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20

# Skills with tool implementations
gh search code "tool OR function_call path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20
```

## Output Processing

### Extract and Format Results

```bash
# Get a clean list of repositories with skills
gh search code "path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 100 \
  --json repository | \
  jq -r '.[].repository | "\(.fullName) - \(.description // "No description")"' | \
  sort -u

# Create a markdown report of found skills
gh search code "SKILL.md path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 50 \
  --json repository,path,url | \
  jq -r '.[] | "- [\(.repository.fullName)](\(.repository.url)) - [\(.path)](\(.url))"' > skills-report.md
```

## Common Use Cases

### 1. Before Writing a New Skill

```bash
# Check if someone already solved this problem
SKILL_TOPIC="docker"
gh search code "${SKILL_TOPIC} path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20 \
  --json repository,path,url | \
  jq -r '.[] | "[\(.repository.fullName)] \(.path)\n  \(.url)\n"'
```

### 2. Finding Best Practices

```bash
# Find skills with comprehensive documentation
gh search code "## Prerequisites OR ## Requirements OR ## Installation path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 30
```

### 3. Discovering Skill Patterns

```bash
# Find skills that use specific frameworks
gh search code "playwright OR puppeteer OR selenium path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20
```

## Integration with Dotfiles

### Save Discovered Skills for Reference

Skills should be stored in your Dotfiles repo under `ai/files/skills/`. When discovering skills, save them to a research directory first:

```bash
# Use dotfiles environment variable (fallback to detection if not set)
DOTFILES_ROOT="${DOTFILES_REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || echo "${HOME}/Projects/dotfiles")}"
SKILLS_ROOT="${DOTFILES_ROOT}/ai/files/skills"
RESEARCH_DIR="${DOTFILES_ROOT}/ai/files/skills-research"

# Create a skills research directory
mkdir -p "${RESEARCH_DIR}"

# Download and categorize interesting skills
CATEGORY="terminal-management"
mkdir -p "${RESEARCH_DIR}/${CATEGORY}"

# Save search results
gh search code "tmux OR zellij OR screen path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 30 \
  --json repository,path,url > "${RESEARCH_DIR}/${CATEGORY}/search-results.json"

# Extract and download top results
jq -r '.[] | "\(.repository.fullName)|\(.path)|\(.url)"' \
  "${RESEARCH_DIR}/${CATEGORY}/search-results.json" | \
  head -5 | \
  while IFS='|' read repo path url; do
    echo "Downloading: ${repo} - ${path}"
    gh api "repos/${repo}/contents/${path}" --jq '.content' | base64 -d > \
      "${RESEARCH_DIR}/${CATEGORY}/$(echo ${repo} | tr '/' '-')-$(basename ${path})"
  done
```

### Suggest Storage Location

After downloading and reviewing a skill, suggest appropriate locations within `ai/files/skills/`:

```bash
# Function to suggest skill locations
suggest_skill_location() {
  local skill_name="$1"
  local skill_content="$2"
  
  echo "📂 Where should '${skill_name}' be stored in ai/files/skills/?"
  echo ""
  
  # Analyze content to suggest locations
  if grep -qi "github\|gh cli\|pull request\|pr\|issue" "${skill_content}"; then
    echo "1. ai/files/skills/github/${skill_name}/"
    echo "   ✓ GitHub-related functionality"
  fi
  
  if grep -qi "test\|playwright\|selenium\|cypress" "${skill_content}"; then
    echo "2. ai/files/skills/devtools/${skill_name}/"
    echo "   ✓ Development and testing tools"
  fi
  
  if grep -qi "project\|task\|planning\|tracking" "${skill_content}"; then
    echo "3. ai/files/skills/projectmanagement/${skill_name}/"
    echo "   ✓ Project management and workflow"
  fi
  
  if grep -qi "design\|ui\|ux\|figma" "${skill_content}"; then
    echo "4. ai/files/skills/design/${skill_name}/"
    echo "   ✓ Design-related skills"
  fi
  
  if grep -qi "research\|search\|discover" "${skill_content}"; then
    echo "5. ai/files/skills/research/${skill_name}/"
    echo "   ✓ Research and discovery"
  fi
  
  echo ""
  echo "Choose a number (1-5), or provide your own path:"
  echo "Example: ai/files/skills/custom-category/${skill_name}/"
}

# Usage example
SKILL_FILE="${RESEARCH_DIR}/terminal-management/example-skill.md"
SKILL_NAME="zellij-manager"

suggest_skill_location "${SKILL_NAME}" "${SKILL_FILE}"
read -r location_choice

case $location_choice in
  1) TARGET_DIR="${SKILLS_ROOT}/github/${SKILL_NAME}" ;;
  2) TARGET_DIR="${SKILLS_ROOT}/devtools/${SKILL_NAME}" ;;
  3) TARGET_DIR="${SKILLS_ROOT}/projectmanagement/${SKILL_NAME}" ;;
  4) TARGET_DIR="${SKILLS_ROOT}/design/${SKILL_NAME}" ;;
  5) TARGET_DIR="${SKILLS_ROOT}/research/${SKILL_NAME}" ;;
  *) 
    # User provided custom path
    if [[ "$location_choice" =~ ^ai/files/skills/ ]]; then
      TARGET_DIR="${DOTFILES_ROOT}/${location_choice}"
    else
      TARGET_DIR="${SKILLS_ROOT}/${location_choice}"
    fi
    ;;
esac

# Create target directory and move skill
mkdir -p "${TARGET_DIR}"
cp "${SKILL_FILE}" "${TARGET_DIR}/SKILL.md"
echo "✅ Skill moved to: ${TARGET_DIR}"
```

## Tips and Tricks

### 1. Fuzzy Matching with Wildcards

The regex in the path already handles variations like `skill` vs `skills` with the `?` quantifier.

### 2. Combine with Other Search Terms

```bash
# Find skills that mention specific tools
gh search code "gh cli OR 'github cli' path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 20
```

### 3. Language-Specific Searches

```bash
# Find skills written in specific languages with content search
gh search code "language:markdown 'use when' path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 30
```

### 4. Exclude Certain Repos

```bash
# Search but exclude your own repos
gh search code "path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/ -user:yourusername" \
  --limit 30
```

## Error Handling

```bash
# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    echo "Install with: brew install gh (macOS) or apt install gh (Linux)"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "Error: Not authenticated with GitHub"
    echo "Run: gh auth login"
    exit 1
fi

# Handle rate limiting
gh search code "path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 30 || {
    echo "Error: GitHub API rate limit exceeded"
    echo "Check status: gh api rate_limit"
    exit 1
}
```

## Best Practices

1. **Start Broad, Then Narrow**: Begin with general searches, then refine based on results
2. **Check Multiple Frameworks**: Skills from cursor might work in pi and vice versa
3. **Look for Patterns**: Similar problems often have similar solutions across repos
4. **Respect Licenses**: Check repository licenses before adapting code
5. **Credit Sources**: When adapting skills, note the original source
6. **Update Your Own Skills**: Share back improved versions to help others

## Example: Complete Skill Discovery Session

```bash
#!/bin/bash
# skill-discovery.sh - Discover and analyze skills for a specific topic

TOPIC="${1:-testing}"

# Use dotfiles environment variable
DOTFILES_ROOT="${DOTFILES_REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || echo "${HOME}/Projects/dotfiles")}"
SKILLS_ROOT="${DOTFILES_ROOT}/ai/files/skills"
RESEARCH_DIR="${DOTFILES_ROOT}/ai/files/skills-research"
OUTPUT_DIR="${RESEARCH_DIR}/${TOPIC}"

mkdir -p "${OUTPUT_DIR}"

echo "🔍 Discovering skills related to: ${TOPIC}"
echo "📍 Dotfiles: ${DOTFILES_ROOT}"
echo "📂 Research output: ${OUTPUT_DIR}"
echo ""

# 1. Initial search
echo "Step 1: Searching GitHub..."
gh search code "${TOPIC} path:/./.?(opencode|ai|llm|claude|codex|agents|pi|cursor|factory)/skills?/" \
  --limit 50 \
  --json repository,path,url \
  > "${OUTPUT_DIR}/search-results.json"

RESULT_COUNT=$(jq length "${OUTPUT_DIR}/search-results.json")
echo "Found ${RESULT_COUNT} results"

# 2. Analyze repositories
echo "Step 2: Analyzing repositories..."
jq -r '.[].repository.fullName' "${OUTPUT_DIR}/search-results.json" | \
  sort | uniq -c | sort -rn | \
  head -10 > "${OUTPUT_DIR}/top-repos.txt"

echo "Top repositories with ${TOPIC} skills:"
cat "${OUTPUT_DIR}/top-repos.txt"

# 3. Download top 3 skill files
echo "Step 3: Downloading sample skills..."
jq -r '.[0:3] | .[] | "\(.repository.fullName)|\(.path)"' \
  "${OUTPUT_DIR}/search-results.json" | \
  while IFS='|' read repo path; do
    filename=$(echo "${repo}-${path}" | tr '/' '-')
    echo "  Downloading: ${repo}/${path}"
    gh api "repos/${repo}/contents/${path}" \
      --jq '.content' | base64 -d \
      > "${OUTPUT_DIR}/${filename}" 2>/dev/null || \
      echo "    Failed to download"
  done

# 4. Create summary report
echo "Step 4: Creating summary report..."
cat > "${OUTPUT_DIR}/DISCOVERY-REPORT.md" << EOF
# Skill Discovery Report: ${TOPIC}

**Date**: $(date)
**Total Results**: ${RESULT_COUNT}
**Dotfiles Root**: ${DOTFILES_ROOT}

## Top Repositories

\`\`\`
$(cat "${OUTPUT_DIR}/top-repos.txt")
\`\`\`

## All Results

$(jq -r '.[] | "- [\(.repository.fullName)](\(.repository.url)) - [\(.path)](\(.url))"' \
  "${OUTPUT_DIR}/search-results.json")

## Storage Locations

Review downloaded skills and determine appropriate location in:

\`\`\`
${SKILLS_ROOT}/
├── github/          # GitHub-related functionality
├── devtools/        # Development and testing tools
├── projectmanagement/  # Project and task management
├── design/          # Design and UI/UX tools
├── research/        # Research and discovery
├── superpowers/     # Advanced meta-skills
├── experts/         # Domain expert personas
└── [custom]/        # Your custom categories
\`\`\`

## Next Steps

1. Review downloaded skill files in: ${OUTPUT_DIR}
2. Identify common patterns and best practices
3. Choose appropriate location in ai/files/skills/
4. Adapt for your use case
5. Consider contributing improvements back

## Move to Skills Directory

\`\`\`bash
# Example: Move adapted skill to appropriate location
SKILL_NAME="my-new-skill"

# Option 1: GitHub-related
mkdir -p "${SKILLS_ROOT}/github/\${SKILL_NAME}"
cp adapted-skill.md "${SKILLS_ROOT}/github/\${SKILL_NAME}/SKILL.md"

# Option 2: DevTools
mkdir -p "${SKILLS_ROOT}/devtools/\${SKILL_NAME}"
cp adapted-skill.md "${SKILLS_ROOT}/devtools/\${SKILL_NAME}/SKILL.md"

# Option 3: Custom location
mkdir -p "${SKILLS_ROOT}/custom-category/\${SKILL_NAME}"
cp adapted-skill.md "${SKILLS_ROOT}/custom-category/\${SKILL_NAME}/SKILL.md"
\`\`\`

EOF

echo "✅ Discovery complete! Report saved to: ${OUTPUT_DIR}/DISCOVERY-REPORT.md"
echo ""
echo "Next: Review skills and move to ${SKILLS_ROOT}/"
```

## Skill Storage Workflow

After discovering and adapting a skill, follow this workflow:

### 1. Analyze Skill Content

Review the skill to determine its primary purpose:

```bash
SKILL_FILE="downloaded-skill.md"

echo "Analyzing skill content..."
echo ""
echo "Contains GitHub functionality:" $(grep -qi "github\|gh cli" "$SKILL_FILE" && echo "✓ Yes" || echo "✗ No")
echo "Contains testing tools:" $(grep -qi "test\|playwright\|selenium" "$SKILL_FILE" && echo "✓ Yes" || echo "✗ No")
echo "Contains project management:" $(grep -qi "project\|task\|planning" "$SKILL_FILE" && echo "✓ Yes" || echo "✗ No")
echo "Contains design tools:" $(grep -qi "design\|ui\|figma" "$SKILL_FILE" && echo "✓ Yes" || echo "✗ No")
echo "Contains research tools:" $(grep -qi "research\|search\|discover" "$SKILL_FILE" && echo "✓ Yes" || echo "✗ No")
```

### 2. Present Storage Options

Present 1-3 suggested locations based on content analysis:

```
📂 Where should this skill be stored in ai/files/skills/?

Suggested locations:

1. ai/files/skills/github/skill-name/
   ✓ Contains GitHub API usage
   ✓ Uses gh CLI extensively

2. ai/files/skills/research/skill-name/
   ✓ Primary purpose is discovery/research
   ✓ Searches external sources

3. ai/files/skills/devtools/skill-name/
   ✓ Developer tooling functionality
   ✓ Enhances development workflow

Choose a number (1-3), or provide your own path:
Example: ai/files/skills/custom-category/skill-name/
```

### 3. Interactive Selection Script

```bash
#!/bin/bash
# store-skill.sh - Interactive skill storage helper

SKILL_FILE="$1"
SKILL_NAME="$2"

if [[ -z "$SKILL_FILE" || -z "$SKILL_NAME" ]]; then
  echo "Usage: $0 <skill-file> <skill-name>"
  exit 1
fi

# Use dotfiles environment variable
DOTFILES_ROOT="${DOTFILES_REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || echo "${HOME}/Projects/dotfiles")}"
SKILLS_ROOT="${DOTFILES_ROOT}/ai/files/skills"

# Analyze content
echo "🔍 Analyzing skill content..."
echo ""

SUGGESTIONS=()
COUNT=1

if grep -qi "github\|gh cli\|pull request\|issue" "$SKILL_FILE"; then
  SUGGESTIONS+=("${COUNT}:github:GitHub-related functionality")
  echo "${COUNT}. ai/files/skills/github/${SKILL_NAME}/"
  echo "   ✓ GitHub-related functionality"
  echo ""
  ((COUNT++))
fi

if grep -qi "test\|playwright\|selenium\|cypress\|jest" "$SKILL_FILE"; then
  SUGGESTIONS+=("${COUNT}:devtools:Testing and development tools")
  echo "${COUNT}. ai/files/skills/devtools/${SKILL_NAME}/"
  echo "   ✓ Testing and development tools"
  echo ""
  ((COUNT++))
fi

if grep -qi "project\|task\|planning\|tracking\|workflow" "$SKILL_FILE"; then
  SUGGESTIONS+=("${COUNT}:projectmanagement:Project management")
  echo "${COUNT}. ai/files/skills/projectmanagement/${SKILL_NAME}/"
  echo "   ✓ Project management and workflow"
  echo ""
  ((COUNT++))
fi

if grep -qi "design\|ui\|ux\|figma\|sketch" "$SKILL_FILE"; then
  SUGGESTIONS+=("${COUNT}:design:Design tools")
  echo "${COUNT}. ai/files/skills/design/${SKILL_NAME}/"
  echo "   ✓ Design and UI/UX tools"
  echo ""
  ((COUNT++))
fi

if grep -qi "research\|search\|discover\|analyze" "$SKILL_FILE"; then
  SUGGESTIONS+=("${COUNT}:research:Research and discovery")
  echo "${COUNT}. ai/files/skills/research/${SKILL_NAME}/"
  echo "   ✓ Research and discovery"
  echo ""
  ((COUNT++))
fi

# If no suggestions, show common categories
if [[ ${#SUGGESTIONS[@]} -eq 0 ]]; then
  echo "No specific category detected. Common options:"
  echo ""
  echo "1. ai/files/skills/devtools/${SKILL_NAME}/"
  echo "2. ai/files/skills/superpowers/${SKILL_NAME}/"
  echo "3. ai/files/skills/experts/${SKILL_NAME}/"
  echo ""
fi

echo "Choose a number, or provide your own path:"
echo "Example: ai/files/skills/my-category/${SKILL_NAME}/"
echo ""
read -r -p "Selection: " choice

# Process choice
TARGET_DIR=""
if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -le "${#SUGGESTIONS[@]}" ]]; then
  # Numbered choice
  CATEGORY=$(echo "${SUGGESTIONS[$((choice-1))]}" | cut -d: -f2)
  TARGET_DIR="${SKILLS_ROOT}/${CATEGORY}/${SKILL_NAME}"
elif [[ "$choice" =~ ^ai/files/skills/ ]]; then
  # Full path provided
  TARGET_DIR="${DOTFILES_ROOT}/${choice}"
else
  # Relative path assumed
  TARGET_DIR="${SKILLS_ROOT}/${choice}"
fi

# Create and copy
mkdir -p "${TARGET_DIR}"
cp "${SKILL_FILE}" "${TARGET_DIR}/SKILL.md"

echo ""
echo "✅ Skill stored at: ${TARGET_DIR}/SKILL.md"
echo ""
echo "Next steps:"
echo "1. Review and edit: ${TARGET_DIR}/SKILL.md"
echo "2. Add frontmatter if needed (name, description)"
echo "3. Commit to dotfiles repo"
```

### 4. Commit to Dotfiles

After storing the skill:

```bash
cd "${DOTFILES_ROOT}"
git add "ai/files/skills/${CATEGORY}/${SKILL_NAME}/"
git commit -m "feat(skills): add ${SKILL_NAME} skill

Discovered from GitHub search, adapted for local use.
Stored in ${CATEGORY} category."
git push
```

## See Also

- **github**: Core GitHub CLI skill
- **writing-skills**: Creating and editing skills
- **superpowers/brainstorming**: Design before implementation
