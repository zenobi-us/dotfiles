# Research: AI Harness Agent/Command Formats

**Type:** Research  
**Status:** Complete  
**Date:** 2026-01-12  
**Related Epic:** [Multi-Harness Agent Loader](epic-4dd87a16-multi-harness-agent-loader.md)

---

## Introduction: Research Methodology

### Objective
Understand how different AI coding assistants define and load agents, commands, tools, and extensions to inform the design of a Pi-mono extension that can load configurations from other AI harnesses.

### Research Process
1. Searched official documentation for each harness
2. Examined GitHub repositories for configuration schemas
3. Cross-referenced community resources and examples
4. Focused on documented, stable formats (avoided speculation)

### Harnesses Investigated
1. **Claude Code** (Anthropic) - Official CLI
2. **Aider** - AI pair programming tool
3. **Continue** (VS Code Extension) - IDE assistant
4. **Cursor** - AI-first editor
5. **OpenCode** - Open-source terminal agent
6. **Cody** (Sourcegraph) - Enterprise AI assistant
7. **Pi-mono** (native format for comparison)

### Key Observations

#### Common Patterns Across Harnesses
1. **Hierarchical configuration** - Global → Project → Local
2. **Markdown for prompts/instructions** - Almost universal
3. **YAML/JSON for structured config** - Format varies by tool
4. **Directory-based organization** - Commands/agents in specific folders
5. **Frontmatter metadata** - Description, model, tools, etc.

#### Divergences
- File naming conventions vary significantly
- Some use JSON, others YAML, others pure Markdown
- Tool/permission schemas differ substantially
- Context provider concepts are unique to some tools

### Challenges Encountered
1. OpenCode documentation is comprehensive but relatively new
2. Cursor's format is simpler (just .cursorrules plaintext)
3. Cody shifted from local cody.json to cloud-based Prompt Library
4. Continue has deprecated some config formats (config.json → config.yaml)

### Translation Feasibility Assessment
- **High compatibility**: Claude Code ↔ Pi-mono (similar AGENTS.md concept)
- **Medium compatibility**: OpenCode ↔ Pi-mono (markdown + JSON)
- **Medium compatibility**: Aider ↔ Pi-mono (YAML to settings.json)
- **Low compatibility**: Cursor (minimal structure, just rules text)
- **Low compatibility**: Continue (TypeScript config for advanced features)
- **Low compatibility**: Cody (cloud-based, enterprise-focused)

---

## Research: Detailed Format Analysis

### 1. Claude Code (Anthropic)

#### Configuration Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `settings.json` | `~/.claude/settings.json` | JSON | User settings |
| `settings.json` | `.claude/settings.json` | JSON | Project settings (git-tracked) |
| `settings.local.json` | `.claude/settings.local.json` | JSON | Local overrides (git-ignored) |
| `CLAUDE.md` | `~/.claude/CLAUDE.md` | Markdown | Global context/instructions |
| `CLAUDE.md` | `./CLAUDE.md` | Markdown | Project context |
| Custom commands | `.claude/commands/*.md` | Markdown | Project slash commands |
| Custom commands | `~/.claude/commands/*.md` | Markdown | User slash commands |

#### Settings Schema

```json
{
  "model": "claude-sonnet-4-20250514",
  "maxTokens": 4096,
  "permissions": {
    "allowedTools": ["Read", "Write", "Bash(git *)"],
    "deny": ["Read(./.env)", "Write(./production.config.*)"]
  },
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write(*.py)",
      "hooks": [{ "type": "command", "command": "python -m black $file" }]
    }]
  }
}
```

#### Custom Commands Format

```markdown
# .claude/commands/review.md
Review this code for:
- Security vulnerabilities
- Performance issues
- Code style violations
```

- Filename becomes command name (without `.md`)
- Subdirectories create namespaces: `.claude/commands/frontend/component.md` → `/component (project:frontend)`
- Project commands override user commands with same name

#### Key Features
- Hierarchical CLAUDE.md loading (global → parent dirs → current)
- Hook system for post-tool-use actions
- Permission globs for tool access control

---

### 2. Aider

#### Configuration Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `.aider.conf.yml` | Home dir | YAML | Global settings |
| `.aider.conf.yml` | Git root | YAML | Project settings |
| `.aider.conf.yml` | Current dir | YAML | Local settings |
| `.env` | Git root | Dotenv | API keys |
| `.aider.model.settings.yml` | Configurable | YAML | Custom model settings |
| `.aider.model.metadata.json` | Configurable | JSON | Model context/costs |

