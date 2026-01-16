# CodeMapper Workflows

Detailed workflow patterns for common development tasks.

## Workflow 1: Exploring Unknown Codebase

**Use when:** First time looking at unfamiliar code, need to understand structure.

```bash
# Step 1: Get project overview
cm stats .
# Output: Language breakdown, symbol counts, file counts

# Step 2: See file structure with symbol counts
cm map . --level 2 --format ai
# Output: Compact file listing with function/class counts per file

# Step 3: Find specific symbols
cm query authenticate --format ai
# Output: Where the symbol is defined

# Step 4: Deep dive into a file
cm inspect ./path/to/file --format ai
# Output: All symbols in that specific file
```

**Why this order:**
1. Stats gives you size and scope
2. Map shows you where code lives
3. Query finds specific functionality
4. Inspect reveals file details

## Workflow 2: Finding and Fixing a Bug

**Use when:** Bug reported, need to understand code flow and find root cause.

```bash
# Step 1: Find the suspected function
cm query <function_name> --show-body --format ai

# Step 2: See who calls it (where bug might originate)
cm callers <function_name> --format ai

# Step 3: Trace execution path from entry point
cm trace <entry_point> <function_name> --format ai

# Step 4: Check if there are existing tests
cm tests <function_name> --format ai

# Step 5: After fix, verify impact
cm callers <function_name> --format ai
cm tests <function_name> --format ai
```

**Example:**
```bash
cm query process_payment --show-body --format ai
cm callers process_payment --format ai
cm trace checkout process_payment --format ai
cm tests process_payment --format ai
```

## Workflow 3: Pre-Refactoring Analysis

**Use when:** About to refactor code, need to understand impact radius.

```bash
# Step 1: Understand who depends on this
cm callers <function_name> --format ai
# Shows: All places that call this function

# Step 2: Check test coverage
cm tests <function_name> --format ai
# Shows: Tests that verify this function

# Step 3: See what it depends on
cm callees <function_name> --format ai
# Shows: Functions this calls (what might break)

# Step 4: See full implementation
cm query <function_name> --show-body --format ai

# After refactoring:
# Step 5: Check for breaking changes
cm since main --breaking --format ai
```

**Checklist pattern:**
```bash
# Pre-refactor checklist
echo "Impact Analysis for: my_function"
echo "================================"
echo "Callers (impact radius):"
cm callers my_function --format ai
echo ""
echo "Tests (safety net):"
cm tests my_function --format ai
echo ""
echo "Dependencies (what we rely on):"
cm callees my_function --format ai
```

## Workflow 4: Understanding an API

**Use when:** Need to understand public interface, find implementations.

```bash
# Step 1: Find public API surface
cm entrypoints . --format ai
# Shows: Exported symbols with no internal callers

# Step 2: Find all implementations of an interface
cm implements <interface_name> --format ai
# Shows: All classes implementing this interface

# Step 3: Understand data structure
cm schema <class_name> --format ai
# Shows: Field structure for data classes

# Step 4: See type flows
cm types <function_name> --format ai
# Shows: Parameter and return types
```

**Example:**
```bash
# Understanding payment API
cm entrypoints ./src/payment --format ai
cm implements PaymentProcessor --format ai
cm schema PaymentRequest --format ai
cm types process_payment --format ai
```

## Workflow 5: Code Health Audit

**Use when:** Need to assess code quality, find gaps in testing or documentation.

```bash
# Step 1: Find untested code
cm untested . --format ai
# Shows: Functions not called by any test

# Step 2: Find potentially dead code
cm entrypoints . --format ai
# Shows: Exported but never called internally

# Step 3: Check breaking changes since release
cm since v1.0 --breaking --format ai
# Shows: Removed symbols and signature changes

# Step 4: Get full changelog
cm since v1.0 --format ai
# Shows: All symbol changes
```

**Regular health check pattern:**
```bash
# Weekly code health check
echo "Code Health Report"
echo "=================="
echo ""
echo "Untested Functions:"
cm untested . --format ai | head -20
echo ""
echo "Unused Exports (potential dead code):"
cm entrypoints . --format ai | head -20
echo ""
echo "Breaking Changes since main:"
cm since main --breaking --format ai
```

## Workflow 6: Code Review Workflow

**Use when:** Reviewing PR, need to understand changes and impact.

```bash
# Step 1: See what changed at symbol level
cm diff main --format ai
# Shows: Added/removed/modified symbols

# Step 2: Check for breaking changes
cm since main --breaking --format ai
# Shows: API breaks (removed symbols, signature changes)

# Step 3: Find untested new code
cm untested . --format ai
# Shows: Functions without test coverage

# Step 4: Verify public API surface didn't grow unexpectedly
cm entrypoints . --format ai
# Shows: What's exposed publicly
```

## Workflow 7: Debugging Call Chains

**Use when:** Need to trace how execution reaches a particular function.

```bash
# Step 1: Find the function
cm query <target_function> --show-body --format ai

# Step 2: See who calls it
cm callers <target_function> --format ai

# Step 3: Trace from known entry point
cm trace <entry_point> <target_function> --format ai
# Shows: Shortest call path

# Step 4: See what it calls (for deeper issues)
cm callees <target_function> --format ai
```

