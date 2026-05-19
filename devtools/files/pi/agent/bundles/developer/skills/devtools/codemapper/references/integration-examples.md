# CodeMapper Integration Examples

Practical examples for integrating CodeMapper into development workflows.

## LLM Context Generation (Token-Efficient)

### Basic Codebase Context
```bash
#!/bin/bash
# Generate compact context for LLM analysis

echo "Generating codebase context..."

# Overview
cm stats . > context-stats.txt

# Structure (most important)
cm map . --level 2 --format ai > context-structure.txt

# Public API
cm entrypoints . --format ai > context-api.txt

# Health metrics
cm untested . --format ai | head -30 > context-untested.txt

echo "Context files generated:"
echo "  - context-stats.txt"
echo "  - context-structure.txt (FEED THIS TO LLM)"
echo "  - context-api.txt"
echo "  - context-untested.txt"
```

### Focused Feature Context
```bash
#!/bin/bash
# Generate context for specific feature

FEATURE="authentication"

echo "Generating context for: $FEATURE"

# Find related symbols
cm query $FEATURE --format ai > context-${FEATURE}-symbols.txt

# Find related files
cm map . --level 2 --format ai | grep -i $FEATURE > context-${FEATURE}-files.txt

# Get full implementations
cm query $FEATURE --show-body --format ai > context-${FEATURE}-code.txt

# Find tests
cm tests $FEATURE --format ai > context-${FEATURE}-tests.txt

cat context-${FEATURE}-*.txt > context-${FEATURE}-full.txt
echo "Context saved to: context-${FEATURE}-full.txt"
```

### Change Analysis Context
```bash
#!/bin/bash
# Generate context for understanding recent changes

SINCE="${1:-main}"

echo "Analyzing changes since: $SINCE"

# What changed
cm diff $SINCE --format ai > changes-diff.txt

# Breaking changes
cm since $SINCE --breaking --format ai > changes-breaking.txt

# Impact analysis
echo "Analyzing impact of changes..."
cm diff $SINCE --format ai | grep -E '^[+-]' | cut -d'|' -f1 | sort -u | while read symbol; do
    cm callers "$symbol" --format ai >> changes-impact.txt 2>/dev/null
done

echo "Change analysis saved to:"
echo "  - changes-diff.txt"
echo "  - changes-breaking.txt"
echo "  - changes-impact.txt"
```

---

## CI/CD Integration

### GitHub Actions - Breaking Change Detection

```yaml
# .github/workflows/breaking-changes.yml
name: Breaking Change Detection

on:
  pull_request:
    branches: [main]

jobs:
  check-breaking-changes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Need full history for cm since
      
      - name: Install CodeMapper
        run: |
          # Install cm (adjust for your setup)
          cargo install codemapper
      
      - name: Check for breaking changes
        run: |
          # Compare against base branch
          git fetch origin main
          
          # Check for breaking changes
          if cm since origin/main --breaking | grep -q "BREAKING"; then
            echo "❌ Breaking changes detected!"
            echo "## Breaking Changes" >> $GITHUB_STEP_SUMMARY
            cm since origin/main --breaking --format human >> $GITHUB_STEP_SUMMARY
            exit 1
          fi
          
          echo "✅ No breaking changes detected" >> $GITHUB_STEP_SUMMARY

      - name: Show all changes
        if: always()
        run: |
          echo "## All Symbol Changes" >> $GITHUB_STEP_SUMMARY
          cm since origin/main --format human | head -50 >> $GITHUB_STEP_SUMMARY
```

### GitLab CI - Test Coverage Check

