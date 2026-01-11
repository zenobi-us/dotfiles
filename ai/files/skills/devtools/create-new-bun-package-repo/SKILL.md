---
name: create-new-bun-package-repo
description: Use when creating new Bun packages from zenobi-us/bun-module template - automates repo creation, cloning, and setup using GitHub CLI; note setup.sh runs non-interactively with defaults requiring manual package.json updates
---

# Create New Bun Package Repository

Expert guide for creating new Bun packages from the zenobi-us/bun-module template repository. Automates repository creation, cloning, and setup using GitHub CLI. **Important**: Setup runs with defaults (not interactive prompts).

## Overview

This skill provides a complete workflow for bootstrapping new Bun packages using the bun-module template. The template includes TypeScript configuration, testing setup, and standardized module structure. The workflow handles repository creation via GitHub CLI, cloning, and running the setup script which applies defaults automatically.

## When to Use

**Use when:**
- Creating a new Bun TypeScript package or library
- Starting a new Bun module project
- Need consistent package structure across projects
- Want automated GitHub repo setup with Bun template

**Don't use for:**
- Non-Bun projects (use appropriate template)
- Existing repositories (template is for new projects)
- Projects not requiring TypeScript or testing infrastructure

**Important Limitation**: Setup script runs non-interactively - you must manually edit `package.json` after creation to set correct name, description, and author details.

## Quick Reference

| Step | Command | Purpose |
|------|---------|---------|
| 1. Create repo | `gh repo create OWNER/NAME --template zenobi-us/bun-module --public --clone` | Create from template |
| 2. Navigate | `cd NAME` | Enter repo directory |
| 3. Setup | `bash setup.sh` | Run interactive setup |

## Complete Workflow

### Prerequisites Check

Before starting, verify:
```bash
# GitHub CLI installed and authenticated
gh auth status

# Bun installed (required for setup.sh)
bun --version
```

### Step-by-Step Process

**1. Gather Information**

Ask the user for:
- **Owner**: GitHub username or organization (e.g., `zenobi-us`)
- **Repo name**: New repository name (e.g., `my-awesome-module`)
- **Visibility**: Public or private (default: public)

**2. Create Repository from Template**

```bash
# Public repository (recommended for open source)
gh repo create OWNER/REPO-NAME \
  --template zenobi-us/bun-module \
  --public \
  --clone

# Private repository (if needed)
gh repo create OWNER/REPO-NAME \
  --template zenobi-us/bun-module \
  --private \
  --clone
```

The `--clone` flag automatically clones after creation.

**3. Navigate to Repository**

```bash
cd REPO-NAME
```

**4. Run Setup Script**

```bash
bash setup.sh
```

The setup script will:
- Apply template files to current directory
- Replace template variables with defaults
- Remove old git history and template files
- Initialize fresh git repository
- Create initial commit
- Attempt to push to remote (may fail if repo just created)

**Note**: The script runs **non-interactively** and uses these defaults:
- Package name: `my-bun-package`
- Description: `A Bun package`
- Author: `Your Name <you@example.com>`
- Repository URL: Detected from git remote (usually correct)

**You must manually edit `package.json` after setup** to correct these values.

**5. Update package.json Manually**

The setup script uses defaults, so you must edit `package.json`:
```bash
# Edit package.json - update these fields:
# - name: Change from "my-bun-package" to your actual name
# - description: Update to your package's description
# - author.name: Your actual name
# - author.email: Your actual email
```

**6. Trust mise Configuration**

```bash
# Required before running mise tasks
mise trust
```

**7. Install Dependencies and Build**

```bash
# Install dependencies
bun install

# Build the package
mise run build

# Verify build succeeded
ls -la dist/
```

**8. Commit Updates**

```bash
# Stage package.json changes
git add package.json

# Commit your customizations
git commit -m "chore: update package metadata"

# Push to remote
git push -u origin main
```

## Command Options

### GitHub CLI Repository Creation

```bash
gh repo create [<owner>/]<name> [flags]
```

**Key flags:**
- `--template OWNER/REPO`: Use repository as template
- `--public`: Create public repository (default if using template)
- `--private`: Create private repository
- `--clone`: Clone repository after creation
- `--description DESC`: Repository description
- `--homepage URL`: Repository homepage URL

