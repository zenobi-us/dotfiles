---
name: writing-mise-file-tasks
description: Use when creating complex mise tasks that require arguments, dependencies, or monorepo support. specialized guide for writing standalone task scripts (file tasks) with metadata and usage specs.
---

# Mise File Tasks

## Overview
Mise file tasks are standalone scripts (bash, node, python, etc.) located in `mise-tasks/` or `.mise/tasks/` that behave like full CLI commands. They support argument parsing, help generation, and dependency management via special comment directives.

## When to Use
- **Complex Logic**: When a task is too long for a single line in `mise.toml`.
- **Arguments**: When you need flags (`--force`), options (`--env prod`), or positional arguments.
- **Monorepo**: When organizing tasks across multiple projects (`//frontend:build`).
- **Polyglot**: When you want to write tasks in Node, Python, or Ruby instead of Bash.

## Core Pattern

### 1. File Location
Place scripts in:
- `./mise-tasks/` (Recommended)
- `./.mise/tasks/`
- Any directory configured in `mise.toml` under `[tasks]`

### 2. File Header (Directives)
Use comments to define metadata. The syntax adapts to the language (e.g., `#` for Bash/Python, `//` for JS).

```bash
#!/usr/bin/env bash
#MISE description="Deploy application to environment"
#MISE depends=["build", "lint"]
#MISE dir="{{cwd}}" 
#MISE env={NODE_ENV="production"}

#USAGE flag "-f --force" help="Skip safety checks"
#USAGE option "-e --env <env>" help="Target environment" default="dev"
#USAGE arg "<version>" help="Version tag to deploy"
```

## Argument Parsing (Usage Spec)
Mise uses [usage](https://usage.jdx.dev) to parse arguments. Variables are injected into the script environment prefixed with `usage_`.

| Directive | Example | Env Variable |
|-----------|---------|--------------|
| **Flag** | `#USAGE flag "--dry-run"` | `usage_dry_run` ("true"/"false") |
| **Option** | `#USAGE option "--port <port>"` | `usage_port` |
| **Arg** | `#USAGE arg "<target>"` | `usage_target` |

**Bash Example:**
```bash
if [ "${usage_force:-false}" = "true" ]; then ... fi
echo "Deploying to ${usage_env}"
```

**Node.js Example:**
```javascript
const { usage_force, usage_env } = process.env;
```

## Monorepo Tasks (Experimental)
Enable in root `mise.toml`:
```toml
experimental_monorepo_root = true
```

### Addressing Tasks
- **Absolute**: `mise run //packages/frontend:build`
- **Relative**: `mise run :build` (runs build in current config root)
- **Wildcards**: `mise run //packages/*:test` (run test in all packages)

### Inheritance
Sub-projects inherit tools and env vars from parent `mise.toml` files.

## Examples

### Bash Task with Arguments
File: `mise-tasks/deploy`
```bash
#!/usr/bin/env bash
#MISE description="Deploy artifact to S3"
#MISE depends=["build"]

#USAGE flag "-f --force" help="Overwrite existing"
#USAGE option "-r --region <region>" default="us-east-1" help="AWS Region"
#USAGE arg "<bucket>" help="Target S3 bucket"

set -euo pipefail

echo "Deploying to ${usage_bucket} in ${usage_region}..."

if [ "${usage_force:-false}" = "true" ]; then
  ARGS="--force"
else
  ARGS=""
fi

# aws s3 cp ... $ARGS
```

### Node.js Task
File: `mise-tasks/generate-report`
```javascript
#!/usr/bin/env node
//MISE description="Generate JSON report"

//USAGE option "-o --output <file>" default="report.json"
//USAGE arg "<input>"

const fs = require('fs');
const { usage_output, usage_input } = process.env;

console.log(`Reading ${usage_input}, writing to ${usage_output}`);
```

## Common Mistakes
- **Missing `usage`**: The `usage` CLI tool must be installed for autocompletion (`mise use -g usage`).
- **Variable Names**: `usage_` prefix is mandatory. Dashes in flags (`--dry-run`) become underscores (`usage_dry_run`).
- **Shebangs**: Always include `#!/usr/bin/env <shell>`.
- **Permissions**: Files don't strictly need `chmod +x` if run via `mise run`, but it's good practice.
- **Dependency Loops**: Watch out for circular dependencies in `#MISE depends`.

## Debugging
Use `mise tasks ls` to verify task discovery and parsing.
Run with `mise run taskname --help` to see the generated help message.
