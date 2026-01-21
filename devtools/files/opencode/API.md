# Settings Loader API Reference

Complete API documentation for the settings loader module.

## Module: settings-loader.ts

### loadSettings()

```typescript
export async function loadSettings(): Promise<WorktreeSettings>
```

Load settings from `~/.pi/settings.bunfig.ts` with full TypeScript support.

**Returns:** WorktreeSettings object with onCreate callback if defined  
**Error Handling:** Logs errors but returns empty object on failure (graceful fallback)

**Example:**
```typescript
const settings = await loadSettings();
if (settings.onCreate) {
  console.log("onCreate callback is defined");
}
```

---

### expandTemplate()

```typescript
export function expandTemplate(
  template: string,
  context: WorktreeCreatedContext
): string
```

Expand template variables in a string using Object.entries().reduce().

**Parameters:**
- `template` - String with `{{variable}}` placeholders
- `context` - WorktreeCreatedContext object

**Template Variables:**
- `{{project}}` - Repository name
- `{{name}}` - Worktree name
- `{{branch}}` - Branch name
- `{{path}}` - Full path to worktree
- `{{mainWorktree}}` - Path to main worktree

**Returns:** String with all variables expanded

**Example:**
```typescript
const context: WorktreeCreatedContext = {
  project: "my-app",
  name: "feature-auth",
  branch: "feature/auth",
  path: "/home/user/.local/share/worktrees/my-app/feature-auth",
  mainWorktree: "/home/user/projects/my-app",
};

const result = expandTemplate(
  "~/.worktrees/{{project}}/{{name}}",
  context
);
// → "~/.worktrees/my-app/feature-auth"

// Multiple variables
const result2 = expandTemplate(
  "{{path}}/{{branch}}.log",
  context
);
// → "/home/user/.local/share/worktrees/my-app/feature-auth/feature/auth.log"
```

**Implementation:**
```typescript
Object.entries(context).reduce(
  (result, [key, value]) =>
    result.replace(new RegExp(`{{${key}}}`, "g"), String(value)),
  template
)
```

---

### getExpandedParentDir()

```typescript
export function getExpandedParentDir(
  settings: WorktreeSettings,
  context: WorktreeCreatedContext
): string
```

Get the expanded parentDir with template variables substituted.

**Parameters:**
- `settings` - WorktreeSettings from loadSettings()
- `context` - WorktreeCreatedContext with worktree info

**Returns:** Fully expanded directory path

**Default Behavior:** If no parentDir defined in settings, uses `~/.local/share/worktrees/{{project}}`

**Example:**
```typescript
const settings = await loadSettings();
const context = { project: "my-app", ... };

const dir = getExpandedParentDir(settings, context);
// If settings.parentDir = "~/.worktrees/{{project}}/{{name}}"
// → "/home/user/.worktrees/my-app/feature-auth"

// If settings.parentDir is undefined (uses default)
// → "/home/user/.local/share/worktrees/my-app"
```

---

### callOnCreate()

```typescript
export async function callOnCreate(
  settings: WorktreeSettings,
  context: WorktreeCreatedContext
): Promise<void>
```

Execute the onCreate callback if it exists.

**Parameters:**
- `settings` - WorktreeSettings from loadSettings()
- `context` - WorktreeCreatedContext with worktree info

**Behavior:**
- If `onCreate` is a string: executes as shell command in worktree directory
- If `onCreate` is a function: calls with context directly
- If `onCreate` is undefined: does nothing (no-op)

**Example with string command:**
```typescript
// settings.bunfig.ts:
export default {
  worktree: {
    onCreate: "mise setup && npm install",
  },
};

// In extension:
const settings = await loadSettings();
await callOnCreate(settings, context);
// Executes: mise setup && npm install (in context.path directory)
```

**Example with async function:**
```typescript
// settings.bunfig.ts:
export default {
  worktree: {
    onCreate: async (ctx) => {
      console.log(`Setting up ${ctx.name}...`);
      const { execSync } = await import("child_process");
      execSync("mise setup", { cwd: ctx.path, stdio: "inherit" });
    },
  },
};

// In extension:
const settings = await loadSettings();
await callOnCreate(settings, context);
// Calls the async function with context
```

---

### getSettingsPath()

```typescript
export function getSettingsPath(): string
```

Get the expected path for settings file.

**Returns:** `~/.pi/settings.bunfig.ts`

**Example:**
```typescript
const path = getSettingsPath();
console.log(path);
// → "/home/user/.pi/settings.bunfig.ts"
```

---

