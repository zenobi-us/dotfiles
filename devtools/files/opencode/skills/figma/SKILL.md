---
name: figma
description: Use when extracting Figma data programmatically, under time pressure to present design system data, or stuck on mcporter query syntax - provides deterministic discovery pattern (auth → list → understand → query) that prevents random parameter guessing, manual exports, and abandoning automation under pressure
---

# Figma MCP with mcporter

## Overview

**Interrogating Figma via mcporter is tool discovery, not guess-and-check.**

The Figma MCP server (`https://mcp.figma.com/mcp`) exposes Figma's API through Model Context Protocol. Most failures come from skipping OAuth, not understanding available tools, or trying random query syntax instead of discovering what's actually available.

This skill prevents three specific failure modes:
1. **OAuth roadblock**: Spending 30 minutes thinking requests are failing, when they need authentication first
2. **Blind queries**: Trying random query parameters instead of discovering actual tool names and signatures
3. **Syntax guessing**: Attempting to reverse-engineer query format instead of looking it up once

## When to Use

- Extracting components, frames, or variables from Figma programmatically
- Building design system automation that reads Figma as source of truth
- Querying design tokens or component properties via MCP
- Time pressure (< 1 hour to get data) making trial-and-error costly
- Unfamiliar with mcporter CLI or Figma MCP's specific API

**Don't use if:** You're building Figma plugins (use Figma plugin API directly) or already know mcporter patterns.

## Core Pattern: Discovery Before Execution

```
AUTH → LIST TOOLS → UNDERSTAND SIGNATURES → TARGETED QUERIES → EXPORT
```

**Each phase takes seconds once you know the step. Random queries take hours.**

### Phase 1: OAuth (Must Be First)

Figma MCP requires authentication. The server won't return data without valid OAuth token.

```bash
npx mcporter auth https://mcp.figma.com/mcp
```

This:
- Opens browser for Figma OAuth flow
- You approve access
- Token cached locally
- Future calls authenticate automatically

**If you get errors on any subsequent call, check if auth succeeded:**
```bash
# Verify auth worked with a simple list query
npx mcporter call 'https://mcp.figma.com/mcp.listTeams()'
```

If this returns empty list or auth errors → re-run OAuth step.

### Phase 2: Discover Available Tools (List)

Don't guess tool names. Ask mcporter what's available:

```bash
npx mcporter list https://mcp.figma.com/mcp --json > figma_tools.json
```

This outputs all available functions and their signatures. Pipe to JSON for reference while building queries.

**Common tools available** (check JSON output for current list):
- `listTeams()` - List all teams you have access to
- `listFiles()` - List files in accessible teams
- `getFile(fileId)` - Fetch single file with all data
- `getComponents(fileId)` - Get components in file
- `getVariables(fileId)` - Get design tokens/variables
- `searchNodes(fileId, query)` - Search within file by name/type

**Each tool has specific parameters.** The JSON output tells you exactly what's required vs optional.

### Phase 3: Understand Signature Before Querying

For each tool you want to use, the `list` output shows:

```json
{
  "name": "getFile",
  "description": "Get file structure and contents",
  "inputSchema": {
    "type": "object",
    "properties": {
      "fileId": { "type": "string", "description": "Figma file ID" },
      "depth": { "type": "number", "description": "How deep to traverse" }
    },
    "required": ["fileId"]
  }
}
```

This tells you:
- **Required**: `fileId` (must provide)
- **Optional**: `depth` (controls traversal depth, useful for large files)
- **Format**: String parameters, number parameters, etc.

**Read the signature ONCE before building queries.** This prevents "what parameters does this even take?" guessing.

### Phase 4: Make Targeted Calls

Once you know tool name and signature, call it with correct parameters:

```bash
# Get team ID first
npx mcporter call 'https://mcp.figma.com/mcp.listTeams()'

# List files in that team
npx mcporter call 'https://mcp.figma.com/mcp.listFiles(teamId: "123")'

# Get specific file
npx mcporter call 'https://mcp.figma.com/mcp.getFile(fileId: "abc123")'

# Export to file for processing
npx mcporter call 'https://mcp.figma.com/mcp.getFile(fileId: "abc123")' --json > design_system.json
```

**Pattern**: Each call succeeds because you're using known tools with correct parameters, not guessing.

### Phase 5: Query Syntax for searchNodes (If Filtering)

If you need to search within a file:

```bash
npx mcporter call 'https://mcp.figma.com/mcp.searchNodes(fileId: "abc123", query: "Button")'
```

The `query` parameter is **node name substring matching**, not GraphQL or SQL. It filters by text content.

Example queries:
- `query: "Button"` → finds nodes with "Button" in name
- `query: "Primary"` → finds "PrimaryButton", "Primary Variant", etc.
- `query: "Icon"` → finds all icon-related nodes

**This is substring matching, not complex syntax.** If it doesn't find what you want, you may need to fetch full file with `getFile()` and filter in your code.

## Quick Reference: Common Workflows

### Get All Components in a File

