# Cruft Patterns: Detection Strategies by Category

Detailed detection strategies for each category of dead code commonly found in agent-maintained codebases.

---

## 1. Orphaned Files

**What:** Source files not imported, required, or referenced by any other file in the project.

**Detection strategy:**

1. Glob all source files matching the project's language extensions
2. For each file, extract its module name / import path
3. Grep the entire codebase for references to that module name or file path
4. Exclude self-references (a file importing itself)
5. Files with zero external references are orphan candidates

**Refinements:**

- Check entry point configurations (package.json `main`/`exports`, pyproject.toml `[tool.poetry.scripts]`, Makefile targets)
- Check build configuration files that may reference source files (webpack entry, esbuild config, tsconfig `files`)
- Check for dynamic imports: `import()`, `require()` with variable paths, `__import__()`, `importlib`
- Check test runners that auto-discover files by convention (e.g., `**/*.test.ts`, `test_*.py`)

**Agent-specific patterns:**

- Files with names like `old-X.ts`, `X.backup.ts`, `X-v2.ts` alongside `X.ts`
- Files in directories like `deprecated/`, `legacy/`, `archive/`
- Files created in the same commit as a replacement but never cleaned up

---

## 2. Unused Exports

**What:** Symbols exported from a module but never imported by any other module.

**Detection strategy:**

1. For each source file, extract all exported symbols (named exports, default exports, re-exports)
2. For each exported symbol, grep the codebase for import statements referencing it
3. Check for barrel file re-exports that may re-export the symbol
4. If a barrel re-exports it, check whether the barrel's re-export is itself imported

**Language-specific extraction:**

| Language | Export patterns to find |
|----------|----------------------|
| TypeScript/JavaScript | `export function`, `export const`, `export class`, `export type`, `export interface`, `export default`, `export { X }`, `module.exports` |
| Python | Module-level functions/classes (public by convention), `__all__` list entries |
| Rust | `pub fn`, `pub struct`, `pub enum`, `pub trait`, `pub mod`, `pub use` |
| Go | Capitalized identifiers (exported by convention) |
| Ruby | `module_function`, methods in modules, class methods intended for external use |

**Agent-specific patterns:**

- Exported helper functions that were used during development but inlined in the final code
- Type exports for shapes that were redesigned (e.g., `OldConfig`, `LegacyPayload`)
- Re-export barrels (`index.ts`) that export symbols from deleted or renamed modules
- Constants like `DEFAULT_X` or `MAX_Y` defined for configurations that were later hardcoded

---

## 3. Redundant Implementations

**What:** Multiple functions, classes, or modules that implement the same logic under different names.

**Detection strategy:**

1. Look for functions with similar names: `parseInput` / `parseUserInput`, `formatDate` / `formatDateString`, `validateEmail` / `checkEmail`
2. Look for functions with identical or near-identical signatures in different files
3. Compare function bodies — look for structural similarity (same control flow, same operations, different variable names)
4. Check utility directories for duplicates (`utils/`, `helpers/`, `lib/`, `common/`)

**Common duplication patterns:**

- **Renamed copies:** Agent created `newParser()` as a replacement but both still exist
- **Module-local helpers:** Same utility function defined in 3 different files instead of shared
- **Wrapper functions:** `doThing()` that just calls `actuallyDoThing()` with no transformation — the wrapper was an abstraction layer that was later simplified but not removed
- **Type aliases:** `type Config = AppConfig` where the alias adds no semantic value

**Heuristic signals:**

- Functions in the same directory with >70% structural similarity
- Functions whose doc comments describe identical behavior
- Functions added in different commits that solve the same problem

---

## 4. Stale Compatibility Code

**What:** Shims, adapters, wrappers, and re-exports that bridge interfaces that no longer differ.

**Detection strategy:**

1. Search for wrapper functions that pass arguments straight through: `function foo(x) { return bar(x); }`
2. Search for re-export files: `export { X } from './old-location'`
3. Search for adapter patterns: classes that implement an interface by delegating every method to another object
4. Search for comments containing "deprecated", "legacy", "compat", "backward", "migration", "temporary", "shim", "bridge", "adapter"

**Grep patterns:**

```
# Pass-through wrappers
"return .*\(.*arguments\)"
"return .*\.call\(this"
"= .*\bsuper\b"

# Re-export shims
"export .* from"
"module\.exports = require"

# Compat comments
"(deprecated|legacy|compat|backward|temporary|shim|TODO.*remove|FIXME.*clean)"
```

