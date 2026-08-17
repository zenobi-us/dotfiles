# CodeMapper Troubleshooting Guide

Solutions to common issues and problems with CodeMapper.

## Problem: No Symbols Found

### Symptoms
```bash
cm query MyClass --format ai
# No results found

cm stats .
# Shows 0 functions, 0 classes
```

### Solutions

#### 1. Check Language Support
```bash
# See what was actually indexed
cm stats .
```

**Look at "Files by Language" section.** If your language isn't listed, it's not supported.

**Supported languages:** Python, JavaScript, TypeScript, Rust, Java, Go, C, Markdown

**File extensions recognized:**
- Python: `.py`
- JavaScript: `.js`, `.jsx`
- TypeScript: `.ts`, `.tsx`
- Rust: `.rs`
- Java: `.java`
- Go: `.go`
- C: `.c`, `.h`
- Markdown: `.md`

#### 2. Check File Extensions
```bash
# Override default extensions
cm stats . --extensions py,js,ts,custom

# For non-standard extensions
cm query MyClass --extensions py,pyx --format ai
```

#### 3. Try Fuzzy Search
```bash
# Fuzzy (default) - case-insensitive
cm query myclass --format ai

# You might have been using exact by mistake
cm query MyClass --exact --format ai
```

#### 4. Check File Encoding
CodeMapper expects UTF-8 encoded files. Files with other encodings might fail to parse.

```bash
# Check file encoding
file --mime-encoding src/*.py

# Convert to UTF-8 if needed
iconv -f ISO-8859-1 -t UTF-8 file.py > file_utf8.py
```

#### 5. Check for Parse Errors
Some malformed code might not parse correctly. Check if files have syntax errors.

```bash
# For Python
python -m py_compile file.py

# For JavaScript/TypeScript
npx tsc --noEmit file.ts

# For Rust
cargo check
```

---

## Problem: Slow Queries

### Symptoms
```bash
cm query MyClass --format ai
# Takes 10+ seconds
```

### Solutions

#### 1. First Run is Slow (Normal)
First run on large projects builds cache (~10s for 1000+ files). This is normal.

```bash
# First run (slow)
cm stats .  # ~10 seconds

# Subsequent runs (fast)
cm stats .  # ~0.5 seconds
```

**Solution:** Just wait for first run to complete. Cache will make subsequent runs fast.

#### 2. Cache Not Being Created
Check if cache directory exists:
```bash
ls -la .codemapper/
```

If it doesn't exist on large project:
- Cache only created for projects ≥ 300ms parse time
- Small projects don't need cache
- Check permissions on project directory

#### 3. Cache is Stale
Rare issue where cache doesn't detect file changes.

```bash
# Force cache rebuild
cm --rebuild-cache stats .
```

#### 4. Very Large Repository
For repos with 1000+ files, fast mode auto-enables. If still slow:

```bash
# Check project size
cm stats . | grep "Total Files"

# If > 10,000 files, consider:
# 1. Analyzing subdirectories separately
cm stats ./src --format ai
cm stats ./lib --format ai

# 2. Using specific extensions only
cm stats . --extensions py,js --format ai
```

#### 5. Disable Cache Temporarily
If cache is causing issues:
```bash
cm --no-cache stats .
```

---

## Problem: Git Commands Fail

### Symptoms
```bash
cm diff main --format ai
# Error: Not a git repository

cm since v1.0 --format ai
# Error: fatal: not a git repository
```

### Solutions

#### 1. Not in Git Repository
Git commands require a git repository.

```bash
# Check if in git repo
git status

# If not, initialize
git init

# Or use non-git commands
cm stats .
cm map . --level 2 --format ai
cm query MyClass --format ai
```

**Git-required commands:** `diff`, `since`, `blame`, `history`

**Work anywhere:** `stats`, `map`, `query`, `inspect`, `callers`, `callees`, `trace`, `tests`, `untested`, `entrypoints`, `deps`, `types`, `implements`, `schema`, `impact`, `test-deps`

#### 2. Commit/Branch Doesn't Exist
```bash
# Check if commit exists
git log --oneline | grep v1.0

# Check available branches
git branch -a

# Use existing commit/branch
cm since main --format ai
cm diff HEAD~1 --format ai
```

#### 3. File Not in Git History
```bash
cm blame my_function ./new_file.py
# Error: file not in git history
```

**Solution:** File must be committed at least once.

