---
name: /improveprompt
description: Asynchronously evaluate and improve a prompt
---

The prompt has been evaluated and improved asynchronously.

## Result

!`opencode --prompt "$ARGUMENTS"`

### Outcome 1: PROMPT_OK

Your prompt is clear and ready to execute.

### Outcome 2: IMPROVED_PROMPT

Your prompt is vague but inferable from context. The agent returns a refined version for your review.

### Outcome 3: CLARIFICATION_NEEDED

Your prompt is missing critical information. The agent asks clarifying questions, one at a time, until it understands your intent.

## Examples

**Clear prompt:**

```
/improveprompt refactor the authentication module to use OAuth2 with support for GitHub and Google providers
```

→ Async result: `PROMPT_OK`

**Vague prompt with context:**

```
/improveprompt fix the bug
```

→ Async result: `IMPROVED_PROMPT` with details inferred from recent conversation

**Ambiguous prompt:**

```
/improveprompt improve the API
```

→ Async result: `CLARIFICATION_NEEDED` with targeted clarifying questions

## When to Use

- Before running complex or multi-step tasks
- When you want feedback on prompt clarity
- When you're unsure if you've given enough detail
- To sharpen vague ideas into actionable requests

## Async Behavior

The subprocess runs in the background. Results are returned asynchronously, allowing you to continue working while the prompt-improver evaluates your input.
