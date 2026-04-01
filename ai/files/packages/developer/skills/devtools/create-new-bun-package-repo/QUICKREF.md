# Create New Bun Package Repository - Quick Reference

## One-Time Setup

```bash
# Mark your template repository as a template (only needed once)
gh repo edit zenobi-us/bun-module --template
```

## Create New Bun Package

```bash
# 1. Create from template
gh repo create OWNER/NAME \
  --template zenobi-us/bun-module \
  --public \
  --clone \
  --description "Your description"

# 2. Navigate and setup
cd NAME
bash setup.sh

# 3. ⚠️ EDIT package.json manually - change these:
#    - name: "@owner/actual-name"
#    - description: "Your real description"
#    - author.name: "Your Real Name"
#    - author.email: "your@email.com"

# 4. Build and commit
mise trust
bun install
mise run build
git add package.json
git commit -m "chore: update package metadata"
git push -u origin main
```

## Common Commands

```bash
# Trust mise config
mise trust

# Install dependencies
bun install

# Build
mise run build

# Run tests
mise run test

# Format code
mise run format

# Lint code
mise run lint
```

## Default Values to Replace

| Field | Default | Location |
|-------|---------|----------|
| name | `my-bun-package` | package.json |
| description | `A Bun package` | package.json |
| author.name | `Your Name` | package.json |
| author.email | `you@example.com` | package.json |

## Troubleshooting

```bash
# Template not found
gh repo edit zenobi-us/bun-module --template

# Mise trust error
mise trust

# Build fails
bun install
mise run build --verbose
```

## What Gets Created

```
├── src/              # Your package code
├── dist/             # Built output (after build)
├── .github/          # CI/CD workflows
├── mise.toml         # Task definitions
├── package.json      # ⚠️ EDIT THIS
├── tsconfig.json     # TypeScript config
├── README.md         # Documentation template
└── AGENTS.md         # AI agent instructions
```
