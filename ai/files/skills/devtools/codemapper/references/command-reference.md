# CodeMapper Command Reference

Complete reference for all CodeMapper commands and flags.

## Commands by Category

### Discovery Commands

#### `cm stats .`
Display project statistics: file counts, symbol breakdown, performance.
```bash
cm stats .
```

#### `cm map [path]`
Generate file structure with symbol counts.
```bash
cm map . --level 2 --format ai     # Recommended
cm map . --level 1                 # File paths only
cm map . --level 3                 # File paths + all symbols
```

**Map Levels:**
- `--level 1` - File paths only (minimal)
- `--level 2` - File paths + symbol counts (recommended)
- `--level 3` - File paths + all symbol names (detailed)

#### `cm query <name>`
Search for functions, classes, methods across codebase.
```bash
cm query authenticate --format ai
cm query MyClass --exact --format ai
cm query Parser --show-body --format ai
```

**Search modes:**
- Default: Fuzzy, case-insensitive
- `--exact`: Case-sensitive, strict matching

#### `cm inspect <file>`
List all symbols in a specific file.
```bash
cm inspect ./src/auth.py --format ai
cm inspect ./lib/parser.ts --show-body --format ai
```

#### `cm deps [path]`
Analyze import relationships and symbol usage.
```bash
cm deps . --format ai
```

### Call Graph Commands

#### `cm callers <symbol>`
Find who calls this function (reverse dependencies).
```bash
cm callers process_payment --format ai
cm callers authenticate --show-body --format ai
```

#### `cm callees <symbol>`
Find what this function calls (forward dependencies).
```bash
cm callees process_payment --format ai
```

#### `cm trace <from> <to>`
Show shortest call path from symbol A to symbol B.
```bash
cm trace main error_handler --format ai
cm trace process_order validate_payment --format ai
```

#### `cm entrypoints [path]`
Find exported symbols with no internal callers (potential dead code).
```bash
cm entrypoints . --format ai
cm entrypoints ./src --exports-only --format ai
```

#### `cm tests <symbol>`
Find test functions that call a given symbol.
```bash
cm tests my_function --format ai
cm tests process_payment --format ai
```

#### `cm test-deps <file>`
List production (non-test) symbols called by a test file.
```bash
cm test-deps ./tests/test_auth.py --format ai
```

#### `cm impact <symbol>`
Quick breakage report: definition + callers + tests.
```bash
cm impact process_payment --format ai
```

### Git Integration Commands

**Note:** These commands require a git repository.

#### `cm diff <commit>`
Show symbol-level changes between current code and a commit.
```bash
cm diff main --format ai
cm diff HEAD~1 --format ai
cm diff v1.0 --format ai
```

#### `cm since <commit>`
Show breaking API changes since a commit.
```bash
cm since main --breaking --format ai
cm since v1.0 --format ai
cm since HEAD~5 --breaking --format ai
```

#### `cm blame <symbol> <file>`
Show who last modified a symbol and when.
```bash
cm blame authenticate ./src/auth.py
cm blame process_payment ./lib/payment.ts
```

#### `cm history <symbol> <file>`
Show full evolution of a symbol across git history.
```bash
cm history authenticate ./src/auth.py
cm history UserClass ./models/user.py
```

### Type Analysis Commands

#### `cm types <symbol>`
Analyze types in a symbol's signature and locate definitions.
```bash
cm types process_payment --format ai
cm types authenticate --format ai
```

#### `cm implements <interface>`
Find all classes/structs that implement an interface or trait.
```bash
cm implements Iterator --format ai
cm implements Handler --format ai
```

#### `cm schema <class>`
Display field schema for data structures.
```bash
cm schema Order --format ai
cm schema User --format ai
```

### Code Health Commands

#### `cm untested [path]`
Find functions and methods not called by any test.
```bash
cm untested . --format ai
cm untested ./src --format ai
```

### Snapshot Commands

#### `cm snapshot <name>`
Save current codebase state for later comparison.
```bash
cm snapshot pre-refactor
cm snapshot v1.0-release
```

#### `cm compare <name>`
Show changes between current code and saved snapshot.
```bash
cm compare pre-refactor --format ai
cm compare v1.0-release --format ai
```

## Global Flags

### Output Format
```bash
--format ai          # Compact, token-efficient (RECOMMENDED for LLMs)
--format human       # Pretty tables for terminal viewing
--format default     # Markdown for documentation
```

**🔥 Always use `--format ai` for LLM context - 60-80% token reduction**

### Code Display
```bash
--show-body          # Include actual implementation code
--exports-only       # Show only public symbols
--full               # Include anonymous/lambda functions (normally hidden)
```

### Context Level
```bash
--context minimal    # Signatures only (default, fast)
--context full       # Include docstrings and metadata
```

### Search Mode
```bash
--exact              # Strict case-sensitive matching (default is fuzzy)
```

### Cache Control
```bash
--no-cache           # Skip cache, always reindex (for troubleshooting)
--rebuild-cache      # Force cache rebuild
--cache-dir <path>   # Custom cache location
```

### File Filtering
```bash
--extensions py,rs,js    # Comma-separated file types to include
```

**Default extensions:** `.py`, `.js`, `.ts`, `.jsx`, `.tsx`, `.rs`, `.java`, `.go`, `.c`, `.h`, `.md`

## Language Support

| Language | Symbol Types |
|----------|-------------|
| Python | Functions, classes, methods, imports |
| JavaScript | Functions, classes, methods, imports |
| TypeScript | Functions, classes, methods, interfaces, types, enums |
| Rust | Functions, structs, impl blocks, traits, enums |
| Java | Classes, interfaces, methods, enums, javadoc |
| Go | Functions, structs, methods, interfaces |
| C | Functions, structs, includes |
| Markdown | Headings, code blocks |

## Performance Characteristics

- **Small repos** (< 100 files): < 20ms instant
- **Medium repos** (100-1000 files): ~0.5s with cache
- **Large repos** (1000+ files): Fast mode auto-enabled (10-100x speedup)
- **Incremental rebuilds**: 45-55x faster than full reindex

### Caching Behavior
- Auto-enabled on projects ≥ 300ms to parse
- Small projects never create cache (no `.codemapper/` clutter)
- Location: `.codemapper/` in project root
- File changes auto-detected (no manual cache management)
- Override location: `CODEMAPPER_CACHE_DIR` env var or `--cache-dir` flag

## Environment Variables

```bash
CODEMAPPER_CACHE_DIR=/custom/path    # Override cache location
```

## Exit Codes

- `0` - Success
- `1` - Error (file not found, git repo required, etc.)

## Examples by Task

### Finding Symbol Usage
```bash
cm query authenticate --format ai              # Find definition
cm callers authenticate --format ai            # Find usage
cm tests authenticate --format ai              # Find tests
```

### Understanding Dependencies
```bash
cm callers my_function --format ai             # Who depends on me?
cm callees my_function --format ai             # What do I depend on?
cm trace main my_function --format ai          # Call path
```

### Code Quality
```bash
cm untested . --format ai                      # Find untested code
cm entrypoints . --format ai                   # Find unused exports
cm impact my_function --format ai              # Impact analysis
```

### Git Analysis
```bash
cm diff main --format ai                       # What changed?
cm since v1.0 --breaking --format ai           # Breaking changes?
cm blame my_function ./file.py                 # Who changed it?
```

### Type Understanding
```bash
cm types my_function --format ai               # What types?
cm schema Order --format ai                    # Field structure?
cm implements Iterator --format ai             # Who implements?
```