```bash
git add new_file.py
git commit -m "Add new file"
cm blame my_function ./new_file.py
```

---

## Problem: Output Too Verbose

### Symptoms
```bash
cm map . --level 2
# Hundreds of lines of markdown output
```

### Solutions

#### 1. Use `--format ai`
```bash
# Instead of default markdown
cm map . --level 2 --format ai

# 60-80% token reduction
```

#### 2. Use `--context minimal`
```bash
# Signatures only, no docstrings
cm query MyClass --context minimal --format ai
```

#### 3. Don't Use `--show-body` Unless Needed
```bash
# Without code (faster, more compact)
cm query MyClass --format ai

# With code (only when you need implementation)
cm query MyClass --show-body --format ai
```

#### 4. Use Appropriate Map Level
```bash
# Too detailed
cm map . --level 3 --format ai

# Just right (recommended)
cm map . --level 2 --format ai

# Minimal
cm map . --level 1 --format ai
```

#### 5. Filter Output
```bash
# Pipe to head for preview
cm untested . --format ai | head -20

# Filter by path
cm map . --level 2 --format ai | grep src/

# Save to file for later
cm map . --level 2 --format ai > codebase-map.txt
```

---

## Problem: Can't Find Test Coverage

### Symptoms
```bash
cm tests my_function --format ai
# No tests found

cm untested . --format ai
# Shows everything as untested
```

### Solutions

#### 1. Check Test File Patterns
CodeMapper detects tests by:
- File patterns: `test_*.py`, `*_test.py`, `*.test.js`, `*_test.go`, `*_test.rs`
- Function patterns: `test*`, `Test*`
- Decorators/attributes: `@Test`, `#[test]`

```bash
# Check if test files are indexed
cm stats . | grep -i test

# Check test file names match patterns
ls tests/
```

#### 2. Use Correct Directory Structure
```bash
# Good patterns
tests/test_auth.py
src/auth_test.go
lib/__tests__/parser.test.js

# Won't be detected
tests/authentication.py  # Missing test_ prefix
src/check_auth.py        # Not named as test
```

#### 3. Check Test Function Names
```python
# Good (detected)
def test_authentication():
    pass

def test_process_payment():
    pass

# Not detected
def verify_authentication():  # Missing test prefix
    pass
```

#### 4. Use `test-deps` to Verify
```bash
# Check what a test actually calls
cm test-deps ./tests/test_auth.py --format ai
```

If test file is indexed but not detecting coverage:
- Test might not actually call the function
- Test might use mocks/stubs instead of real function

---

## Problem: Breaking Changes Not Detected

### Symptoms
```bash
cm since main --breaking --format ai
# Shows no breaking changes when you know there are some
```

### Solutions

#### 1. Check Commit Range
```bash
# Make sure commits exist
git log --oneline main..HEAD

# Try different base
cm since HEAD~5 --breaking --format ai
cm since origin/main --breaking --format ai
```

#### 2. Understand What's "Breaking"
Breaking changes are:
- Removed functions/classes
- Changed function signatures (parameters, return type)
- Removed methods from classes

**Not breaking** (shown in `cm since` but not `--breaking`):
- Added functions
- Changed implementation
- Modified function body

#### 3. Check File Paths
```bash
# Make sure files are indexed
cm stats .

# Check specific file changes
cm diff main --format ai | grep my_function
```

---

## Problem: Call Graph Incomplete

### Symptoms
```bash
cm callers my_function --format ai
# Missing some callers you know exist
```

### Solutions

#### 1. Check for Dynamic Calls
CodeMapper analyzes static code. It might miss:
- Dynamic imports: `importlib.import_module()`
- Eval/exec: `eval("my_function()")`
- Reflection: `getattr(obj, "my_function")()`

These are inherently hard to analyze statically.

#### 2. Check for Different Languages
```bash
# If you have polyglot codebase
cm stats . | grep "Files by Language"

# Make sure all languages are indexed
cm --extensions py,js,ts,go stats .
```

#### 3. Anonymous Functions
```bash
# Include anonymous/lambda functions
cm callers my_function --full --format ai
```

#### 4. Check File Scope
```bash
# Are callers in ignored directories?
cm map . --level 2 --format ai | grep -i test
cm map . --level 2 --format ai | grep -i vendor
```

---

## Problem: Cache Issues

### Symptoms
```bash
cm stats .
# Warning: Failed to save cache

# Or: outdated results after file changes
```

