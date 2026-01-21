# Settings Migration: JSON to bunfig

This document explains the migration from `~/.pi/settings.json` to `~/.pi/settings.bunfig.ts` using bunfig for configuration management.

## Why bunfig?

bunfig enables features that plain JSON doesn't support:

1. **onCreate Callbacks** - Execute functions or shell commands after worktree creation
2. **Template Variables** - Use `{{project}}`, `{{name}}`, etc. in strings
3. **TypeScript Support** - Full type safety and IDE intellisense
4. **Complex Logic** - Conditionals, imports, and computations
5. **Top-level Await** - Async operations in configuration

## Migration Steps

### 1. Install bunfig

bunfig is already installed in the `opencode` package.

### 2. Create settings file

Create `~/.pi/settings.bunfig.ts`:

```typescript
import type { WorktreeSettings, WorktreeCreatedContext } from "@opencode-ai/plugin";

export default {
  worktree: {
    parentDir: "~/.local/share/worktrees/{{project}}",
    
    // Option 1: Shell command as string
    onCreate: "mise setup",
    
    // Option 2: Async callback function
    onCreate: async (ctx: WorktreeCreatedContext) => {
      console.log(`Created ${ctx.name} at ${ctx.path}`);
      // Custom logic here
    },
  },
};
```

### 3. Remove old settings file

```bash
rm ~/.pi/settings.json
```

## Settings File Format

### Basic Structure

```typescript
export default {
  worktree: {
    parentDir: string;           // Optional: parent directory for worktrees
    onCreate: string | Function; // Optional: callback or command
  }
}
```

### Template Variables

Use template variables in string values:

- `{{project}}` - Git repository name (from `.git/config`)
- `{{path}}` - Full path to worktree
- `{{name}}` - Worktree name (feature branch)
- `{{branch}}` - Branch name
- `{{mainWorktree}}` - Path to main worktree

Example:

```typescript
parentDir: "~/.worktrees/{{project}}/{{name}}"
```

### onCreate: String Commands

Execute shell commands after worktree creation:

```typescript
onCreate: "mise setup && git submodule update --init"
```

The command runs in the worktree directory with `stdio: "inherit"`.

### onCreate: Async Functions

For more control, use async functions:

```typescript
onCreate: async (ctx) => {
  console.log(`Setting up ${ctx.name}...`);
  
  const { execSync } = await import("child_process");
  
  // Run setup command
  execSync("mise setup", {
    cwd: ctx.path,
    stdio: "inherit",
  });
  
  // Custom logic
  if (ctx.branch.startsWith("feature/")) {
    // Handle feature branches differently
  }
}
```

## API Reference

### WorktreeCreatedContext

```typescript
interface WorktreeCreatedContext {
  path: string;        // Full path to worktree
  name: string;        // Worktree name
  branch: string;      // Branch name
  project: string;     // Repository name
  mainWorktree: string; // Path to main worktree
}
```

## Examples

### Example 1: Basic Setup

```typescript
export default {
  worktree: {
    parentDir: "~/.local/share/worktrees/{{project}}",
    onCreate: "mise setup",
  },
};
```

### Example 2: Complex Setup with TypeScript

```typescript
import type { WorktreeCreatedContext, WorktreeSettings } from "@opencode-ai/plugin";
import { execSync } from "child_process";

const settings = {
  worktree: {
    parentDir: process.env.WORKTREE_DIR || "~/.local/share/worktrees/{{project}}",

    onCreate: async (ctx: WorktreeCreatedContext) => {
      console.log(`🔧 Setting up ${ctx.name}...`);

      // Setup steps
      const commands = [
        "mise setup",
        "npm install",
        "npm run build",
      ];

      for (const cmd of commands) {
        console.log(`  > ${cmd}`);
        try {
          execSync(cmd, {
            cwd: ctx.path,
            stdio: "inherit",
          });
        } catch (error) {
          console.error(`Failed: ${cmd}`);
          throw error;
        }
      }

      console.log(`✓ ${ctx.name} ready!`);
    },
  } as WorktreeSettings,
};

export default settings;
```

### Example 3: Environment-Specific Setup

```typescript
const isCI = process.env.CI === "true";

export default {
  worktree: {
    parentDir: "~/.local/share/worktrees/{{project}}",

    onCreate: async (ctx) => {
      const { execSync } = await import("child_process");

      if (isCI) {
        console.log("Running in CI mode");
        execSync("npm ci", { cwd: ctx.path, stdio: "inherit" });
      } else {
        console.log("Running in dev mode");
        execSync("npm install", { cwd: ctx.path, stdio: "inherit" });
        execSync("npm run setup:dev", { cwd: ctx.path, stdio: "inherit" });
      }
    },
  },
};
```

## Troubleshooting

### onCreate not running

1. Check the settings file exists: `~/.pi/settings.bunfig.ts`
2. Verify TypeScript syntax: `bun check ~/.pi/settings.bunfig.ts`
3. Check logs for errors during worktree creation

### Type errors in IDE

Ensure you have:

```typescript
import type { WorktreeSettings, WorktreeCreatedContext } from "@opencode-ai/plugin";
```

### Settings not loading

- Verify file path: `~/.pi/settings.bunfig.ts`
- Check file permissions: `ls -la ~/.pi/settings.bunfig.ts`
- Test loading: `bun /path/to/settings-loader.ts`

## Rollback

If you need to rollback to JSON settings:

1. Keep your old `settings.json` file
2. Modify `settings-loader.ts` to fall back to JSON
3. Or manually revert the worktree extension

## See Also

- bunfig Documentation: https://bun.sh/docs/runtime/bunfig
- Worktree Extension: `devtools/files/pi/agent/extensions/worktree/`
- Example Settings: `devtools/files/opencode/lib/example-settings.bunfig.ts`