**Example - Tracing error handler:**
```bash
cm query handle_error --show-body --format ai
cm callers handle_error --format ai
cm trace main handle_error --format ai
cm callees handle_error --format ai
```

## Workflow 8: Understanding Type Flows

**Use when:** Need to understand data structures and type dependencies.

```bash
# Step 1: See types used in function
cm types <function_name> --format ai
# Shows: Parameter types, return type, where defined

# Step 2: See field structure of data class
cm schema <class_name> --format ai
# Shows: All fields, their types, locations

# Step 3: Find all implementations
cm implements <interface_name> --format ai
# Shows: Classes implementing interface
```

**Example - Understanding user data flow:**
```bash
cm types authenticate --format ai
cm schema User --format ai
cm implements UserRepository --format ai
```

## Workflow 9: Git History Investigation

**Use when:** Need to understand when/why code changed, who changed it.

```bash
# Step 1: See who last modified
cm blame <symbol_name> <file_path>
# Shows: Last commit, author, date

# Step 2: See full history
cm history <symbol_name> <file_path>
# Shows: All commits touching this symbol

# Step 3: See changes since specific point
cm since <commit> --format ai
# Shows: All symbol changes since that commit
```

**Example - Investigating authentication changes:**
```bash
cm blame authenticate ./src/auth.py
cm history authenticate ./src/auth.py
cm since v1.0 --format ai | grep -i auth
```

## Workflow 10: Test Coverage Analysis

**Use when:** Need to understand test coverage and gaps.

```bash
# Step 1: Find untested code
cm untested . --format ai
# Shows: Functions not called by tests

# Step 2: See what tests cover specific function
cm tests <function_name> --format ai
# Shows: Tests that call this function

# Step 3: See what production code a test covers
cm test-deps <test_file> --format ai
# Shows: Production symbols called by test

# Step 4: Impact analysis (tests + callers)
cm impact <function_name> --format ai
# Shows: Definition, callers, and tests
```

**Example - Coverage analysis:**
```bash
cm untested ./src --format ai
cm tests process_payment --format ai
cm test-deps ./tests/test_payment.py --format ai
cm impact process_payment --format ai
```

## Integration Patterns

### For LLM Context (Token-Efficient)
Always use `--format ai` to minimize tokens:
```bash
cm map . --level 2 --format ai > codebase-structure.txt
cm query authenticate --show-body --format ai > auth-logic.txt
cm callers process_payment --format ai > payment-usage.txt
```

### For CI/CD (Breaking Change Detection)
```bash
#!/bin/bash
# Fail build if breaking changes detected
if cm since main --breaking | grep -q "BREAKING"; then
  echo "❌ Breaking changes detected!"
  cm since main --breaking --format human
  exit 1
fi
echo "✅ No breaking changes"
```

### For Documentation Generation
```bash
# Use default format for markdown output
cm map . --level 2 > docs/ARCHITECTURE.md
cm entrypoints . > docs/API.md
cm stats . > docs/STATS.md
```

### For Pre-commit Hook
```bash
#!/bin/bash
# Check for untested code in staged files
staged_files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(py|js|ts)$')
if [ -n "$staged_files" ]; then
  untested=$(cm untested . --format ai | grep -F "$staged_files")
  if [ -n "$untested" ]; then
    echo "⚠️  Warning: Staged files have untested functions"
    echo "$untested"
  fi
fi
```

## Common Task Patterns

### "Where is this function?"
```bash
cm query <function_name> --format ai
```

### "Who uses this?"
```bash
cm callers <function_name> --format ai
```

### "What changed?"
```bash
cm diff main --format ai
cm since v1.0 --format ai
```

### "Is this tested?"
```bash
cm tests <function_name> --format ai
```

### "What's the call path?"
```bash
cm trace <from> <to> --format ai
```

### "What's not tested?"
```bash
cm untested . --format ai
```

### "What's the public API?"
```bash
cm entrypoints . --format ai
```

### "Show me the structure"
```bash
cm schema <class> --format ai
cm types <function> --format ai
```

## Advanced Patterns

### Snapshot Comparison Workflow
```bash
# Before major refactor
cm snapshot pre-refactor

# ... do refactoring work ...

# Compare changes
cm compare pre-refactor --format ai

# Check breaking changes
cm since main --breaking --format ai
```

### Cross-Repository Analysis
```bash
# Analyze multiple projects
for repo in project1 project2 project3; do
  echo "=== $repo ==="
  cd $repo
  cm stats .
  cm untested . --format ai | head -10
  cd ..
done
```

### Finding Similar Patterns
```bash
# Find all implementations of a pattern
cm implements Repository --format ai
cm implements Handler --format ai
cm implements Validator --format ai
```

### Impact Radius Analysis
```bash
# Full impact analysis for a function
function analyze_impact() {
  local func=$1
  echo "Impact Analysis: $func"
  echo "===================="
  echo "Definition:"
  cm query $func --show-body --format ai
  echo ""
  echo "Callers:"
  cm callers $func --format ai
  echo ""
  echo "Callees:"
  cm callees $func --format ai
  echo ""
  echo "Tests:"
  cm tests $func --format ai
}

analyze_impact process_payment
```
