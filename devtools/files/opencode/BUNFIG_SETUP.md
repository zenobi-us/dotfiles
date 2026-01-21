# bunfig Setup Complete ✓

You now have bunfig installed and configured for settings management with onCreate callback support.

## What Was Installed

1. **bunfig** (`^0.15.6`) - Added to `package.json` dependencies
2. **Settings Loader** (`lib/settings-loader.ts`) - TypeScript module for loading bunfig settings
3. **Type Definitions** (`lib/types.ts`) - Shared types for WorktreeSettings and callbacks
4. **Example Settings** (`lib/example-settings.bunfig.ts`) - Template for user settings
5. **Migration Guide** (`lib/SETTINGS_MIGRATION.md`) - Complete documentation
6. **bunfig Configuration** (`devtools/files/bun/bunfig.toml`) - Bun configuration with TypeScript loader

## Quick Start

### 1. Create Your Settings File

Copy the example to your home directory:

```bash
# Create the directory
mkdir -p ~/.pi

# Create settings file
cat > ~/.pi/settings.bunfig.ts << 'EOF'
import type { WorktreeSettings, WorktreeCreatedContext } from "@opencode-ai/plugin";

export default {
  worktree: {
    parentDir: "~/.local/share/worktrees/{{project}}",
    
    onCreate: async (ctx: WorktreeCreatedContext) => {
      console.log(`✓ Created ${ctx.name} at ${ctx.path}`);
      
      const { execSync } = await import("child_process");
      execSync("mise setup", {
        cwd: ctx.path,
        stdio: "inherit",
      });
    },
  },
};
EOF
```

### 2. Test Loading Settings

```bash
# From the opencode directory
bun lib/settings-loader.ts
```

### 3. Integrate with Worktree Extension

The worktree extension will automatically use:
- `loadSettings()` for async loading (recommended)
- `callOnCreate()` to execute onCreate callbacks after worktree creation

## Key Features

### onCreate Support

Two ways to define onCreate in your settings:

**Option 1: Shell Command**
```typescript
onCreate: "mise setup && npm install"
```

**Option 2: Async Function**
```typescript
onCreate: async (ctx) => {
  console.log(`Setting up ${ctx.name}...`);
  // Your custom logic here
}
```

### Template Variables

Use in `parentDir` and command strings:
- `{{project}}` - Git repository name
- `{{name}}` - Worktree name
- `{{branch}}` - Branch name
- `{{path}}` - Worktree path
- `{{mainWorktree}}` - Main worktree path

### TypeScript Support

Full type safety with imports:

```typescript
import type { WorktreeSettings, WorktreeCreatedContext } from "@opencode-ai/plugin";
```

## File Structure

```
~/.pi/
  └── settings.bunfig.ts          # Your settings file (created by user)

devtools/files/bun/
  └── bunfig.toml                 # Bun configuration ✓

devtools/files/opencode/
  ├── package.json                # Updated with bunfig ✓
  ├── lib/
  │   ├── settings-loader.ts      # Settings loading utility ✓
  │   ├── types.ts                # Shared type definitions ✓
  │   ├── example-settings.bunfig.ts # Example settings file ✓
  │   └── SETTINGS_MIGRATION.md   # Complete migration guide ✓
  └── BUNFIG_SETUP.md             # This file ✓
```

## Next Steps

1. **Copy example settings**: `cp lib/example-settings.bunfig.ts ~/.pi/settings.bunfig.ts`
2. **Customize for your needs**: Edit `~/.pi/settings.bunfig.ts`
3. **Update worktree extension**: Integrate `loadSettings()` and `callOnCreate()` into the extension
4. **Test the integration**: Run worktree create and verify onCreate runs

## API Reference

### loadSettings()

```typescript
import { loadSettings } from "./lib/settings-loader";

const settings = await loadSettings();
// Returns WorktreeSettings with onCreate callback if defined
```

### callOnCreate()

```typescript
import { callOnCreate } from "./lib/settings-loader";
import type { WorktreeCreatedContext } from "./lib/types";

const ctx: WorktreeCreatedContext = {
  path: "/path/to/worktree",
  name: "feature-branch",
  branch: "feature/my-feature",
  project: "my-project",
  mainWorktree: "/path/to/main",
};

await callOnCreate(settings, ctx);
```

## Configuration Reference

### WorktreeSettings Type

```typescript
interface WorktreeSettings {
  parentDir?: string;  // Parent directory for worktrees
  onCreate?: string | ((ctx: WorktreeCreatedContext) => Promise<void>);
}
```

### WorktreeCreatedContext Type

```typescript
interface WorktreeCreatedContext {
  path: string;           // Full path to created worktree
  name: string;           // Worktree name
  branch: string;         // Branch name
  project: string;        // Repository name
  mainWorktree: string;   // Path to main worktree
}
```

## Troubleshooting

### Settings file not found

Check the path: `~/.pi/settings.bunfig.ts`

```bash
ls -la ~/.pi/settings.bunfig.ts
```

### TypeScript errors in settings file

Verify syntax and imports:

```bash
bun check ~/.pi/settings.bunfig.ts
```

### onCreate not executing

1. Ensure settings file exists
2. Check console output for errors
3. Verify function is async: `onCreate: async (ctx) => { ... }`

### Import errors

Ensure imports in settings file match the actual export locations:

```typescript
import type { WorktreeSettings, WorktreeCreatedContext } from "@opencode-ai/plugin";
```

## Documentation

- Full migration guide: `lib/SETTINGS_MIGRATION.md`
- Example settings: `lib/example-settings.bunfig.ts`
- Settings loader source: `lib/settings-loader.ts`

## Related

- Worktree Extension: `devtools/files/pi/agent/extensions/worktree/`
- Bun Documentation: https://bun.sh/
- bunfig Docs: https://github.com/littledivy/bunfig
