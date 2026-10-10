---
name: codemapper
description: Use when analyzing codebases for structure, finding symbols, tracing call paths, checking test coverage, or analyzing dependencies - provides instant AST-based code analysis using tree-sitter for Python, JavaScript, TypeScript, Rust, Java, Go, and C
---

# CodeMapper (cm) - Fast Code Analysis

## Overview

CodeMapper (`cm`) uses tree-sitter AST parsing to provide instant code analysis without databases. Get project structure, find symbols, trace call graphs, and analyze dependencies in milliseconds.

**Supported Languages:** Python, JavaScript, TypeScript, Rust, Java, Go, C, Markdown

## When to Use

Use CodeMapper when you need to:
- ✅ Explore unfamiliar codebases (get overview, find structure)
- ✅ Find symbol definitions and usages (functions, classes, methods)
- ✅ Understand call graphs (who calls what, call paths)
- ✅ Check test coverage (find untested code)
- ✅ Analyze git changes at symbol level (breaking changes)
- ✅ Pre-refactoring impact analysis (understand dependencies)

**Don't use for:**
- ❌ Full-text search (use ripgrep/grep instead)
- ❌ Runtime analysis (use profilers)
- ❌ Code execution (use interpreters/compilers)

## Quick Start

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

**🔥 CRITICAL: Always use `--format ai` when analyzing code for LLM context. This is the most token-efficient format (60-80% reduction).**

## Essential Commands

| Task | Command |
|------|---------|
| Project overview | `cm stats .` |
| File structure | `cm map . --level 2 --format ai` |
| Find symbol | `cm query <name> --format ai` |
| Show implementation | `cm query <name> --show-body --format ai` |
| Who calls it? | `cm callers <symbol> --format ai` |
| What does it call? | `cm callees <symbol> --format ai` |
| Call path A→B | `cm trace <from> <to> --format ai` |
| Find tests | `cm tests <symbol> --format ai` |
| Untested code | `cm untested . --format ai` |
| Breaking changes | `cm since <commit> --breaking --format ai` |

**For complete command reference:** Read `references/command-reference.md`

## Key Workflows

### Exploring Unknown Code
```bash
cm stats .
cm map . --level 2 --format ai
cm query <symbol> --format ai
```

### Before Refactoring
```bash
cm callers <function> --format ai      # Who depends on this?
cm tests <function> --format ai        # Is it tested?
cm callees <function> --format ai      # What does it depend on?
```

### Code Health Check
```bash
cm untested . --format ai                       # What's not tested?
cm since <last_release> --breaking --format ai  # Breaking changes?
```

**For detailed workflows:** Read `references/workflows.md`

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

### ❌ Skipping stats/map
```bash
# Bad (jumping to query without context)
cm query something --format ai

# Good (understand structure first)
cm stats .
cm map . --level 2 --format ai
cm query something --format ai
```

**For more examples:** Read `references/common-mistakes.md`

## Best Practices

1. **Always start with overview:** `cm stats .` then `cm map . --level 2 --format ai`
2. **Always use `--format ai` for LLMs:** Token efficiency matters
3. **Fuzzy search first:** Default fuzzy matching is more forgiving
4. **Check before refactoring:** Run `cm callers` and `cm tests` before changes
5. **Use correct tool:** CodeMapper for structure/calls, ripgrep for text search

## Troubleshooting

**No Symbols Found?**
- Check file extensions: `cm stats .` shows what's indexed
- Try fuzzy search (default) vs `--exact`

**Slow Queries?**
- First run builds cache (~10s)
- Subsequent runs use cache (~0.5s)

**Git Commands Fail?**
- Must be in a git repository for: `diff`, `since`, `blame`, `history`

**For detailed troubleshooting:** Read `references/troubleshooting.md`

## Reference Documentation

- **`references/command-reference.md`** - Complete command and flag reference
- **`references/workflows.md`** - Detailed workflow patterns for common tasks
- **`references/common-mistakes.md`** - Extended examples of what to avoid
- **`references/troubleshooting.md`** - Comprehensive troubleshooting guide
- **`references/integration-examples.md`** - CI/CD, documentation, code review patterns

## Performance

- **Small repos** (< 100 files): < 20ms instant
- **Medium repos** (100-1000): ~0.5s with cache
- **Large repos** (1000+): Fast mode auto-enabled

Cache location: `.codemapper/` in project root (auto-managed)