```bash
# 1. Find your file ID (from Figma URL or list files)
# 2. Get file with components
npx mcporter call 'https://mcp.figma.com/mcp.getFile(fileId: "YOUR_FILE_ID")'

# 3. Export for parsing
npx mcporter call 'https://mcp.figma.com/mcp.getFile(fileId: "YOUR_FILE_ID")' --json > components.json
```

Parse the JSON output to extract components. Figma structure:
- File contains Frames/Boards
- Frames contain Components and other nodes
- Components have variants (look for `variants` property)

### Get Design Tokens/Variables

```bash
npx mcporter call 'https://mcp.figma.com/mcp.getVariables(fileId: "YOUR_FILE_ID")' --json > tokens.json
```

Output is flat list of variable definitions with:
- Variable name
- Type (color, typography, etc.)
- Default value

### Search for Specific Component

```bash
# Substring search
npx mcporter call 'https://mcp.figma.com/mcp.searchNodes(fileId: "YOUR_FILE_ID", query: "Button")'

# If search returns many results, you may want full file and post-process
```

## When the Discovery Pattern Feels Too Slow (Rationalization Table)

Under pressure, agents try to skip phases. Here's what that looks like and why it fails:

| Rationalization | Why It's Wrong | Stay-in-Pattern Fix |
|-----------------|----------------|---------------------|
| "Just manually export from Figma UI, we'll automate later" | One manual export becomes precedent. Automation never happens. You've created technical debt + false culture. | Use `depth: 1` or `getComponents()` instead of full file. You get data in same time without breaking automation. |
| "This discovery pattern is too slow for our huge file" | The pattern *includes* performance tuning (`depth` parameter, selective queries). Skipping it means you skip optimization. | Read Phase 3 signature output. Your tool already has `depth` and filtering. Use it. |
| "Let's skip the `list` step, I know what tools exist" | You don't. The API version changed, tools were renamed, or signatures shifted. You'll hit "unknown tool" errors and waste more time. | `list --json` takes 30 seconds. Your "knowledge" costs more if wrong. |
| "Query syntax is too complex, let me just try things" | Reverse-engineering takes hours. The syntax is simple (substring matching). Reading it once beats trying 20 times. | Phase 3 tells you the syntax. Read it. One query test validates it. You're done. |
| "I'll merge this with manual exports, we need something NOW" | Hybrid approaches create inconsistency. Designers trust one version, devs work from another. Breaks down within days. | `getComponents()` gives you structured data in 3 minutes. That IS "something NOW" and it's automation-ready. |
| "The discovery pattern worked before but this file is different" | Files don't vary. The *tooling* might. But that's why Phase 2 (list) discovers current tools. Phase 3 reveals any parameter changes. The pattern adapts. | If a tool fails, **stay in pattern**: run `list --json` again, check signatures, adjust parameters. Don't abandon the framework. |

**Red flags - when you're rationalizing:**
- "Just this once"
- "We'll automate it later"
- "Let me try random [query/parameter] values"
- "This is different because..."
- "Manual export is faster right now"
- "I already know how mcporter works"

**If you see yourself saying these, stop. Re-read Phase 2-3.**

## Common Mistakes

❌ **Trying queries before OAuth:** Auth is invisible when working. If calls fail silently or with auth errors, re-auth first.

❌ **Guessing tool names:** "Does it have `getComponents` or `listComponents` or `fetchComponents`?" → Use `list` output to see exact names.

❌ **Assuming complex query syntax:** Query parameter is simple substring matching. If you need complex filtering, fetch full file and filter in code.

❌ **Not reading signatures:** You copy a call from an example but don't know what parameters it takes. The `list --json` output is your reference — read it before building queries.

❌ **Large file performance issues:** For huge design systems, use `depth` parameter to limit traversal, or fetch components separately with `getComponents()` instead of full file.

❌ **Abandoning the pattern under pressure:** "Manual export is faster" or "Let's skip discovery" breaks automation and creates precedent. The pattern **includes** performance tuning. Use `depth`, `getComponents()`, or selective queries to stay fast AND automated.

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| "Not authenticated" | OAuth token missing or expired | Run `npx mcporter auth https://mcp.figma.com/mcp` again |
| "File not found" or empty results | Wrong file ID or no access | Verify file ID, check team access with `listTeams()` |
| "Unknown tool" | Tool name wrong or not available in version | Run `list --json` to see actual available tools |
| Queries timeout or return nothing | File too large or network slow | Try `depth: 1` to limit traversal, or query specific tool like `getComponents()` instead of full file |
| Results missing components/tokens | Data not in Figma file, or exists in different format | Use `list` output to understand file structure, may need different tool or post-processing |

## Real-World Pattern

**30-minute scenario: "Extract component list from Figma, present to team"**

1. **OAuth** (2 min): `npx mcporter auth`
2. **Discover** (2 min): `npx mcporter list --json`
3. **Find file** (2 min): `npx mcporter call listFiles()`
4. **Get components** (5 min): `npx mcporter call getFile(fileId: "xyz") --json > components.json`
5. **Parse and present** (17 min remaining): Extract what you need from JSON

This works because each phase answers ONE question, not blind guessing. By the time you're extracting components, you already know the tool works and returns data.

**Without this pattern:** Spend 15+ minutes trying random query formats, never getting data, missing your window.
