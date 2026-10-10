# CodeMapper Common Mistakes

Learn from common mistakes to use CodeMapper effectively.

## Critical Mistake: Forgetting `--format ai`

### ❌ Wrong
```bash
cm map . --level 2
cm query authenticate
cm callers process_payment
```

**Problem:** Default output is verbose markdown, wastes 60-80% more tokens.

### ✅ Correct
```bash
cm map . --level 2 --format ai
cm query authenticate --format ai
cm callers process_payment --format ai
```

**Why:** `--format ai` is compact and optimized for LLM context windows.

**Impact:** 60-80% token reduction, faster processing, lower costs.

---

## Mistake: Using grep for Call Graph Analysis

### ❌ Wrong
```bash
# Using grep to find usages
grep -r "process_payment" .
grep -r "process_payment" --include="*.py" .
```

**Problems:**
- Misses indirect calls through function pointers/callbacks
- False positives from comments and strings
- Can't distinguish between definition and usage
- No call path information
- No understanding of scope

### ✅ Correct
```bash
# Use AST-based call graph
cm callers process_payment --format ai
cm callees process_payment --format ai
cm trace main process_payment --format ai
```

**Why:** CodeMapper uses AST parsing to understand actual code structure, not text matching.

**Example of what grep misses:**
```python
# grep finds "process_payment" in string
error_msg = "Failed to process_payment"  # False positive

# grep misses indirect call
handler = process_payment
result = handler(order)  # True usage, but grep can't connect these
```

---

## Mistake: Manual File Exploration Instead of Structure Analysis

### ❌ Wrong
```bash
find . -name "*.py" | xargs cat | grep "def authenticate"
find . -type f -name "auth*" | head -20
ls -la src/ | grep -i auth
```

**Problems:**
- Slow, requires reading all files
- No symbol-level understanding
- Manual filtering needed
- Misses symbols in unexpected files

### ✅ Correct
```bash
cm query authenticate --format ai
cm map . --level 2 --format ai | grep -i auth
cm inspect ./src/auth.py --format ai
```

**Why:** Instant symbol lookup without reading files.

---

## Mistake: Skipping Overview Steps

### ❌ Wrong
```bash
# Immediately searching without context
cm query something --format ai
```

**Problems:**
- No understanding of codebase size
- Don't know where code is organized
- Miss similar/related symbols
- Inefficient exploration

### ✅ Correct
```bash
# Build understanding first
cm stats .                        # How big? What languages?
cm map . --level 2 --format ai    # Where is code organized?
cm query something --format ai    # Now find specific thing
```

**Why:** Context helps you navigate effectively and understand what you find.

---

## Mistake: Using CodeMapper for Full-Text Search

### ❌ Wrong
```bash
cm query "error message text"
cm query "TODO: fix this"
cm query "Connection timeout"
```

**Problems:**
- CodeMapper indexes symbols (functions, classes), not text content
- Strings and comments are not searchable
- Wrong tool for the job

### ✅ Correct
```bash
# Use ripgrep/grep for text search
rg "error message text"
rg "TODO: fix this"
rg "Connection timeout"

# Use CodeMapper for code structure
cm query handle_error --format ai
cm callers handle_error --format ai
```

**When to use what:**
- **CodeMapper:** Symbol names, function definitions, call graphs, test coverage
- **ripgrep/grep:** Error messages, strings, comments, todos, log content

---

## Mistake: Not Checking Test Coverage Before Refactoring

### ❌ Wrong
```bash
# Immediately start refactoring
cm query my_function --show-body --format ai
# ... start making changes ...
```

**Problems:**
- Don't know if function is tested
- Don't know impact radius
- Risk breaking callers
- No safety net

### ✅ Correct
```bash
# Pre-refactoring checklist
cm callers my_function --format ai     # Who depends on this?
cm tests my_function --format ai       # Is it tested?
cm callees my_function --format ai     # What does it depend on?

# Now safe to refactor with full context
```

**Why:** Understanding impact prevents breaking changes.

---

## Mistake: Using `--exact` Too Early

### ❌ Wrong
```bash
# Starting with strict search
cm query myclass --exact --format ai
# (no results found)
```

**Problems:**
- Case-sensitive matching might miss results
- Might have typos in class name
- Don't know if symbol exists

### ✅ Correct
```bash
# Start with fuzzy search (default)
cm query myclass --format ai
# Found: MyClass, MyClassHandler, MyClassFactory

# Use exact when you know exact name
cm query MyClass --exact --format ai
```

**Why:** Fuzzy search is forgiving, helps discover actual names.

---

## Mistake: Ignoring Breaking Changes Detection

### ❌ Wrong
```bash
# Merge PR without checking
git merge feature-branch
```

**Problems:**
- Might introduce breaking API changes
- Don't know what symbols were removed
- Don't know what signatures changed

### ✅ Correct
```bash
# Check before merging
cm since main --breaking --format ai

# Review output for:
# - Removed symbols
# - Changed function signatures
# - Modified interfaces
```

**Why:** Catch breaking changes before they reach production.

---

## Mistake: Not Leveraging Workflow Commands

### ❌ Wrong
```bash
# Manual investigation
cm query function_a --format ai
cm callers function_a --format ai
cm query function_b --format ai
cm callers function_b --format ai
# ... manually connecting the dots
```

**Problems:**
- Time consuming
- Might miss connections
- Hard to see call path