```yaml
# .gitlab-ci.yml
test-coverage:
  stage: test
  script:
    - cargo install codemapper
    
    # Find untested code
    - |
      if cm untested . --format ai | grep -q "function"; then
        echo "❌ Found untested code:"
        cm untested . --format ai | head -20
        exit 1
      fi
    
    - echo "✅ All code has test coverage"
  
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

### Jenkins Pipeline - Code Quality Gate

```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Code Quality Checks') {
            steps {
                sh 'cargo install codemapper'
                
                script {
                    // Check untested code
                    def untested = sh(
                        script: 'cm untested . --format ai | wc -l',
                        returnStdout: true
                    ).trim().toInteger()
                    
                    if (untested > 50) {
                        error("Too many untested functions: ${untested}")
                    }
                    
                    // Check for breaking changes
                    def breaking = sh(
                        script: 'cm since origin/main --breaking | grep -c BREAKING || true',
                        returnStdout: true
                    ).trim().toInteger()
                    
                    if (breaking > 0) {
                        unstable("Breaking changes detected: ${breaking}")
                    }
                }
            }
        }
    }
}
```

---

## Pre-commit Hooks

### Basic Test Coverage Check

```bash
#!/bin/bash
# .git/hooks/pre-commit
# Warn about untested code in staged files

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(py|js|ts|rs|go|java)$')

if [ -z "$STAGED_FILES" ]; then
    exit 0
fi

# Check for untested code
echo "Checking test coverage for staged files..."

UNTESTED=$(cm untested . --format ai | grep -F "$STAGED_FILES" || true)

if [ -n "$UNTESTED" ]; then
    echo "⚠️  Warning: Staged files have untested functions:"
    echo "$UNTESTED"
    echo ""
    echo "Consider adding tests before committing."
    echo "To commit anyway: git commit --no-verify"
    exit 1
fi

echo "✅ All staged code has test coverage"
exit 0
```

### Breaking Change Warning

```bash
#!/bin/bash
# .git/hooks/pre-push
# Warn before pushing breaking changes

# Check against remote main
git fetch origin main 2>/dev/null

BREAKING=$(cm since origin/main --breaking 2>/dev/null | grep -c "BREAKING" || true)

if [ "$BREAKING" -gt 0 ]; then
    echo "⚠️  WARNING: Pushing breaking changes!"
    echo ""
    cm since origin/main --breaking --format human
    echo ""
    read -p "Continue with push? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

exit 0
```

---

## Documentation Generation

### Architecture Documentation

```bash
#!/bin/bash
# generate-architecture-docs.sh

echo "Generating architecture documentation..."

mkdir -p docs/architecture

# Overall structure
cat > docs/architecture/STRUCTURE.md << EOF
# Project Structure

Generated: $(date)

## Statistics

$(cm stats .)

## File Organization

$(cm map . --level 2)

EOF

# Public API
cat > docs/architecture/API.md << EOF
# Public API

Generated: $(date)

## Exported Symbols

$(cm entrypoints .)

EOF

# Test coverage
cat > docs/architecture/COVERAGE.md << EOF
# Test Coverage

Generated: $(date)

## Untested Code

$(cm untested . | head -100)

EOF

echo "✅ Documentation generated in docs/architecture/"
```

### API Reference from Code

```bash
#!/bin/bash
# generate-api-docs.sh

# Find all public classes/interfaces
cm entrypoints . --exports-only --format ai | while read line; do
    SYMBOL=$(echo $line | cut -d'|' -f1)
    FILE=$(echo $line | cut -d'|' -f3)
    
    echo "## $SYMBOL"
    echo ""
    echo "**File:** \`$FILE\`"
    echo ""
    
    # Get definition with docstring
    cm query "$SYMBOL" --context full --show-body | head -50
    echo ""
    
    # Show usage examples
    echo "### Usage"
    echo ""
    cm callers "$SYMBOL" --format ai | head -10
    echo ""
    echo "---"
    echo ""
done > docs/API.md

echo "✅ API documentation generated: docs/API.md"
```

---

## Code Review Workflows

### Automated PR Analysis

```bash
#!/bin/bash
# analyze-pr.sh
# Run this to analyze a PR before review

BASE_BRANCH="${1:-main}"

echo "=== PR Analysis ==="
echo ""

# 1. What changed
echo "## Changes"
cm diff $BASE_BRANCH --format human | head -50
echo ""

# 2. Breaking changes
echo "## Breaking Changes"
BREAKING=$(cm since $BASE_BRANCH --breaking)
if [ -n "$BREAKING" ]; then
    echo "⚠️  BREAKING CHANGES DETECTED!"
    echo "$BREAKING"
