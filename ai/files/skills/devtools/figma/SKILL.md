---
name: figma
description: Use when design, prototyping or referencing Figma files. Provides capabilities for inspecting design elements, extracting assets, generating code from designs, and managing Code Connect mappings via the figma-desktop MCP server.
---

# Figma Skill

Master Figma automation and integration using the figma-desktop MCP server via mcporter. This skill enables programmatic access to Figma designs, code generation, screenshots, and Code Connect mappings.

> [!CRITICAL]
> ⚠️ **IMPORTANT - Parameter Passing:**
>
> Use **function-call syntax** (NOT flag syntax). Parameters go inside the function call, not as flags:
>
> ```bash
> mise x node@20 -- mcporter call 'figma-desktop.get_design_context(nodeId: "123:456", clientLanguages: "typescript", clientFrameworks: "react")'
> ```
>
> **Key Rules:**
>
> - Parameters are camelCase inside the function call
> - String values use double quotes: `"value"`
> - Boolean values use bare notation: `true` or `false`
> - Environment variables are interpolated outside quotes: `"'$VAR'"`
> - NO `--flag` syntax, NO JSON string escaping needed

## Prerequisites

### Verify Figma Desktop Connection

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_metadata'
```

Should return metadata for the currently selected node. If it fails, ensure:
1. Figma Desktop is running
2. The figma-desktop MCP server is configured in mcporter

## Quick Setup

### Get Design Context (One-Shot)

**The fastest way to get design information and generated code:**

```bash
mise x node@20 -- ./scripts/get_design_context.sh "123:456"
```

Or use the currently selected node:

```bash
mise x node@20 -- ./scripts/get_design_context.sh
```

**With framework context:**

```bash
mise x node@20 -- ./scripts/get_design_context.sh "123:456" --languages "typescript" --frameworks "react"
```

### Extract Node ID from URL

If you have a Figma URL like `https://figma.com/design/:fileKey/:fileName?node-id=1-2`:
- The nodeId is `1:2` (replace `-` with `:`)

For branch URLs like `https://figma.com/design/:fileKey/branch/:branchKey/:fileName`:
- Use `branchKey` as the fileKey

## Core Operations

### Get Design Context (Generate Code)

Primary tool for generating UI code from Figma designs:

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_design_context(nodeId: "123:456")'
```

**With technology context (recommended):**

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_design_context(nodeId: "123:456", clientLanguages: "typescript,css", clientFrameworks: "react")'
```

**For currently selected node:**

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_design_context()'
```

**Force code output (for large designs):**

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_design_context(nodeId: "123:456", forceCode: true)'
```

**With artifact type context:**

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_design_context(nodeId: "123:456", artifactType: "REUSABLE_COMPONENT", taskType: "CREATE_ARTIFACT")'
```

Valid `artifactType` values:
- `WEB_PAGE_OR_APP_SCREEN`
- `COMPONENT_WITHIN_A_WEB_PAGE_OR_APP_SCREEN`
- `REUSABLE_COMPONENT`
- `DESIGN_SYSTEM`

Valid `taskType` values:
- `CREATE_ARTIFACT`
- `CHANGE_ARTIFACT`
- `DELETE_ARTIFACT`

### Get Screenshot

Capture a visual screenshot of a Figma node:

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_screenshot(nodeId: "123:456")'
```

**For currently selected node:**

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_screenshot()'
```

### Get Metadata (Structure Overview)

Get XML structure overview of a node (node IDs, layer types, names, positions, sizes):

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_metadata(nodeId: "123:456")'
```

**Note:** Prefer `get_design_context` for most use cases. Use `get_metadata` only for structure overview.

### Get Variable Definitions

Get design tokens/variables for a node (colors, fonts, sizes, spacings):

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_variable_defs(nodeId: "123:456")'
```

Returns mappings like: `{'icon/default/secondary': '#949494'}`

### Get FigJam Content

For FigJam files (whiteboards, diagrams):

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_figjam(nodeId: "123:456")'
```

**With node images:**

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_figjam(nodeId: "123:456", includeImagesOfNodes: true)'
```

**Note:** Only works for FigJam files, not standard Figma design files.

## Code Connect

Code Connect maps Figma components to code components in your codebase.

### Get Code Connect Mappings

Check existing mappings for a node:

```bash
mise x node@20 -- mcporter call 'figma-desktop.get_code_connect_map(nodeId: "123:456")'
```

Returns mappings like:
```json
{
  "1:2": {
    "codeConnectSrc": "https://github.com/foo/components/Button.tsx",
    "codeConnectName": "Button"
  }
}
```

### Add Code Connect Mapping

Map a Figma component to a code component:

```bash
mise x node@20 -- mcporter call 'figma-desktop.add_code_connect_map(nodeId: "123:456", source: "src/components/Button.tsx", componentName: "Button", label: "React")'
```

**Required parameters:**
- `source`: Path to component in codebase
- `componentName`: Name of the component
- `label`: Framework/language label

**Valid `label` values:**
- `React`, `Web Components`, `Vue`, `Svelte`, `Storybook`, `Javascript`
- `Swift UIKit`, `Objective-C UIKit`, `SwiftUI`
- `Compose`, `Java`, `Kotlin`, `Android XML Layout`
- `Flutter`, `Markdown`

### Create Design System Rules

Generate design system rules for your repository:

```bash
mise x node@20 -- mcporter call 'figma-desktop.create_design_system_rules(clientLanguages: "typescript", clientFrameworks: "react")'
```

## Helper Scripts

| Script | Purpose |
|--------|---------|
| `./scripts/get_design_context.sh` | **One-shot design context** - Get design info and generated code (with optional framework context) |
| `./scripts/get_screenshot.sh` | **Capture screenshot** - Save node screenshot to file |
| `./scripts/get_variables.sh` | **Get design tokens** - Extract variables (colors, fonts, sizes, spacings) |
| `./scripts/add_code_connect.sh` | **Add Code Connect** - Map Figma component to code component |

**Script help:**

```bash
./scripts/get_design_context.sh --help
./scripts/get_screenshot.sh --help
./scripts/get_variables.sh --help
./scripts/add_code_connect.sh --help
```

## Common Workflows

### 1. Implement a Design Component

```bash
# Get the node ID from Figma URL (node-id=1-2 → nodeId="1:2")
NODE_ID="1:2"