#### Configuration Schema

```yaml
# .aider.conf.yml
model: claude-sonnet-4-20250514
anthropic-api-key: sk-ant-...

# Files to always include
read:
  - CONVENTIONS.md
  - anotherfile.txt

# Model settings
edit-format: diff  # or whole, udiff, etc.
architect: false
auto-accept-architect: true
weak-model: claude-haiku

# Behavior
dark-mode: true
stream: true
cache-prompts: false
map-tokens: 2048
```

#### Key Features
- Settings cascade: home → git root → current dir
- Environment variables: `AIDER_xxx` format
- Model aliases: `--alias mymodel:anthropic/claude-3-opus`
- Read-only file injection via `read:` config

#### No Custom Commands
Aider doesn't have a custom command/slash command system like other tools.

---

### 3. Continue (VS Code Extension)

#### Configuration Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `config.yaml` | `~/.continue/config.yaml` | YAML | User config (current) |
| `config.json` | `~/.continue/config.json` | JSON | User config (deprecated) |
| `config.ts` | `~/.continue/config.ts` | TypeScript | Advanced config |
| `.continuerc.json` | Project root | JSON | Workspace config |

#### Configuration Schema (config.yaml)

```yaml
models:
  - title: Claude Sonnet
    provider: anthropic
    model: claude-sonnet-4-20250514
    apiKey: $ANTHROPIC_API_KEY

tabAutocompleteModel:
  title: Codestral
  provider: mistral
  model: codestral-latest

embeddingsProvider:
  provider: voyage
  model: voyage-code-3

reranker:
  name: voyage
  model: rerank-2

contextProviders:
  - name: diff
  - name: terminal
  - name: problems

# Custom slash commands (deprecated - use prompt files)
slashCommands:
  - name: commit
    description: Write a commit message
```

#### Prompt Files (New Method)

Continue now recommends prompt files over `slashCommands` array:

```markdown
# ~/.continue/prompts/commit.md
---
description: Write a commit message for staged changes
---
Write a commit message for the above changes. Use no more than 20 tokens.
```

#### TypeScript Config (Advanced)

```typescript
// ~/.continue/config.ts
export function modifyConfig(config: Config): Config {
  config.slashCommands?.push({
    name: "commit",
    description: "Write a commit message",
    run: async function* (sdk) {
      const diff = await sdk.ide.getDiff(false);
      for await (const message of sdk.llm.streamComplete(`${diff}\n\nWrite a commit message...`)) {
        yield message;
      }
    },
  });
  return config;
}
```

#### Key Features
- Hub configs (cloud-based, team sharing)
- Context providers (diff, terminal, problems, etc.)
- Multiple model roles (chat, edit, embed, rerank)
- IDE integration (VS Code, JetBrains)

---

### 4. Cursor

#### Configuration Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `.cursorrules` | Project root | Plain text/Markdown | AI behavior rules |
| `.cursor/rules/*.md` | Project | Markdown | Project rules (new) |
| User Rules | Cursor Settings | Plain text | Global rules |

#### .cursorrules Format

Simple plaintext/markdown - no structured schema:

```markdown
# Project: E-commerce Platform

## Technology Stack
- React 18 with TypeScript
- Node.js backend with Express
- PostgreSQL database
- Tailwind CSS for styling

## Coding Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow atomic design principles
- Use React Query for data fetching

## 🚨 CRITICAL INSTRUCTIONS 🚨
As an AI, you MUST NOT generate deprecated patterns like:
- @supabase/auth-helpers-nextjs (use @supabase/ssr instead)
```

#### Rule Types

1. **Global Rules** - Cursor Settings → General → Rules for AI
2. **Project Rules** - `.cursor/rules/*.md` (version-controlled)
3. **Legacy .cursorrules** - Still supported but deprecated

#### Key Features
- Extremely simple format (just markdown/text)
- No structured schema or frontmatter
- Rules are injected into system prompt
- Community rule repositories (awesome-cursorrules)

---

### 5. OpenCode