else
    echo "✅ No breaking changes"
fi
echo ""

# 3. Test coverage
echo "## Test Coverage"
UNTESTED=$(cm untested . --format ai | wc -l)
echo "Untested functions: $UNTESTED"
if [ "$UNTESTED" -gt 0 ]; then
    echo "Top untested functions:"
    cm untested . --format ai | head -20
fi
echo ""

# 4. Code quality metrics
echo "## Code Quality"
cm stats .
echo ""

# 5. Public API changes
echo "## Public API Changes"
cm diff $BASE_BRANCH --format ai | grep -E "^[+-]" | grep -E "(export|pub |public )" | head -20
```

### Impact Analysis for Changed Functions

```bash
#!/bin/bash
# impact-analysis.sh
# Analyze impact of changed functions

BASE_BRANCH="${1:-main}"

echo "=== Impact Analysis ==="
echo ""

# Find changed functions
CHANGED=$(cm diff $BASE_BRANCH --format ai | grep -E "^[+-]" | cut -d'|' -f1 | sort -u)

if [ -z "$CHANGED" ]; then
    echo "No functions changed"
    exit 0
fi

echo "$CHANGED" | while read FUNC; do
    echo "## $FUNC"
    echo ""
    
    # Who calls this?
    echo "### Callers"
    CALLERS=$(cm callers "$FUNC" --format ai 2>/dev/null)
    if [ -n "$CALLERS" ]; then
        echo "$CALLERS" | head -10
    else
        echo "No callers found"
    fi
    echo ""
    
    # Is it tested?
    echo "### Tests"
    TESTS=$(cm tests "$FUNC" --format ai 2>/dev/null)
    if [ -n "$TESTS" ]; then
        echo "✅ Tested"
        echo "$TESTS"
    else
        echo "❌ Not tested"
    fi
    echo ""
    echo "---"
    echo ""
done
```

---

## Development Scripts

### Smart Code Search

```bash
#!/bin/bash
# smart-search.sh
# Search with fallback to ripgrep

TERM="$1"

if [ -z "$TERM" ]; then
    echo "Usage: $0 <search-term>"
    exit 1
fi

# Try CodeMapper first (for symbols)
echo "Searching for symbol: $TERM"
RESULTS=$(cm query "$TERM" --format ai 2>/dev/null)

if [ -n "$RESULTS" ]; then
    echo "Found as symbol:"
    echo "$RESULTS"
    echo ""
    echo "See callers with: cm callers '$TERM' --format ai"
    echo "See definition with: cm query '$TERM' --show-body --format ai"
else
    echo "Not found as symbol, searching text with ripgrep..."
    rg "$TERM"
fi
```

### Function Impact Report

```bash
#!/bin/bash
# function-impact.sh
# Complete impact report for a function

FUNC="$1"

if [ -z "$FUNC" ]; then
    echo "Usage: $0 <function-name>"
    exit 1
fi

cat > impact-$FUNC.md << EOF
# Impact Report: $FUNC

Generated: $(date)

## Definition

$(cm query "$FUNC" --show-body --format ai)

## Callers (Dependencies)

$(cm callers "$FUNC" --format ai)

## Callees (What it calls)

$(cm callees "$FUNC" --format ai)

## Tests

$(cm tests "$FUNC" --format ai)

## Call Paths

Finding paths from main entry points...

$(cm trace main "$FUNC" --format ai 2>/dev/null || echo "No path from main")

## Git History

$(cm history "$FUNC" . 2>/dev/null || echo "Not in git or no history")

EOF

echo "✅ Impact report saved to: impact-$FUNC.md"
cat impact-$FUNC.md
```

### Codebase Health Dashboard

```bash
#!/bin/bash
# health-dashboard.sh
# Generate codebase health metrics

cat > health-report.md << EOF
# Codebase Health Report

Generated: $(date)

## Overview

$(cm stats .)

## Test Coverage

Total untested functions: $(cm untested . --format ai | wc -l)

