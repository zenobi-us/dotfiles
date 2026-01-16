---
name: codemapper
description: Use when analyzing codebases for structure, finding symbols, tracing call paths, checking test coverage, or analyzing dependencies - provides instant AST-based code analysis using tree-sitter for Python, JavaScript, TypeScript, Rust, Java, Go, and C
---

# CodeMapper (cm) - Fast Code Analysis

## Overview

CodeMapper (`cm`) uses tree-sitter AST parsing to provide instant code analysis without databases. Get project structure, find symbols, trace call graphs, and analyze dependencies in milliseconds.

## When to Use

Use CodeMapper when you need to:
- ✅ Explore unfamiliar codebases (get overview, find structure)
- ✅ Find symbol definitions and usages (functions, classes, methods)
- ✅ Understand call graphs (who calls what, call paths)
- ✅ Check test coverage (find untested code)
- ✅ Analyze git changes at symbol level (breaking changes)
- ✅ Pre-refactoring impact analysis (understand dependencies)
- ✅ Find dead code (exported but unused functions)
- ✅ Understand type flows and data structures

**Don't use for:**
- ❌ Full-text search (use ripgrep/grep instead)
- ❌ Runtime analysis (use profilers)
- ❌ Code execution (use interpreters/compilers)

## Essential Workflows

### 1. Exploring Unknown Code (Start Here)

```bash
# Step 1: Get overview
cm stats .

# Step 2: See file structure (ALWAYS use --format ai for LLMs)
cm map . --level 2 --format ai

# Step 3: Find specific code
cm query <symbol> --format ai

# Step 4: Deep dive into a file
cm inspect ./path/to/file --format ai
```

### 2. Finding a Bug

```bash
# See implementation
cm query <function> --show-body --format ai

# Find who calls it
cm callers <function> --format ai

# Trace the call path
cm trace <entry_point> <function> --format ai

# Find existing tests
cm tests <function> --format ai
```

### 3. Before Refactoring

```bash
# Understand impact
cm callers <function> --format ai

# Check dependencies
cm callees <function> --format ai

# Verify test coverage
cm tests <function> --format ai

# After refactoring, check for breaks
cm since main --breaking --format ai
```

### 4. Understanding an API

```bash
# See public surface
cm entrypoints . --format ai

# Find all implementations
cm implements <interface> --format ai

# See data structure
cm schema <DataClass> --format ai
```

### 5. Code Health Check

```bash
# Find untested code
cm untested . --format ai

# Check breaking changes
cm since <last_release> --breaking --format ai

# Full changelog
cm since <last_release> --format ai
```

## Quick Reference

| Task | Command |
|------|---------|
| Project overview | `cm stats .` |
| File structure | `cm map . --level 2 --format ai` |
| Find symbol | `cm query <name> --format ai` |
| Show implementation | `cm query <name> --show-body --format ai` |
| List file symbols | `cm inspect <file> --format ai` |
| Who calls it? | `cm callers <symbol> --format ai` |
| What does it call? | `cm callees <symbol> --format ai` |
| Call path A→B | `cm trace <from> <to> --format ai` |
| Find tests | `cm tests <symbol> --format ai` |
| Untested code | `cm untested . --format ai` |
| Public APIs | `cm entrypoints . --format ai` |
| Breaking changes | `cm since <commit> --breaking --format ai` |
| Git changes | `cm diff <commit> --format ai` |
| Who modified? | `cm blame <symbol> <file>` |
| Symbol history | `cm history <symbol> <file>` |
| Field structure | `cm schema <class> --format ai` |
| Type analysis | `cm types <symbol> --format ai` |
| Find implementations | `cm implements <interface> --format ai` |

## Key Commands by Category

### Discovery
- `stats` - Project size and composition
- `map` - File listing with symbol counts (use `--level 2`)
- `query` - Find symbols by name (fuzzy search by default)
- `inspect` - List all symbols in one file
- `deps` - Track imports and usage

### Call Graph
- `callers` - WHO calls this function?
- `callees` - What DOES this function call?
- `trace` - Call path from A → B
- `entrypoints` - Public APIs with no internal callers
- `tests` - Which tests call this symbol?
- `test-deps` - What production code does a test touch?

### Git Integration (requires git repo)
- `diff` - Symbol-level changes vs commit
- `since` - Breaking changes since commit
- `blame` - Who last touched this symbol?
- `history` - Full evolution of a symbol

### Type Analysis
- `types` - Parameter types and return type
- `implements` - Find all implementations of interface
- `schema` - Field structure (structs, classes, dataclasses)

### Code Health
- `untested` - Find symbols not covered by tests
- `impact` - Quick breakage report (definition + callers + tests)

## Critical Flags

### Output Format (ALWAYS use for LLMs)
```bash
--format ai          # Compact, token-efficient (RECOMMENDED for LLMs)
--format human       # Pretty tables for terminal
--format default     # Markdown for documentation
```

**🔥 IMPORTANT: Always use `--format ai` when analyzing code for LLM context. This is the most token-efficient format.**

### Search Mode
```bash
# Fuzzy (default) - case-insensitive, flexible
cm query myclass

# Exact - case-sensitive, strict
cm query MyClass --exact
```

### Code Display
```bash
--show-body          # Include actual implementation
--exports-only       # Public symbols only
--full               # Include anonymous/lambda functions
```

### Context Level
```bash
--context minimal    # Signatures only (default, fast)
--context full       # Include docstrings and metadata
```

### Map Detail Levels
```bash
--level 1            # File paths only (minimal)
--level 2            # File paths + symbol counts (RECOMMENDED)
--level 3            # File paths + all symbol names (detailed)
```