**Examples:**
```bash
# Minimal - public, auto-clone
gh repo create zenobi-us/new-module \
  --template zenobi-us/bun-module \
  --public \
  --clone

# With metadata
gh repo create zenobi-us/new-module \
  --template zenobi-us/bun-module \
  --public \
  --clone \
  --description "My awesome Bun module" \
  --homepage "https://example.com"

# Organization repository
gh repo create my-org/new-module \
  --template zenobi-us/bun-module \
  --public \
  --clone
```

## Template Repository Structure

The `zenobi-us/bun-module` template provides:

- **TypeScript configuration**: Preconfigured `tsconfig.json`
- **Mise integration**: Task runner with build, test, format tasks
- **Testing**: Vitest test infrastructure
- **Package configuration**: Starter `package.json` with defaults
- **Build tooling**: Bundling with Bun's bundler
- **Release automation**: Release Please configuration for automated releases
- **Documentation**: README template, AGENTS.md, RELEASE.md
- **Linting**: ESLint and Prettier configured
- **GitHub Actions**: CI/CD workflows preconfigured

## Setup Script Behavior

The `setup.sh` script runs **non-interactively** with these defaults:

| Field | Default Value | Where to Update |
|-------|---------------|-----------------|
| Package name | `my-bun-package` | `package.json` → `name` |
| Description | `A Bun package` | `package.json` → `description` |
| Author name | `Your Name` | `package.json` → `author.name` |
| Author email | `you@example.com` | `package.json` → `author.email` |
| Repository URL | Auto-detected from git remote | Usually correct, verify in `package.json` → `repository.url` |
| GitHub org | `username` | Not stored, used during setup only |

**After running setup.sh, you MUST manually edit `package.json`** to update these values to your actual project details.

## Common Workflows

### Creating a Bun Package

```bash
# 1. Create repository from template
gh repo create zenobi-us/my-bun-package \
  --template zenobi-us/bun-module \
  --public \
  --clone \
  --description "My awesome Bun package"

# 2. Navigate to directory
cd my-bun-package

# 3. Run setup (applies defaults)
bash setup.sh

# 4. Edit package.json manually
# Update: name, description, author.name, author.email

# 5. Trust mise and build
mise trust
bun install
mise run build

# 6. Commit and push
git add package.json
git commit -m "chore: update package metadata"
git push -u origin main
```

### Organization Package

```bash
# Create under organization
gh repo create my-org/shared-package \
  --template zenobi-us/bun-module \
  --public \
  --clone \
  --description "Shared Bun package for organization"

cd shared-package
bash setup.sh

# Edit package.json with org-scoped name:
# name: "@my-org/shared-package"
# ...

mise trust
bun install
mise run build
git add package.json
git commit -m "chore: update package metadata"
git push -u origin main
```

### Private Package

```bash
# Create private repository
gh repo create zenobi-us/internal-package \
  --template zenobi-us/bun-module \
  --private \
  --clone \
  --description "Internal Bun package"

cd internal-package
bash setup.sh

# Edit package.json as needed
# ...

mise trust
bun install
mise run build
git add package.json
git commit -m "chore: update package metadata"
git push -u origin main
```

## Troubleshooting

### Template Repository Not Marked as Template

**Problem:** `Could not clone: zenobi-us/bun-module is not a template repository`

**Solution:**
```bash
# Mark repository as template
gh repo edit zenobi-us/bun-module --template

# Verify it's now a template
gh repo view zenobi-us/bun-module --json isTemplate
```

### GitHub CLI Authentication

**Problem:** `gh: Not authenticated`

**Solution:**
```bash
# Authenticate with GitHub
gh auth login

# Verify authentication
gh auth status
```

### Template Not Found

**Problem:** `repository not found: zenobi-us/bun-module`

**Solution:**
- Verify template repository exists and is accessible
- Check spelling of owner/repo
- Ensure template repository is public or you have access

### Setup Script Fails

**Problem:** `setup.sh: command not found` or script errors

**Solution:**
```bash
# Verify file exists
ls -la setup.sh

# Make executable if needed
chmod +x setup.sh

# Run with bash explicitly
bash setup.sh

# Check Bun is installed
bun --version
```

### Mise Trust Required

**Problem:** `Config files in [...] are not trusted`