#### Configuration Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `opencode.json` | Project root | JSON | Main config |
| Agent files | `~/.config/opencode/agent/*.md` | Markdown | Global agents |
| Agent files | `.opencode/agent/*.md` | Markdown | Project agents |
| Command files | `~/.config/opencode/command/*.md` | Markdown | Global commands |
| Command files | `.opencode/command/*.md` | Markdown | Project commands |

#### opencode.json Schema

```json
{
  "$schema": "https://opencode.ai/config.json",
  "theme": "opencode",
  "model": "anthropic/claude-sonnet-4-5",
  "autoupdate": true,
  "agent": {
    "build": {
      "mode": "primary",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "{file:./prompts/build.txt}",
      "tools": { "write": true, "edit": true, "bash": true }
    },
    "plan": {
      "mode": "primary",
      "tools": { "write": false, "edit": false, "bash": false }
    },
    "code-reviewer": {
      "description": "Reviews code for best practices",
      "mode": "subagent",
      "model": "anthropic/claude-sonnet-4-20250514",
      "prompt": "You are a code reviewer...",
      "tools": { "write": false, "edit": false }
    }
  },
  "command": {
    "test": {
      "template": "Run the full test suite with coverage...",
      "description": "Run tests with coverage",
      "agent": "build",
      "model": "anthropic/claude-3-5-sonnet-20241022"
    }
  }
}
```

#### Agent Markdown Format

```markdown
---
description: Reviews code for quality and best practices
mode: subagent
model: anthropic/claude-sonnet-4-20250514
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
---
You are in code review mode. Focus on:
- Code quality and best practices
- Potential bugs and edge cases
- Performance implications
- Security considerations

Provide constructive feedback without making direct changes.
```

#### Command Markdown Format

```markdown
---
description: Run tests with coverage
agent: build
model: anthropic/claude-3-5-sonnet-20241022
---
Run the full test suite with coverage report and show any failures.
Focus on the failing tests and suggest fixes.
```

#### Command Features
- **Arguments**: `$ARGUMENTS`, `$1`, `$2`, etc.
- **Shell output**: `` !`npm test` `` embeds command output
- **File references**: `@src/components/Button.tsx`

#### Key Features
- Primary vs Subagent modes
- Tool permission granularity
- JSON schema validation
- Built-in agents: Build, Plan, General, Explore

---

### 6. Cody (Sourcegraph)

#### Configuration Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `cody.json` | `~/.vscode/cody.json` | JSON | User commands (legacy) |
| `cody.json` | `.vscode/cody.json` | JSON | Workspace commands (legacy) |
| Prompt Library | Sourcegraph Cloud | Web UI | Enterprise prompts |

#### Legacy cody.json Format

```json
{
  "commands": {
    "explain-with-security": {
      "prompt": "Explain this code, focusing on security implications",
      "context": {
        "selection": true,
        "currentFile": true
      }
    },
    "generate-unit-tests": {
      "prompt": "Generate comprehensive unit tests for the selected code",
      "context": {
        "selection": true
      }
    }
  }
}
```

#### Prompt Library (Current - Enterprise)

Prompts are now created via web UI:
- **Owner**: User or Organization
- **Prompt Name**: Identifier
- **Prompt Template**: Instructions with dynamic context
- **Visibility**: Public or Private
- **Mode**: Chat only or Edit code
- **Tags**: For organization

#### Core Built-in Prompts
- `document-code`
- `explain-code`
- `find-code-smells`
- `generate-unit-tests`

#### Key Features
- Shifted from local config to cloud-based Prompt Library
- Enterprise-focused with team sharing
- IDE extensions (VS Code, JetBrains, Visual Studio)
- Context providers (selection, currentFile)

---

### 7. Pi-mono (Native Format)

#### Configuration Files