### Cache Control
```bash
--no-cache           # Skip cache, always reindex
--rebuild-cache      # Force cache rebuild
--cache-dir <path>   # Custom cache location
```

## Supported Languages

✓ Python, JavaScript, TypeScript, Rust, Java, Go, C, Markdown

Default extensions: `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.rs`, `.java`, `.go`, `.c`, `.h`, `.md`

Override with: `--extensions py,rs,js`

## Performance

- **Small repos** (< 100 files): < 20ms instant
- **Medium repos** (100-1000): ~0.5s with cache
- **Large repos** (1000+): Fast mode auto-enabled (10-100x speedup)
- **Incremental rebuilds**: 45-55x faster than full reindex

### Caching Behavior
- Auto-enabled on projects ≥ 300ms to parse
- Small projects never create cache (no clutter)
- Location: `.codemapper/` in project root
- File changes auto-detected
- Override: `CODEMAPPER_CACHE_DIR` env var or `--cache-dir`

## Common Patterns

### Exploring New Codebase
```bash
# Always start with these two commands
cm stats .
cm map . --level 2 --format ai

# Then search for what you need
cm query <symbol_name> --format ai
```

### Pre-Refactoring Checklist
```bash
# 1. Check impact radius
cm callers my_function --format ai

# 2. Verify test coverage
cm tests my_function --format ai

# 3. Check dependencies
cm callees my_function --format ai

# 4. See implementation
cm query my_function --show-body --format ai
```

### Code Review Workflow
```bash
# Check breaking changes
cm since main --breaking --format ai

# Find untested code
cm untested . --format ai

# Verify public API surface
cm entrypoints . --format ai
```

### Debugging Workflow
```bash
# Find the function
cm query <function> --show-body --format ai

# See who calls it
cm callers <function> --format ai

# Trace execution path
cm trace <entry> <function> --format ai

# Check if tested
cm tests <function> --format ai
```

## Common Mistakes

### ❌ Forgetting `--format ai`
```bash
# Bad (verbose, token-heavy)
cm map . --level 2

# Good (compact, LLM-optimized)
cm map . --level 2 --format ai
```

### ❌ Using grep for call graphs
```bash
# Bad (misses indirect calls, false positives)
grep -r "process_payment"

# Good (accurate AST-based call graph)
cm callers process_payment --format ai
```

### ❌ Manual file exploration
```bash
# Bad (slow, incomplete)
find . -name "*.py" | xargs cat | grep "def authenticate"

# Good (instant, comprehensive)
cm query authenticate --show-body --format ai
```

### ❌ Skipping stats/map
```bash
# Bad (jumping to query without context)
cm query something --format ai

# Good (understand structure first)
cm stats .
cm map . --level 2 --format ai
cm query something --format ai
```

### ❌ Using CodeMapper for full-text search
```bash
# Bad (wrong tool)
cm query "error message text"

# Good (use ripgrep)
rg "error message text"
```

## Troubleshooting

### No Symbols Found?
1. Verify language support: `cm stats .` shows what's indexed
2. Check file extensions: Use `--extensions py,js,ts`
3. Try fuzzy search (default) vs `--exact`
4. Verify UTF-8 encoding

### Slow Queries?
1. First run builds cache (~10s)
2. Subsequent runs use cache (~0.5s)
3. Large repos auto-enable fast mode
4. Try `--no-cache` if cache is stale (rare)

### Git Commands Fail?
1. Must be in a git repository (`diff`, `since`, `blame`, `history` need git)
2. Commit must exist (HEAD~1, abc123, main, v1.0 all work)
3. File must have git history

### Output Too Verbose?
1. Use `--format ai` for most compact
2. Use `--context minimal` for signatures only
3. Omit `--show-body` flag
4. Use `--exports-only` for public APIs only

## Real-World Impact

**Token efficiency:** `--format ai` reduces output by 60-80% vs default markdown

**Speed:** Find all callers in 1000+ file repo in < 1 second (vs minutes with grep)

**Accuracy:** AST-based analysis catches indirect calls that grep misses

**Coverage:** Find untested code in seconds vs manual test/code comparison

## Integration Examples

### For LLM Context (Token-Efficient)
```bash
# Always use --format ai
cm map . --level 2 --format ai > codebase-structure.txt
cm query authenticate --show-body --format ai > auth-logic.txt
```

### For CI/CD (Breaking Change Detection)
```bash
# Fail if breaking changes detected
if cm since main --breaking | grep -q "BREAKING"; then
  echo "Breaking changes detected!"
  exit 1
fi
```

### For Documentation Generation
```bash
# Use default format for markdown
cm map . --level 2 > docs/ARCHITECTURE.md
cm entrypoints . > docs/API.md
```

### For Code Review
```bash
# Show changes and untested code
cm diff main --format ai
cm untested . --format ai
```

## Best Practices

1. **Always start with overview:** `cm stats .` then `cm map . --level 2 --format ai`
2. **Always use `--format ai` for LLMs:** Token efficiency matters
3. **Fuzzy search first:** Default fuzzy matching is more forgiving
4. **Check before refactoring:** Run `cm callers` and `cm tests` before changes
5. **Verify breaking changes:** Use `cm since main --breaking` before merging
6. **Find untested code:** Regular `cm untested .` checks
7. **Use correct tool:** CodeMapper for structure/calls, ripgrep for text search
8. **Cache is automatic:** Don't worry about it, just use the tool

## When NOT to Use CodeMapper

Use ripgrep/grep instead for:
- Full-text search (error messages, log strings)
- Regex pattern matching
- Content within strings/comments
- File content search (not code structure)

Use profilers instead for:
- Runtime performance analysis
- Memory usage tracking
- Hot path identification
- CPU profiling

Use language-specific tools for:
- Code execution
- Type checking
- Linting
- Formatting