**Solution:**
```bash
# Trust the mise configuration
mise trust

# Now run mise tasks
mise run build
```

### Clone Directory Exists

**Problem:** `destination path 'repo-name' already exists`

**Solution:**
```bash
# Choose different name or remove existing directory
rm -rf repo-name

# Or use --clone flag without specifying directory
gh repo create owner/repo-name --template ... --clone
```

### Build Fails After Setup

**Problem:** Build fails or dependencies missing

**Solution:**
```bash
# Ensure dependencies are installed
bun install

# Trust mise config if not done
mise trust

# Try build again
mise run build

# Check for specific errors
mise run build --verbose
```

## Post-Setup Next Steps

After successful setup and package.json updates:

1. **Verify package.json**: Ensure all fields are correct
   ```bash
   cat package.json | jq '.name, .description, .author'
   ```

2. **Install dependencies**: 
   ```bash
   bun install
   ```

3. **Trust mise and build**: 
   ```bash
   mise trust
   mise run build
   ```

4. **Verify build output**:
   ```bash
   ls -la dist/
   # Should see: index.js, index.d.ts
   ```

5. **Run tests** (if any exist):
   ```bash
   mise run test
   ```

6. **Commit customizations**:
   ```bash
   git add package.json
   git commit -m "chore: update package metadata"
   git push origin main
   ```

7. **Update README**: Replace template content with actual documentation

8. **Update AGENTS.md**: Document how AI agents should interact with your package

9. **Configure CI/CD**: Review and customize GitHub Actions workflows in `.github/workflows/`

10. **Start development**: Begin implementing your package in `src/`

## Integration with Other Tools

### With mise

```bash
# Pin Bun version in project
mise use bun@latest

# Add to mise.toml tasks
[tasks]
setup = "bash setup.sh"
test = "bun test"
build = "bun run build"
```

### With Git Workflows

```bash
# Create feature branch immediately
git checkout -b feat/initial-implementation

# Set up pre-commit hooks
bun add -D husky lint-staged
```

### With Package Managers

The template works with:
- **Bun** (primary): `bun install`, `bun add`
- **npm** (compatible): `npm install` works but Bun recommended
- **pnpm** (compatible): `pnpm install` works as fallback

## Best Practices

1. **Mark template repo once**: Use `gh repo edit --template` on first use
2. **Use descriptive repo names**: Choose names that clearly indicate purpose
3. **Scope package names**: Use `@scope/name` for clarity and namespace ownership
4. **Update package.json immediately**: Don't forget to edit after setup.sh runs
5. **Trust mise before building**: Required for running mise tasks
6. **Commit metadata updates separately**: Keep setup commit and metadata commit separate
7. **Test immediately after setup**: Verify `mise run build` passes
8. **Update documentation early**: Replace template placeholders with real content
9. **Configure visibility intentionally**: Public for open source, private for internal
10. **Review generated files**: Ensure AGENTS.md, README.md, and workflows fit your needs

## Known Limitations

1. **Non-interactive setup**: The setup.sh script doesn't prompt for input; it uses defaults that you must manually update in package.json afterward
2. **Manual package.json editing required**: You must edit name, description, and author fields after running setup.sh
3. **No validation**: The script doesn't validate your manual edits to package.json
4. **Mise trust required**: You must explicitly trust the mise configuration before running tasks

## Quick Start Summary

The complete workflow in commands:

```bash
# 1. Ensure template repo is marked as template (one-time setup)
gh repo edit zenobi-us/bun-module --template

# 2. Create and clone from template
gh repo create OWNER/NAME \
  --template zenobi-us/bun-module \
  --public \
  --clone \
  --description "Your plugin description"

# 3. Enter directory
cd NAME

# 4. Run setup (uses defaults)
bash setup.sh

# 5. Edit package.json manually - UPDATE THESE:
#    - name: "my-bun-package" → "@owner/actual-name"
#    - description: "A Bun package" → "Your description"
#    - author.name: "Your Name" → Your actual name
#    - author.email: "you@example.com" → Your actual email

# 6. Trust mise, install, and build
mise trust
bun install
mise run build

# 7. Commit updates and push
git add package.json
git commit -m "chore: update package metadata"
git push -u origin main
```

**Critical**: Steps 5-7 are REQUIRED because setup.sh uses placeholder values.