# Get design context with your tech stack
mise x node@20 -- mcporter call 'figma-desktop.get_design_context(nodeId: "'$NODE_ID'", clientLanguages: "typescript,css", clientFrameworks: "react")'

# Get variables/tokens for the component
mise x node@20 -- mcporter call 'figma-desktop.get_variable_defs(nodeId: "'$NODE_ID'")'
```

### 2. Document Component in Code Connect

```bash
# Check existing mappings
mise x node@20 -- mcporter call 'figma-desktop.get_code_connect_map(nodeId: "123:456")'

# Add mapping
mise x node@20 -- mcporter call 'figma-desktop.add_code_connect_map(nodeId: "123:456", source: "src/components/Button/Button.tsx", componentName: "Button", label: "React")'
```

### 3. Extract Design System Tokens

```bash
# Get all variables for a design system frame
mise x node@20 -- mcporter call 'figma-desktop.get_variable_defs(nodeId: "0:1")'

# Generate design system rules
mise x node@20 -- mcporter call 'figma-desktop.create_design_system_rules(clientLanguages: "typescript,css", clientFrameworks: "react")'
```

### 4. Screenshot for Documentation

```bash
# Get screenshot of a component
mise x node@20 -- mcporter call 'figma-desktop.get_screenshot(nodeId: "123:456")' > component.png
```

## Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| **Connection refused** | Ensure Figma Desktop is running and figma-desktop MCP server is configured |
| **Node not found** | Verify nodeId format is `123:456` (colon separator). Check the node exists in the file. |
| **No output for large design** | Use `forceCode: true` parameter to force code generation |
| **Wrong code language** | Specify `clientLanguages` and `clientFrameworks` parameters |
| **"Invalid arguments" or command fails** | Use function-call syntax, NOT flag syntax. Parameters go inside `functionName(param: value)` |
| **FigJam tool not working** | `get_figjam` only works for FigJam files, not regular Figma design files |
| **Code Connect not appearing** | Ensure the node is a component instance, not a regular frame |

## Discovering Function Parameters with Schema Introspection

The mcporter CLI can introspect the MCP server schema to discover correct parameters and their types.

### List All Available Tools

```bash
mise x node@20 -- mcporter list figma-desktop --json | jq -r ".tools[].name"
```

Returns:
```
get_design_context
get_variable_defs
get_screenshot
get_code_connect_map
add_code_connect_map
get_metadata
create_design_system_rules
get_figjam
```

### Inspect a Specific Tool Schema

```bash
mise x node@20 -- mcporter list figma-desktop --json | jq '.tools[] | select(.name == "get_design_context")'
```

This returns the full JSON schema including:
- `inputSchema.properties` - All available parameters with types and descriptions
- `inputSchema.required` - Which parameters are mandatory

**Filter for just required parameters:**

```bash
mise x node@20 -- mcporter list figma-desktop --json | \
  jq '.tools[] | select(.name == "add_code_connect_map") | .inputSchema.required[]'
```

**Get parameter descriptions:**

```bash
mise x node@20 -- mcporter list figma-desktop --json | \
  jq '.tools[] | select(.name == "get_design_context") | .inputSchema.properties | to_entries[] | "\(.key): \(.value.description)"'
```

## Tips

- **Node ID from URL:** `node-id=1-2` in URL becomes `nodeId: "1:2"` (replace `-` with `:`)
- **Branch URLs:** For branch URLs, use `branchKey` as the fileKey
- **Currently selected:** Omit `nodeId` to use the currently selected node in Figma Desktop
- **Technology context:** Always specify `clientLanguages` and `clientFrameworks` for better code generation
- **Large designs:** Use `forceCode: true` if output is truncated
- **Use `jq` for JSON parsing** in shell scripts
- **Use schema introspection** when unsure about parameters - `mcporter list figma-desktop --json | jq` is your friend

## Available Tools Reference

| Tool | Purpose | Required Params |
|------|---------|-----------------|
| `get_design_context` | Generate UI code from design | None (uses selection) |
| `get_screenshot` | Capture visual screenshot | None (uses selection) |
| `get_metadata` | Get XML structure overview | None (uses selection) |
| `get_variable_defs` | Get design tokens/variables | None (uses selection) |
| `get_code_connect_map` | Get existing code mappings | None (uses selection) |
| `add_code_connect_map` | Map design to code component | `source`, `componentName`, `label` |
| `create_design_system_rules` | Generate design system rules | None |
| `get_figjam` | Get FigJam content | None (uses selection) |