| File | Location | Format | Purpose |
|------|----------|--------|---------|
| `auth.json` | `~/.pi/agent/auth.json` | JSON | API keys |
| `settings.json` | `~/.pi/agent/settings.json` | JSON | User settings |
| `settings.json` | `.pi/settings.json` | JSON | Project settings |
| `models.json` | `~/.pi/agent/models.json` | JSON | Custom models |
| `keybindings.json` | `~/.pi/agent/keybindings.json` | JSON | Key mappings |
| `AGENTS.md` | `~/.pi/agent/AGENTS.md` | Markdown | Global context |
| `AGENTS.md` | `./AGENTS.md` | Markdown | Project context |
| `SYSTEM.md` | `~/.pi/agent/SYSTEM.md` | Markdown | Custom system prompt |
| `SYSTEM.md` | `.pi/SYSTEM.md` | Markdown | Project system prompt |
| Prompts | `~/.pi/agent/prompts/*.md` | Markdown | Global slash commands |
| Prompts | `.pi/prompts/*.md` | Markdown | Project slash commands |
| Skills | `~/.pi/agent/skills/**/SKILL.md` | Markdown | Global skills |
| Skills | `.pi/skills/**/SKILL.md` | Markdown | Project skills |
| Extensions | `~/.pi/agent/extensions/*.ts` | TypeScript | Custom tools/commands |
| Extensions | `.pi/extensions/*.ts` | TypeScript | Project extensions |
| Agents | `~/.pi/agent/agents/*.md` | Markdown | Subagent definitions |

#### settings.json Schema

```json
{
  "theme": "dark",
  "defaultProvider": "anthropic",
  "defaultModel": "claude-sonnet-4-20250514",
  "defaultThinkingLevel": "medium",
  "enabledModels": ["anthropic/*", "*gpt*"],
  "compaction": {
    "enabled": true,
    "reserveTokens": 16384,
    "keepRecentTokens": 20000
  },
  "skills": { "enabled": true },
  "extensions": ["/path/to/extension.ts"]
}
```

#### Prompt Template Format

```markdown
---
description: Review staged git changes
---
Review the staged changes (`git diff --cached`). Focus on:
- Bugs and logic errors
- Security issues
- Error handling gaps
```

Arguments: `$1`, `$@`, `$ARGUMENTS`

#### Skill Format

```markdown
---
name: brave-search
description: Web search via Brave Search API. Use for documentation, facts, or web content.
---
# Brave Search

## Setup
```bash
cd /path/to/brave-search && npm install
```

## Usage
```bash
./search.js "query"              # Basic search
./search.js "query" --content    # Include page content
```
```

#### Extension API (TypeScript)

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