**Agent-specific patterns:**

- Functions renamed during a refactor where the old name still exists as a one-line wrapper
- Type re-exports after a type was moved to a new file
- Middleware/hooks that were needed for a previous architecture but now just pass through
- Environment checks for environments that no longer exist (`if (process.env.OLD_FLAG)`)

---

## 5. Dead Branches

**What:** Conditional paths that can never execute under current code.

**Detection strategy:**

1. Search for feature flags or environment variables that are never set or always set to the same value
2. Look for `if (false)`, `if (true)`, `if (0)`, or conditions comparing constants
3. Find early returns or throws that make subsequent code unreachable
4. Identify switch/match cases for enum values that no longer exist
5. Check for catch blocks that handle error types never thrown by the try body

**Grep patterns:**

```
# Constant conditions
"if\s*\(\s*(true|false|0|1)\s*\)"
"if\s*\(\s*!?\s*(true|false)\s*\)"

# Feature flag checks — cross-reference with actual env/config
"process\.env\.\w+"
"import\.meta\.env\.\w+"
"os\.environ\["

# Unreachable code after return/throw
"return .*;\n\s+\w"  (multiline: code after return)
"throw .*;\n\s+\w"   (multiline: code after throw)
```

**Agent-specific patterns:**

- Feature flags added during incremental development that were never removed after the feature was completed
- Error handling for API response shapes that changed during refactoring
- Platform checks for platforms that were dropped from scope
- Debug-mode branches (`if (DEBUG)`) where `DEBUG` is hardcoded to `false`

---

## 6. Orphaned Tests

**What:** Test files testing functions or modules that no longer exist.

**Detection strategy:**

1. Glob all test files (`*.test.*`, `*.spec.*`, `test_*`, `*_test.*`)
2. Extract what each test file imports
3. Check if imported modules still exist
4. Check if imported symbols still exist in those modules
5. Flag test files where >50% of imports are broken

**Additional signals:**

- Test files with failing imports that were silenced by `@ts-ignore` or `# type: ignore`
- Test files in directories matching deleted source directories
- Test files that import from paths containing "old", "legacy", "deprecated"
- Entire test suites with `describe.skip()` or `@pytest.mark.skip` with no explanation

---

## 7. Orphaned Dependencies

**What:** Packages listed in dependency manifests that are not imported anywhere in source code.

**Detection strategy:**

1. Parse the dependency manifest (package.json `dependencies`/`devDependencies`, requirements.txt, Cargo.toml, Gemfile, go.mod)
2. For each dependency, derive its import name(s)
3. Grep source files for imports of that package
4. Also check config files, build scripts, and CLI tool usage

**Important exclusions — do NOT flag these as orphaned:**

| Dependency Type | Example | Why It's Not Orphaned |
|----------------|---------|----------------------|
| Build tools | `typescript`, `esbuild`, `webpack` | Used via CLI, not imported |
| Type packages | `@types/*` | Implicitly used by TypeScript |
| Lint/format | `eslint`, `prettier`, `black` | Used via CLI or config |
| Test frameworks | `jest`, `pytest`, `vitest` | Used via runner, not direct import |
| PostCSS/Babel plugins | `autoprefixer`, `@babel/preset-env` | Referenced in config files |
| CLI tools | `rimraf`, `cross-env`, `concurrently` | Used in package.json scripts |

**Detection approach:**

1. First check source files for `import`/`require` statements
2. Then check config files (`.eslintrc`, `babel.config`, `postcss.config`, `jest.config`, etc.)
3. Then check `scripts` in package.json for CLI usage
4. Only flag as orphaned if absent from all three

---

## Cross-Cutting: Git History Signals

When git history is available, use these signals to increase confidence:

| Signal | Interpretation |
|--------|---------------|
| File unchanged across 5+ refactor commits | Likely forgotten |
| File created and never modified again | Possibly abandoned prototype |
| File's only modification was an auto-formatter run | No one actively maintains it |
| Commit message mentions "replace X" but X still exists | X is likely dead |
| File was part of a batch rename but the old file wasn't deleted | Old file is dead |

**Useful git commands:**

```bash
# Find files not modified in recent commits
git log --diff-filter=M --name-only --since="3 months ago" | sort -u > recently_modified.txt
# Then diff against all source files

# Find commits that mention "replace" or "rewrite"
git log --oneline --grep="replace\|rewrite\|migrate\|supersede"

# Check if a suspect file's last change was meaningful
git log -1 --format='%H %s' -- <file>
```
