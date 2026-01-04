# AGENTS.md - Coding Guidelines for Agentic Development

This document provides essential guidelines for agentic coding agents working on the wiki-cli project.

## Project Overview

**wiki-cli** is a TypeScript/Bun CLI application for managing wiki content. It uses:
- **Runtime**: Bun 1.3.4 (fast all-in-one JavaScript runtime)
- **Language**: TypeScript with strict mode enabled
- **Build System**: mise (task runner) + Bun compiler
- **No test framework configured** - manual testing required

## Build & Run Commands

### Development
```bash
# Run directly with Bun (instant feedback)
bun run ./src/index.ts

# Setup environment
mise setup

# List available tasks
mise tasks
```

### Build for Production
```bash
# Build binary (output: ./dist/wiki)
mise build

# Build for specific target
mise build linux-x64    # linux-x64, darwin-arm64, windows-x64, etc.

# Run compiled binary
./dist/wiki
```

### Development Task
The `.mise/tasks/dev` file exists but is empty. For development iteration, use `bun run ./src/index.ts`.

## Code Style Guidelines

### TypeScript Configuration (tsconfig.json)

- **strict**: true - All strict type checking enabled
- **target**: ESNext - Use modern JavaScript features
- **module**: ESNext
- **moduleResolution**: bundler
- **noEmit**: true - TypeScript only checks, Bun handles compilation
- **allowImportingTsExtensions**: true
- **verbatimModuleSyntax**: true - Explicit ESM/CJS semantics
- **skipLibCheck**: true

### Imports & Exports

- Use **ES6 module syntax** exclusively:
  ```typescript
  import { function } from "./module";
  export function myFunc() { }
  ```
- Relative imports within src/:
  ```typescript
  import { slugify } from "../core/strings";
  ```
- Group imports: stdlib → external → relative
- No default exports; use named exports for clarity

### Naming Conventions

- **Functions**: camelCase, descriptive verbs
  - ✓ `slugify()`, `dedent()`, `fetchConfig()`
  - ✗ `slug()`, `remove()`, `get()`
- **Classes**: PascalCase
  - ✓ `ConfigProvider`, `StorageProvider`, `MarkdownStorage`
- **Constants**: UPPER_SNAKE_CASE for module-level constants
- **Files**: kebab-case for utilities (`strings.ts`), PascalCase for classes (`ConfigProvider.ts`)
- **Directories**: lowercase (`src/core/`, `src/services/`)

### Formatting & Structure

- **Line length**: Prefer ≤80 chars, max 100 chars (for readability)
- **Indentation**: 2 spaces (Bun convention)
- **Semicolons**: Required (TypeScript default)
- **Trailing commas**: Use in multi-line structures
- **Comments**: Use JSDoc for exported functions and classes
  ```typescript
  /**
   * Slugify text: convert to lowercase, remove special chars, replace spaces with hyphens
   */
  export function slugify(text: string): string { }
  ```

### Types & Interfaces

- Always annotate function parameters and return types:
  ```typescript
  function process(text: string, count: number): string { }
  ```
- Prefer explicit types over `any`
- Use `readonly` for immutable data structures
- Define interfaces/types near their usage or in `core/` for shared types

### Error Handling

- Use explicit error types (not bare strings):
  ```typescript
  throw new Error("Descriptive error message");
  ```
- Catch errors with type guards when needed:
  ```typescript
  try {
    // operation
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    }
  }
  ```
- Log errors with context (file, operation, values)

### Project Structure

```
src/
├── index.ts           # CLI entry point (using clerc framework)
├── core/              # Utilities & helpers
│   └── strings.ts     # String manipulation functions
├── services/          # Business logic & providers
│   ├── ConfigProvider.ts
│   ├── StorageProvider.ts
│   └── storage/
│       └── MarkdownStorage.ts
└── poc.ts             # Proof of concept files
```

- **core/**: Pure utility functions, no side effects
- **services/**: Providers, storage, external integrations
- **index.ts**: CLI command definitions and orchestration only

### Dependencies

- **clerc**: ^1.1.1 - CLI framework for command parsing and routing
- **Bun std lib**: Use Bun's built-in APIs (no Node.js polyfills needed)
- Keep dependencies minimal; evaluate before adding

## Before Committing

1. **Type check**: `bun run --check src/` or rely on tsconfig noEmit
2. **No `console.log` in production code** - use proper logging
3. **Test manually**: Run `bun run ./src/index.ts [args]` to verify
4. **No breaking changes** without discussion

## Agentic Protocol

When encountering issues:
1. Verify with observable output (run commands, check file contents)
2. State assumptions explicitly: "I believe X because Y"
3. Stop and explain to Q before retrying after failures
4. Never silently retry after multiple failures

**Q is the decision-maker. When blocked or uncertain: ask first.**