### loadSettingsSync()

```typescript
export function loadSettingsSync(): WorktreeSettings
```

Load settings synchronously (for CLI commands that can't be async).

**Note:** This won't work with async onCreate callbacks. Use `loadSettings()` when possible.

**Returns:** WorktreeSettings object

**Warning:** Logs warning when used. Prefer async `loadSettings()`.

---

## Types: types.ts

### WorktreeSettings

```typescript
interface WorktreeSettings {
  parentDir?: string;
  onCreate?: string | ((ctx: WorktreeCreatedContext) => Promise<void>);
}
```

**Properties:**
- `parentDir` - Optional: parent directory for worktrees (supports template variables)
- `onCreate` - Optional: callback to execute after worktree creation
  - String: shell command to execute
  - Function: async function to call with WorktreeCreatedContext

---

### WorktreeCreatedContext

```typescript
interface WorktreeCreatedContext {
  path: string;           // Full path to created worktree
  name: string;           // Worktree name (from feature branch)
  branch: string;         // Branch name
  project: string;        // Repository name
  mainWorktree: string;   // Path to main worktree
}
```

All fields are automatically populated when calling the loader functions.

---

### WorktreeInfo

```typescript
interface WorktreeInfo {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isCurrent: boolean;
}
```

Information about a git worktree (read-only).

---

### SettingsFile

```typescript
interface SettingsFile {
  worktree?: WorktreeSettings;
}
```

Root structure of ~/.pi/settings.bunfig.ts file.

---

## Complete Usage Example

### 1. Settings File (`~/.pi/settings.bunfig.ts`)

```typescript
import type { WorktreeSettings, WorktreeCreatedContext } from "@opencode-ai/plugin";
import { execSync } from "child_process";

const settings: WorktreeSettings = {
  // Template variables: {{project}}, {{name}}, {{branch}}, {{path}}, {{mainWorktree}}
  parentDir: "~/.local/share/worktrees/{{project}}",

  // Define onCreate callback
  onCreate: async (ctx: WorktreeCreatedContext) => {
    console.log(`🔧 Setting up ${ctx.name} at ${ctx.path}...`);

    const commands = [
      "git submodule update --init",
      "mise setup",
      "npm install",
    ];

    for (const cmd of commands) {
      console.log(`  > ${cmd}`);
      execSync(cmd, {
        cwd: ctx.path,
        stdio: "inherit",
      });
    }

    console.log(`✓ ${ctx.name} ready!`);
  },
};

export default { worktree: settings };
```

### 2. Extension Code

```typescript
import { loadSettings, getExpandedParentDir, callOnCreate } from "./lib/settings-loader";
import type { WorktreeCreatedContext } from "./lib/types";

// Load settings
const settings = await loadSettings();

// Create worktree context
const context: WorktreeCreatedContext = {
  path: "/path/to/new/worktree",
  name: "feature-auth",
  branch: "feature/auth",
  project: "my-app",
  mainWorktree: "/home/user/projects/my-app",
};

// Get expanded directory (with template variables substituted)
const parentDir = getExpandedParentDir(settings, context);
console.log(parentDir); // /home/user/.local/share/worktrees/my-app

// Execute onCreate callback if defined
await callOnCreate(settings, context);
// Logs: 🔧 Setting up feature-auth at /path/to/new/worktree...
// Runs all setup commands
```

---

## Error Handling

All functions include proper error handling:

### loadSettings()
- Missing file returns empty object
- Parse errors logged to console, returns empty object

### expandTemplate()
- Safe with undefined values (converts to string)
- Handles multiple occurrences of same variable

### callOnCreate()
- Undefined onCreate is no-op
- Command execution errors are logged and thrown
- Function execution errors are logged and thrown

### getExpandedParentDir()
- Always returns a string
- Falls back to default if parentDir not defined

---

## Performance Notes

- `loadSettings()` uses dynamic imports (slightly slower than static imports, but necessary for TypeScript support)
- `expandTemplate()` uses RegExp with global flag (efficient for multiple replacements)
- All functions have minimal overhead

---

## Migration from JSON Settings

If migrating from JSON to bunfig:

**Before (JSON):**
```json
{
  "worktree": {
    "parentDir": "~/.local/share/worktrees/{{project}}",
    "onCreate": "mise setup"
  }
}
```

**After (bunfig):**
```typescript
export default {
  worktree: {
    parentDir: "~/.local/share/worktrees/{{project}}",
    onCreate: "mise setup",
  },
};
```

Now you can also use async functions for onCreate!
