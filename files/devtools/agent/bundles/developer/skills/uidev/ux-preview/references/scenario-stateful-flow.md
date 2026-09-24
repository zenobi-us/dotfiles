# Stateful-Flow Showcase

Use when the primary risk is what happens across multiple actions or states.

## Trigger conditions

- save, import, export, onboarding, setup, checkout, or approval flow
- validation, loading, permissions, confirmation, cancellation, retry, or recovery
- a later step changes the meaning or risk of an earlier choice

## Inputs

```yaml
scenario: stateful-flow
option_count: 3
steps: [entry, editing, validation_error, submitting, success, failure]
required_actions: [back, cancel, retry]
```

## Rules

- Build a state model, not only static cards.
- Every transition needs a visible trigger and result.
- Cover the smallest meaningful set: happy path, validation failure, cancellation, submitting, failure, recovery.
- Keep sample data deterministic.
- Show current state and the action that caused it.
- If the state space is large, use a state selector and concise state table.

## State baseline

```text
entry -> editing -> validation-error
entry -> editing -> submitting -> success
editing -> cancel -> entry
submitting -> failure -> editing
```

## Poster gate

Use `poster` for a flow or state diagram only when it clarifies real branching or ownership. Do not add generic arrows or diagrams that duplicate the prototype.