### ✅ Correct
```bash
# Use workflow commands
cm trace main error_handler --format ai    # Shows call path
cm impact my_function --format ai          # Shows definition + callers + tests
```

**Why:** Purpose-built commands are faster and more comprehensive.

---

## Mistake: Using `--show-body` Unnecessarily

### ❌ Wrong
```bash
# Always including full code
cm query authenticate --show-body --format ai
cm callers process_payment --show-body --format ai
cm map . --level 3 --show-body --format ai
```

**Problems:**
- Wastes tokens on code you might not need
- Slower processing
- Cluttered output

### ✅ Correct
```bash
# Start without --show-body
cm query authenticate --format ai
cm callers process_payment --format ai

# Add --show-body only when you need implementation
cm query authenticate --show-body --format ai
```

**Why:** Get overview first, details only when needed.

---

## Mistake: Not Understanding Git Command Requirements

### ❌ Wrong
```bash
# Trying git commands outside a git repo
cd /tmp/some-random-code
cm diff main --format ai
# Error: Not a git repository
```

**Problems:**
- Commands fail without clear reason
- Waste time troubleshooting

### ✅ Correct
```bash
# Check if in git repo first
git status > /dev/null 2>&1
if [ $? -eq 0 ]; then
  cm diff main --format ai
else
  echo "Not a git repository, using non-git commands"
  cm stats .
  cm map . --level 2 --format ai
fi
```

**Git-required commands:** `diff`, `since`, `blame`, `history`
**Works anywhere:** `stats`, `map`, `query`, `inspect`, `callers`, `callees`, `trace`, `tests`, `untested`, `entrypoints`

---

## Mistake: Over-Using `--level 3` Maps

### ❌ Wrong
```bash
# Always using most detailed level
cm map . --level 3 --format ai
```

**Problems:**
- Massive output for large projects
- Wastes tokens
- Hard to see overall structure
- Slow to process

### ✅ Correct
```bash
# Start with level 2 (symbol counts)
cm map . --level 2 --format ai

# Use level 3 only for specific directories
cm map ./src/auth --level 3 --format ai
```

**Level guide:**
- **Level 1:** File paths only - overview of file organization
- **Level 2:** + symbol counts - see where code density is (RECOMMENDED)
- **Level 3:** + all symbols - detailed view for small directories

---

## Mistake: Not Using Untested Code Detection

### ❌ Wrong
```bash
# Manual test coverage checking
find src/ -name "*.py" > src_files.txt
find tests/ -name "test_*.py" > test_files.txt
# ... manually compare files ...
```

**Problems:**
- Time consuming
- Error prone
- Misses functions within files
- Can't see symbol-level coverage

### ✅ Correct
```bash
# Automatic symbol-level coverage
cm untested . --format ai
cm tests specific_function --format ai
cm impact my_function --format ai
```

**Why:** Symbol-level analysis is more accurate than file-level.

---

## Mistake: Forgetting Cache Auto-Management

### ❌ Wrong
```bash
# Manually managing cache
cm --rebuild-cache stats .
cm --rebuild-cache map . --level 2 --format ai
cm --rebuild-cache query authenticate --format ai
```

**Problems:**
- Wastes time rebuilding cache unnecessarily
- Cache is auto-managed based on file changes
- No benefit to manual rebuilding (unless debugging)

### ✅ Correct
```bash
# Just use commands normally
cm stats .
cm map . --level 2 --format ai
cm query authenticate --format ai

# Cache is automatically:
# - Created when needed (projects ≥ 300ms parse time)
# - Updated when files change
# - Skipped for small projects
```

**Only use `--rebuild-cache` when:**
- Debugging cache issues
- Suspecting stale cache (very rare)

---

## Mistake: Using Wrong Tool for Runtime Analysis

### ❌ Wrong
```bash
cm query slow_function --show-body --format ai
# Trying to find performance issues by reading code
```

**Problems:**
- CodeMapper analyzes static structure, not runtime behavior
- Can't see actual execution time
- Can't see memory usage
- Wrong tool for performance analysis

### ✅ Correct
```bash
# Use profilers for runtime analysis
python -m cProfile -s cumtime script.py
node --prof script.js

# Use CodeMapper for structure analysis
cm callers slow_function --format ai    # Who calls it?
cm callees slow_function --format ai    # What does it call?
cm trace main slow_function --format ai # Call path
```

**CodeMapper is for:** Static code structure, call graphs, dependencies
**Profilers are for:** Runtime performance, memory usage, hot paths

---

## Summary: Quick Don'ts

**DON'T:**
- ❌ Forget `--format ai` for LLM context
- ❌ Use grep for call graphs
- ❌ Skip `cm stats` and `cm map` before exploring
- ❌ Use CodeMapper for full-text search
- ❌ Use `--show-body` by default
- ❌ Ignore breaking changes detection
- ❌ Use `--exact` search before trying fuzzy
- ❌ Try git commands outside git repos
- ❌ Use `--level 3` for entire large projects
- ❌ Manually check test coverage
- ❌ Use CodeMapper for runtime analysis

**DO:**
- ✅ Always use `--format ai` for LLMs
- ✅ Use CodeMapper for call graphs and structure
- ✅ Start with stats → map → query workflow
- ✅ Use ripgrep/grep for text search
- ✅ Add `--show-body` only when needed
- ✅ Check breaking changes before merging
- ✅ Start with fuzzy search
- ✅ Know which commands need git
- ✅ Use `--level 2` maps as default
- ✅ Use `cm untested` for coverage
- ✅ Use profilers for performance
