# CodeMapper Skill Test Validation

## Test Type
**Reference Skill** - Tool documentation for CodeMapper CLI

## Testing Methodology (from writing-skills)

For reference skills, test with:
- ✅ Retrieval scenarios: Can agents find the right information?
- ✅ Application scenarios: Can agents use what they found correctly?
- ✅ Gap testing: Are common use cases covered?

## Manual Validation (RED Phase Substitute)

Since subagent testing is not available, validated manually by:

1. **Retrieval Testing** - Verified all commands from `cm --help` are documented
2. **Application Testing** - Tested commands work as documented
3. **Gap Testing** - Covered all workflows from help output

## Tested Commands

✅ `cm stats .` - Works as documented
✅ `cm map . --level 2 --format ai` - Produces compact output
✅ `cm query <symbol> --format ai` - Finds symbols correctly
✅ `cm untested . --format ai` - Shows untested code

## Coverage Verification

Compared skill against `cm --help` output:

### Commands Documented
- ✅ Discovery: stats, map, query, inspect, deps
- ✅ Call Graph: callers, callees, trace, entrypoints, tests, test-deps
- ✅ Git: diff, since, blame, history
- ✅ Type Analysis: types, implements, schema
- ✅ Code Health: untested, impact
- ✅ Snapshots: snapshot, compare

### Key Flags Documented
- ✅ `--format` (default, human, ai)
- ✅ `--exact` (search mode)
- ✅ `--show-body` (include code)
- ✅ `--exports-only` (public symbols)
- ✅ `--full` (include anonymous)
- ✅ `--context` (minimal, full)
- ✅ `--level` (1, 2, 3 for map)
- ✅ Cache flags

### Workflows Documented
- ✅ Exploring Unknown Code
- ✅ Finding a Bug
- ✅ Before Refactoring
- ✅ Understanding an API
- ✅ Code Health Check

### Best Practices Captured
- ✅ Always use `--format ai` for LLMs (token efficiency)
- ✅ Start with stats → map → query → inspect
- ✅ Fuzzy search by default
- ✅ Pre-refactoring checklist
- ✅ When NOT to use CodeMapper

## Skill Quality Checklist

### Frontmatter
- ✅ Name: `codemapper` (only letters, numbers, hyphens)
- ✅ Description: Starts with "Use when..." (third person)
- ✅ Description includes specific triggers (analyzing codebases, finding symbols, tracing paths)
- ✅ Size: 288 characters (under 1024 limit)

### Structure
- ✅ Overview with core principle
- ✅ When to Use section (with ✅/❌ bullets)
- ✅ Essential Workflows (5 main patterns)
- ✅ Quick Reference table
- ✅ Key Commands by Category
- ✅ Critical Flags section
- ✅ Common Patterns
- ✅ Common Mistakes (with ❌/✅ comparisons)
- ✅ Troubleshooting section
- ✅ Real-World Impact
- ✅ Best Practices
- ✅ When NOT to Use

### Content Quality
- ✅ One clear example per concept (not multi-language)
- ✅ Inline code blocks (no separate files needed)
- ✅ Searchable keywords: AST, tree-sitter, symbols, call graph
- ✅ No narrative storytelling
- ✅ Focused on reference + retrieval

### Token Efficiency
- ✅ Emphasized `--format ai` throughout
- ✅ Quick reference table for fast lookup
- ✅ Common patterns section
- ✅ Compact command examples

## Baseline Behavior (Without Skill)

Expected agent behavior WITHOUT this skill:
- Would use `find`, `grep`, `cat` for exploration
- Would use `grep -r` for finding usages (false positives, misses indirect calls)
- Would manually read code files
- Would not know about `--format ai` flag
- Would not follow proper workflow (stats → map → query)

## Expected Behavior (With Skill)

With this skill, agents should:
- Discover `cm` command is available
- Choose correct subcommand for task
- Use `--format ai` for token efficiency
- Follow proper workflow (stats → map → query → inspect)
- Recognize when CodeMapper is appropriate vs ripgrep
- Use correct flags for each scenario

## Known Limitations

1. **No subagent testing** - Could not run RED phase with fresh agents
2. **Cache warning** - CodeMapper shows cache mismatch warning (not skill issue)
3. **Manual validation** - Tested commands manually instead of with subagents

## Future Testing

When subagent testing becomes available:

1. **Retrieval Test**: Give agent task "Find where authenticate function is used" - should use `cm callers authenticate --format ai`

2. **Application Test**: "Analyze this codebase structure" - should run `cm stats .` then `cm map . --level 2 --format ai`

3. **Gap Test**: "Find untested code" - should use `cm untested . --format ai`

4. **Efficiency Test**: Under token pressure, agent should use `--format ai` automatically

## Conclusion

✅ **Skill is ready for use**

- All commands from `cm --help` are documented
- Tested commands work as documented
- Clear workflows for common tasks
- Proper frontmatter and structure
- Emphasizes token efficiency with `--format ai`
- Includes when NOT to use section

The skill follows writing-skills best practices for reference-type skills and provides comprehensive coverage of CodeMapper functionality.
