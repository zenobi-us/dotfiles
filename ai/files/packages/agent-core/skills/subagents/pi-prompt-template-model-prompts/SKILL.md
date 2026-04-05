---
name: pi-prompt-template-model-prompts
description: Helps author and upgrade Pi prompt templates with pi-prompt-template-model frontmatter, when creating model-aware slash commands with skills/chains/delegation, resulting in valid templates that switch models, inject skills, and run advanced workflows correctly.
---

# pi-prompt-template-model Prompts

## Overview
This skill is a workflow + reference for writing **valid** Pi prompt templates that use the `pi-prompt-template-model` extension fields.

Core rule: write extension config in YAML frontmatter first, then write prompt body. If the frontmatter is wrong, the prompt behavior is wrong.

Sources used for this skill:
- `nicobailon/pi-prompt-template-model` → `README.md`
- `nicobailon/pi-prompt-template-model` → `examples/best-of-n.md`

## When to Use
Use when you need to:
- Add `model`, `skill`, `thinking`, `restore`, or `loop` to a prompt template.
- Build delegated prompts with `subagent`, `parallel`, `inheritContext`, `cwd`.
- Build compare workflows with nested `bestOfN` blocks.
- Build chain templates (`chain`, `chainContext`) instead of a single prompt body.

Do NOT use when:
- You are writing plain prompts with no extension frontmatter.
- You need plugin internals or implementation code changes (use repo source directly).

## State Machine (authoring flow)
```text
[Start]
  -> [Define intent]
  -> [Pick template type]
       |- single-run ------> [core fields]
       |- delegated -------> [subagent fields]
       |- compare ---------> [bestOfN nested block]
       '- chain -----------> [chain + chainContext]
  -> [Write body placeholders ($1/$@/${@:N})]
  -> [Validate field placement + defaults]
  -> [Run slash command]
       |- fails -----------> [fix frontmatter]
       '- works -----------> [Done]
```

## Quick Reference

### Core fields
- `model`: single, provider/model, or comma fallback list.
- `skill`: preloads a skill context before execution.
- `thinking`: `off|minimal|low|medium|high|xhigh`.
- `restore`: default `true` (restore prior model/thinking after run).

### Delegation fields
- `subagent: true` (default agent `delegate`) or `subagent: reviewer`.
- `inheritContext: true|false`.
- `parallel: N` (delegated only, N >= 2).
- `cwd: /absolute/path`.
- `worktree: true` supported for delegated parallel runs.

### Compare fields (critical)
- Compare config must be nested under `bestOfN:`.
- Use `bestOfN.workers`, `bestOfN.reviewers`, optional `bestOfN.finalApplier`.
- `bestOfN.worktree: true` required if final applier edits real branch.
- Top-level `workers/reviewers/finalApplier` is invalid.

## Correct Templates

### 1) Minimal enhanced prompt
```markdown
---
description: Quick Python debugger
model: claude-sonnet-4-20250514
skill: tmux
thinking: medium
restore: true
---
Debug this issue in Python: $@
```

### 2) Delegated parallel prompt
```markdown
---
description: Parallel reviewer fanout
model: anthropic/claude-sonnet-4-20250514
subagent: reviewer
inheritContext: true
parallel: 3
worktree: true
---
Review changed code and report correctness, risk, and missing tests: $@
```

### 3) Compare prompt using bestOfN (valid shape)
```markdown
---
description: Best-of-N code task
bestOfN:
  worktree: true
  workers:
    - model: openai-codex/gpt-5.3-codex-spark:low
      count: 2
  reviewers:
    - model: openai-codex/gpt-5.4-mini:high
  finalApplier:
    model: openai-codex/gpt-5.4-mini:xhigh
---
$@
```

## Common Mistakes
- Putting compare slots at top-level (`workers:` / `reviewers:`) instead of under `bestOfN:`.
- Using relative `cwd` values (must be absolute path).
- Expecting `model` to control chain step models while `chain` is set.
- Adding unsupported frontmatter keys and assuming extension handles them.
- Forgetting that templates with no extension fields fall back to default Pi loader behavior.

## Practical Upgrade Pattern
1. Start from existing prompt body.
2. Add minimal frontmatter (`description`, `model`, optionally `skill`).
3. Add execution controls (`restore`, `thinking`, `loop`) only if needed.
4. Add delegation (`subagent`, `parallel`, `worktree`) only when task is independent.
5. Use `bestOfN` only for compare workflows where multiple candidates are worth the cost.

## Validation Checklist
- Frontmatter parses as YAML.
- Field names match extension docs exactly.
- Compare templates use nested `bestOfN` object shape.
- Prompt arguments use supported placeholders (`$1`, `$@`, `${@:N}`, `${@:N:L}`).
- Command behavior matches intent (single/delegated/compare/chain).