Top 20 untested:
$(cm untested . --format ai | head -20)

## Potential Dead Code

Exported but never called internally:
$(cm entrypoints . --format ai | head -20)

## Recent Changes (since last week)

$(git log --since="1 week ago" --oneline | head -1 > /dev/null && cm since "$(git log --since='1 week ago' --format=%H | tail -1)" --format ai || echo "No git history")

## Complexity Indicators

Functions with most callers (high impact):
$(cm callers --format ai 2>/dev/null | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10 || echo "Analysis not available")

EOF

cat health-report.md
```

---

## IDE Integration Examples

### VSCode Task

```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "CodeMapper: Find Callers",
      "type": "shell",
      "command": "cm callers ${selectedText} --format human",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "CodeMapper: Show Tests",
      "type": "shell",
      "command": "cm tests ${selectedText} --format human",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "CodeMapper: Impact Analysis",
      "type": "shell",
      "command": "cm impact ${selectedText} --format human",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    }
  ]
}
```

### Shell Alias

```bash
# Add to ~/.bashrc or ~/.zshrc

# Quick CodeMapper aliases
alias cms='cm stats .'
alias cmm='cm map . --level 2 --format ai'
alias cmq='cm query'
alias cmc='cm callers'
alias cmt='cm tests'
alias cmu='cm untested . --format ai'

# Function for quick impact analysis
cmi() {
    echo "Impact Analysis: $1"
    echo "===================="
    echo "Definition:"
    cm query "$1" --show-body --format ai
    echo ""
    echo "Callers:"
    cm callers "$1" --format ai
    echo ""
    echo "Tests:"
    cm tests "$1" --format ai
}

# Function for pre-push check
cmpush() {
    echo "Pre-push checks..."
    echo "Breaking changes:"
    cm since origin/main --breaking --format human
    echo ""
    echo "Untested code:"
    cm untested . --format ai | head -10
}
```

---

## Monitoring and Metrics

### Weekly Metrics Collection

```bash
#!/bin/bash
# weekly-metrics.sh
# Collect metrics for tracking over time

DATE=$(date +%Y-%m-%d)
METRICS_DIR="metrics"
mkdir -p $METRICS_DIR

# Collect metrics
{
    echo "date,total_files,total_symbols,untested_count,test_coverage_pct"
    
    TOTAL_FILES=$(cm stats . | grep "Total Files" | awk '{print $NF}')
    TOTAL_SYMBOLS=$(cm stats . | grep "Total Symbols" | awk '{print $NF}')
    UNTESTED=$(cm untested . --format ai | wc -l)
    TESTED=$((TOTAL_SYMBOLS - UNTESTED))
    COVERAGE=$(echo "scale=2; $TESTED * 100 / $TOTAL_SYMBOLS" | bc)
    
    echo "$DATE,$TOTAL_FILES,$TOTAL_SYMBOLS,$UNTESTED,$COVERAGE"
} >> $METRICS_DIR/metrics.csv

echo "✅ Metrics collected for $DATE"
```

### Quality Trends

```bash
#!/bin/bash
# quality-trends.sh
# Show quality trends over time

echo "Code Quality Trends"
echo "===================="
echo ""

if [ -f metrics/metrics.csv ]; then
    tail -10 metrics/metrics.csv | column -t -s,
else
    echo "No metrics history found. Run weekly-metrics.sh first."
fi
```

---

## Integration Patterns Summary

**For LLM Context:**
- Use `--format ai` always
- Generate structure + stats files
- Save to context files for LLM ingestion

**For CI/CD:**
- Check breaking changes with `cm since --breaking`
- Enforce test coverage with `cm untested`
- Fail builds on quality issues

**For Code Review:**
- Analyze PRs with `cm diff` and `cm since`
- Check impact with `cm callers` and `cm tests`
- Generate impact reports automatically

**For Documentation:**
- Generate API docs from `cm entrypoints`
- Create architecture diagrams from `cm map`
- Track coverage with `cm untested`

**For Development:**
- Create shell aliases for common commands
- Build impact analysis scripts
- Add pre-commit/pre-push hooks