export default function (pi: ExtensionAPI) {
  // Register custom tools
  pi.registerTool({
    name: "deploy",
    description: "Deploy to production",
    parameters: Type.Object({
      environment: Type.String()
    }),
    async execute(toolCallId, params, onUpdate, ctx, signal) {
      // Implementation
    }
  });

  // Register commands
  pi.registerCommand("stats", {
    description: "Show statistics",
    handler: async (args, ctx) => {
      ctx.ui.notify("Stats...", "info");
    }
  });

  // Event hooks
  pi.on("tool_call", async (event, ctx) => {
    // Block/modify tool calls
  });
}
```

#### Key Features
- Skills system (Agent Skills standard)
- TypeScript extensions for custom tools
- Event interception and modification
- Multi-model support with live switching
- Session tree with branching/forking

---

## Insights: Patterns & Recommendations

### 1. Convergence on Markdown for Prompts

All harnesses are converging on **Markdown with YAML frontmatter** for defining prompts and commands:

| Harness | Prompt Format |
|---------|---------------|
| Claude Code | `.claude/commands/*.md` |
| Continue | `~/.continue/prompts/*.md` |
| OpenCode | `.opencode/command/*.md` |
| Pi-mono | `.pi/prompts/*.md` |

**Implication**: A universal prompt loader could parse these with minimal transformation.

### 2. Hierarchical Configuration is Universal

Every harness implements some form of cascading config:

```
Global (user home) → Project root → Current directory
```

This pattern enables:
- Personal preferences applied everywhere
- Team standards via committed project configs
- Local overrides for experimentation

### 3. Two Distinct Customization Philosophies

**Philosophy A: Rules-Based (Cursor)**
- Simple plaintext/markdown rules
- Injected into system prompt
- No structured schema
- Easy to write, hard to parse programmatically

**Philosophy B: Structured Config (OpenCode, Continue)**
- JSON/YAML with schemas
- Explicit tool permissions
- Agent modes and roles
- Machine-parseable, more complex to author

**Pi-mono** bridges both: structured settings.json + flexible markdown skills/prompts.

### 4. Agent/Subagent Concepts Are Emerging

OpenCode and Pi-mono both have formalized agent concepts:

| Harness | Agent Types |
|---------|-------------|
| OpenCode | Primary agents (Build, Plan) + Subagents (General, Explore) |
| Pi-mono | Skills (on-demand) + Extensions (custom tools) + Subagent tool |
| Claude Code | /agents command (less documented) |

**Insight**: The concept of specialized agents for different tasks is becoming standard.

### 5. Tool Permission Granularity Varies

| Harness | Permission Model |
|---------|------------------|
| Claude Code | Glob patterns: `Bash(git *)`, `Read(./.env)` |
| OpenCode | Boolean per-tool: `{ "write": false, "bash": true }` |
| Pi-mono | CLI flags: `--tools read,grep,find,ls` |
| Continue | Full access or none |
| Cursor | No explicit model |

**Insight**: Claude Code has the most expressive permission model.

### 6. Context Injection Mechanisms

Different approaches to including context:

| Mechanism | Harnesses Using |
|-----------|-----------------|
| `@file` references | Claude Code, OpenCode, Pi-mono (editor) |
| `read:` config array | Aider |
| Context providers | Continue |
| File drag/drop | Pi-mono |
| Shell output injection | OpenCode (`` !`cmd` ``), Pi-mono (`!cmd`) |

## Translation Feasibility Matrix

### High Feasibility

| Source | Target | Transformation |
|--------|--------|----------------|
| Claude Code commands | Pi-mono prompts | Rename + move directories |
| OpenCode commands | Pi-mono prompts | Strip tool config from frontmatter |
| Pi-mono prompts | Claude Code commands | Rename directories |
| Pi-mono prompts | OpenCode commands | Add optional frontmatter |

### Medium Feasibility

| Source | Target | Transformation Needed |
|--------|--------|----------------------|
| Aider config | Pi-mono settings | YAML→JSON, field mapping |
| Continue config | Pi-mono settings | Extract model/provider info |
| OpenCode agents | Pi-mono skills | Restructure frontmatter, rename |
| Claude Code settings | Pi-mono settings | Permission translation |

### Low Feasibility

| Source | Target | Challenges |
|--------|--------|------------|
| Cursor .cursorrules | Any structured format | No schema to parse |
| Continue config.ts | Pi-mono | TypeScript execution required |
| Cody Prompt Library | Local files | Cloud-based, API required |
| Pi-mono extensions | Others | TypeScript-specific |

## Design Recommendations for Pi-mono Extension

### 1. Universal Command/Prompt Loader

```typescript
// Proposed interface
interface ExternalPrompt {
  source: 'claude-code' | 'opencode' | 'continue' | 'aider';
  name: string;
  description?: string;
  content: string;
  model?: string;
  tools?: Record<string, boolean>;
}

// Load from multiple sources
function discoverPrompts(searchPaths: SearchPath[]): ExternalPrompt[];
```

### 2. Configuration Mapping Layer

Create adapters for each harness:

```typescript
interface HarnessAdapter {
  name: string;
  configPaths: string[];
  parseConfig(content: string): PartialPiConfig;
  parseCommand(path: string): PromptTemplate;
}
```

### 3. Priority: Focus on Claude Code and OpenCode

These have:
- Most similar architecture to Pi-mono
- Well-documented formats
- Active development
- Community adoption

### 4. Read-Only Import (Initially)

Start with one-way import rather than bidirectional sync:
- Parse external configs
- Present as available prompts/skills
- Don't modify external files

### 5. Graceful Degradation

When features don't translate:
- Log warnings
- Skip unsupported features
- Preserve original for reference

## Potential Extension Architecture

```
.pi/agent/harness-bridge/
├── adapters/
│   ├── claude-code.ts      # Parse .claude/ files
│   ├── opencode.ts         # Parse .opencode/ files
│   ├── aider.ts            # Parse .aider.conf.yml
│   └── continue.ts         # Parse .continue/ files
├── discovery.ts            # Find external configs
├── translator.ts           # Convert to pi-mono format
└── index.ts                # Extension entry point
```

## Future Considerations

1. **Watch Mode**: Monitor external configs for changes
2. **Bidirectional Sync**: Write back to external formats
3. **Conflict Resolution**: Handle overlapping command names
4. **Agent Skills Standard**: Leverage existing skill format for maximum compatibility
5. **MCP Bridge**: Optional for users who need it (despite pi-mono philosophy)

---

## Summary: Executive Summary

### Key Finding
All modern AI coding assistants are converging on **Markdown with YAML frontmatter** for prompt/command definitions, making cross-tool compatibility achievable. The main variations are in settings schemas and tool permission models.

### Comparison Table

| Harness | Config Format | Command Format | Agent Support | Complexity |
|---------|---------------|----------------|---------------|------------|
| **Claude Code** | JSON | Markdown (`.claude/commands/`) | Limited (/agents) | Medium |
| **Aider** | YAML | None | None | Low |
| **Continue** | YAML/JSON/TS | Markdown (deprecated) | Via config.ts | High |
| **Cursor** | Plain text | None (.cursorrules only) | None | Very Low |
| **OpenCode** | JSON | Markdown (`.opencode/`) | Full (primary/subagent) | Medium |
| **Cody** | JSON (legacy) | Cloud-based | None | Medium |
| **Pi-mono** | JSON | Markdown (`.pi/prompts/`) | Skills + Extensions | Medium-High |

### Compatibility Assessment

#### High Compatibility (Easy Import)
- **Claude Code → Pi-mono**: Similar CLAUDE.md/AGENTS.md concept, markdown commands
- **OpenCode → Pi-mono**: Markdown commands with frontmatter, similar agent model
- **Pi-mono → Claude Code**: Bidirectional possible

#### Medium Compatibility (Requires Transformation)  
- **Aider → Pi-mono**: YAML to JSON conversion needed
- **Continue → Pi-mono**: Multiple formats, deprecation in progress

#### Low Compatibility (Limited Value)
- **Cursor → Pi-mono**: No structured format to parse
- **Cody → Pi-mono**: Cloud-based, enterprise-focused

### Recommendations

#### Phase 1: Core Implementation
1. Build adapters for **Claude Code** and **OpenCode** first
2. Focus on **command/prompt import** (highest compatibility)
3. Use read-only mode initially (don't modify external configs)

#### Phase 2: Settings Migration
1. Add **Aider YAML** parser for model/API key migration
2. Add **Continue YAML** parser for model configuration
3. Create unified settings merger

#### Phase 3: Advanced Features
1. Agent/skill translation between OpenCode and Pi-mono
2. Watch mode for external config changes
3. Optional bidirectional sync

### Confidence Levels

| Finding | Confidence | Sources |
|---------|------------|---------|
| File locations and naming | **High** | Official docs (5+) |
| Configuration schemas | **High** | Official docs + GitHub |
| Command argument syntax | **High** | Official docs |
| Agent/subagent models | **Medium** | Fewer sources, newer features |
| Future format stability | **Low** | Continue transitioning, Cody shifting to cloud |

### Limitations

1. **GitHub Copilot** not investigated (extension-based, limited customization)
2. **Cody Enterprise** cloud features not fully explored
3. **Tool permission translation** needs deeper analysis
4. **MCP compatibility** intentionally excluded per pi-mono philosophy

### Next Steps

1. Create detailed design document for extension architecture
2. Build proof-of-concept for Claude Code command import
3. Test with real-world configurations from community repositories
4. Gather feedback on priority harnesses to support

---

## Verification: Source Credibility & Cross-Reference

### Source Credibility Matrix

| Harness | Source Type | URL | Access Date | Confidence |
|---------|-------------|-----|-------------|------------|
| Claude Code | Official Docs | https://code.claude.com/docs/en/slash-commands | 2026-01-12 | High |
| Claude Code | Blog (Shipyard) | https://shipyard.build/blog/claude-code-cheat-sheet/ | 2026-01-12 | Medium |
| Aider | Official Docs | https://aider.chat/docs/config/aider_conf.html | 2026-01-12 | High |
| Continue | Official Docs | https://docs.continue.dev/customize/deep-dives/configuration | 2026-01-12 | High |
| Continue | GitHub Schema | https://github.com/continuedev/continue/blob/main/extensions/vscode/config_schema.json | 2026-01-12 | High |
| Cursor | Official Docs | https://cursor.com/docs/context/rules | 2026-01-12 | High |
| Cursor | Community | https://github.com/PatrickJS/awesome-cursorrules | 2026-01-12 | Medium |
| OpenCode | Official Docs | https://opencode.ai/docs/agents/ | 2026-01-12 | High |
| OpenCode | Official Docs | https://opencode.ai/docs/commands/ | 2026-01-12 | High |
| OpenCode | Official Docs | https://opencode.ai/docs/config/ | 2026-01-12 | High |
| Cody | Official Docs | https://docs.sourcegraph.com/cody/custom-commands | 2026-01-12 | High |
| Cody | Community | https://github.com/deepak2431/awesome-cody-commands | 2026-01-12 | Medium |
| Pi-mono | Official Docs | https://github.com/badlogic/pi-mono (README) | 2026-01-12 | High |
| Pi-mono | Blog | https://mariozechner.at/posts/2025-11-30-pi-coding-agent/ | 2026-01-12 | High |
| Pi-mono | Community | https://github.com/qualisero/awesome-pi-agent | 2026-01-12 | Medium |

### Cross-Reference Verification

#### File Locations (High Confidence)

| Finding | Sources Agreeing | Contradictions |
|---------|------------------|----------------|
| Claude Code uses `.claude/` directory | Official docs, Community blog | None |
| Aider uses `.aider.conf.yml` in home/git root/cwd | Official docs | None |
| Continue uses `~/.continue/config.yaml` | Official docs, GitHub | None |
| Cursor uses `.cursorrules` at project root | Official docs, Community | None |
| OpenCode uses `opencode.json` and `.opencode/` | Official docs | None |
| Cody uses `~/.vscode/cody.json` (legacy) | Official docs | Cloud-based now preferred |
| Pi-mono uses `~/.pi/agent/` and `.pi/` | Official docs, README | None |

#### Configuration Formats (High Confidence)

| Finding | Sources Agreeing | Notes |
|---------|------------------|-------|
| Claude Code: JSON for settings, MD for commands | Official docs | Verified via examples |
| Aider: YAML for config, dotenv for keys | Official docs | Sample file on GitHub |
| Continue: YAML (new) / JSON (legacy) | Official docs | Deprecation noted |
| Cursor: Plain text/markdown | Official docs | No structured schema |
| OpenCode: JSON + Markdown files | Official docs | JSON schema available |
| Cody: JSON (legacy) → Cloud (current) | Official docs | Enterprise shift |
| Pi-mono: JSON for settings, MD for prompts/skills | Official README | Verified |

#### Custom Command Features (High Confidence)

| Harness | Arguments | File Injection | Shell Output |
|---------|-----------|----------------|--------------|
| Claude Code | Limited (just text) | @file references | No |
| Aider | N/A (no commands) | Via `read:` config | N/A |
| Continue | Via SDK in config.ts | Context providers | No |
| Cursor | N/A (rules only) | N/A | N/A |
| OpenCode | $1, $ARGUMENTS, $@ | @file references | `` !`cmd` `` |
| Cody | Context placeholders | Via context config | No |
| Pi-mono | $1, $@, $ARGUMENTS | @file in editor | !command in REPL |

### Unverified or Low Confidence Claims

#### Claude Code Hooks
- **Claim**: PostToolUse hooks can auto-format files
- **Source**: Single blog post
- **Status**: Likely accurate but not verified against official docs
- **Confidence**: Medium

#### Continue TypeScript Config
- **Claim**: `modifyConfig` function for advanced customization
- **Source**: Official docs
- **Status**: Verified but noted as "probably unnecessary"
- **Confidence**: High (but may be deprecated)

#### Cody Local Commands
- **Claim**: `~/.vscode/cody.json` still works
- **Source**: Official docs (marked legacy)
- **Status**: May be deprecated in favor of Prompt Library
- **Confidence**: Medium (for current usage)

### Gaps in Research

1. **GitHub Copilot** - Not investigated (extension-based, less customizable)
2. **Codex CLI** (OpenAI) - Not investigated (limited public docs)
3. **Claude Code Agents** - `/agents` command mentioned but not fully documented
4. **Continue Hub Configs** - Cloud-based, not fully explored
5. **Tool permission schemas** - Vary significantly, detailed comparison needed

### Data Freshness Notes

- All sources accessed 2026-01-12
- OpenCode appears relatively new (documentation comprehensive)
- Continue transitioning from JSON to YAML config
- Cody transitioning from local to cloud-based prompts
- Claude Code has MCP support (not investigated per pi-mono philosophy)

---

*Research consolidated: 2026-01-13*  
*Total harnesses analyzed: 7*  
*Total sources verified: 15*  
*Status: Complete*
