# Subagent Command Handlers

This directory contains the command handlers for the `/subagent` command.

## Structure

Each subcommand is implemented in its own file:

- **`list.ts`** - Display available agents with optional verbosity
- **`add.ts`** - Create new agent definitions with templates (basic/scout/worker)
- **`edit.ts`** - Show location of agent files for editing
- **`paths.ts`** - Display agent search paths
- **`help.ts`** - Show usage information
- **`index.ts`** - Exports all command handlers

## Usage

Commands are dispatched from the main `index.ts` via a switch statement:

```typescript
import { handleList, handleAdd, handleEdit, handlePaths, handleHelp } from "./commands/index.js";

pi.registerCommand("subagent", {
  description: "Manage agents: list, add, edit",
  handler: async (args, ctx) => {
    const [cmd, ...rest] = args.trim().split(/\s+/);
    const restStr = rest.join(" ");

    switch (cmd) {
      case "list": handleList(restStr, ctx); break;
      case "add": handleAdd(restStr, ctx); break;
      case "edit": handleEdit(restStr, ctx); break;
      case "paths": handlePaths(restStr, ctx); break;
      default: handleHelp(restStr, ctx); break;
    }
  },
});
```

## Command Details

### list
Discovers and displays all available agents from configured search paths.

### add
Creates a new agent file with template content. Supports three templates:
- `basic` - Minimal template with core fields
- `scout` - Fast reconnaissance template
- `worker` - Full-capability template

### edit
Shows the file path of an existing agent for manual editing.

### paths
Displays all directories that are searched for agent definitions.

### help
Shows comprehensive usage information for all subcommands.

## Type Safety

All command handlers use the same context type from the ExtensionAPI:

```typescript
Parameters<Parameters<ExtensionAPI['registerCommand']>[1]['handler']>[1]
```

This ensures type safety across all command handlers.