### Solutions

#### 1. Permission Issues
```bash
# Check cache directory permissions
ls -la .codemapper/

# Fix permissions
chmod -R u+w .codemapper/
```

#### 2. Disk Space
```bash
# Check available space
df -h .

# Clean old caches if needed
rm -rf .codemapper/
```

#### 3. Cache Corruption
```bash
# Rebuild cache from scratch
cm --rebuild-cache stats .
```

#### 4. File System Issues
```bash
# Use custom cache location
cm --cache-dir /tmp/cm-cache stats .

# Or set environment variable
export CODEMAPPER_CACHE_DIR=/tmp/cm-cache
cm stats .
```

#### 5. Disable Cache
```bash
# If cache keeps causing issues
cm --no-cache stats .
cm --no-cache query MyClass --format ai
```

---

## Problem: Memory Issues

### Symptoms
```bash
cm stats .
# Killed (out of memory)
```

### Solutions

#### 1. Very Large Repository
For extremely large repos (10,000+ files):

```bash
# Analyze subdirectories separately
cm stats ./src --format ai
cm stats ./lib --format ai
cm stats ./tests --format ai
```

#### 2. Limit File Types
```bash
# Only analyze specific languages
cm stats . --extensions py,js --format ai
```

#### 3. Use Fast Mode Explicitly
```bash
# Force fast mode for large repos
cm --fast stats .
```

---

## Problem: Wrong Symbol Detected

### Symptoms
```bash
cm query MyClass --format ai
# Finds wrong class or multiple unrelated classes
```

### Solutions

#### 1. Use `--exact` Search
```bash
# Fuzzy might match too broadly
cm query MyClass --exact --format ai
```

#### 2. Check in Specific File
```bash
# Inspect specific file
cm inspect ./src/models/user.py --format ai
```

#### 3. Filter by Context
```bash
# Look at signature to distinguish
cm query MyClass --format ai
# Then check output for correct file path
```

---

## Problem: Performance Degradation Over Time

### Symptoms
Queries were fast, now slow after weeks of use.

### Solutions

#### 1. Cache Grew Too Large
```bash
# Remove and rebuild cache
rm -rf .codemapper/
cm stats .
```

#### 2. Git History Grew Large
For `blame` and `history` commands on repos with huge git history:

```bash
# Use shallow clone for analysis
git clone --depth 1000 <repo>
```

#### 3. Too Many Files
```bash
# Check project growth
cm stats . | grep "Total Files"

# Consider analyzing subdirectories
```

---

## Getting Help

### Diagnostic Information

When reporting issues, include:

```bash
# CodeMapper version
cm --help | head -1

# Project statistics
cm stats .

# Cache status
ls -lah .codemapper/

# Git status (for git commands)
git status
git log --oneline -5

# System info
uname -a
df -h .
```

### Common Diagnostic Commands

```bash
# Test basic functionality
cm stats .

# Test cache
cm --no-cache stats .
cm --rebuild-cache stats .

# Test specific command
cm query test --format ai

# Verbose error messages
cm diff main --format ai 2>&1
```

---

## Quick Troubleshooting Checklist

**No symbols found:**
- ✓ Run `cm stats .` to see what's indexed
- ✓ Check file extensions with `--extensions`
- ✓ Try fuzzy search (remove `--exact`)
- ✓ Verify file encoding is UTF-8

**Slow queries:**
- ✓ First run is normal (~10s for large projects)
- ✓ Check if cache was created (`.codemapper/`)
- ✓ Try `--rebuild-cache` if stale
- ✓ Use `--no-cache` to test

**Git commands fail:**
- ✓ Run `git status` to verify git repo
- ✓ Check commit exists with `git log`
- ✓ Use non-git commands for non-git projects

**Output too verbose:**
- ✓ Use `--format ai` always for LLMs
- ✓ Remove `--show-body` unless needed
- ✓ Use `--level 2` for maps
- ✓ Pipe to `head` for preview

**Test coverage issues:**
- ✓ Check test file naming patterns
- ✓ Check test function naming
- ✓ Use `cm test-deps` to verify
- ✓ Run `cm stats . | grep test`

**Cache issues:**
- ✓ Check permissions on `.codemapper/`
- ✓ Try `--rebuild-cache`
- ✓ Use `--no-cache` as workaround
- ✓ Set `CODEMAPPER_CACHE_DIR` to custom location
