# Use-Case Showcase

Use when the answer depends on who is using the product, what they are trying to do, or under which constraints.

## Typical use cases

- first-time versus returning user
- beginner versus expert
- fast path versus careful path
- desktop versus mobile context
- incomplete data
- time pressure
- collaboration or review

## Inputs

```yaml
scenario: use-case
option_count: 3
use_cases: [first_time_user, returning_user, error_recovery]
actors: [beginner, expert]
constraints: [time_pressure, incomplete_data]
```

## Rules

- Keep core visual style stable unless style is the decision.
- Give each use case a goal, starting condition, and completion criterion.
- Compare all options against the same use case.
- Make the active context visible in the report.
- State where an option performs well and where it creates friction.
- Do not label one option universally best when the evidence is context-dependent.

## Report shape

Use a scenario matrix and, when there is more than one action, a clickable task walkthrough:

| Use case | Option 1 | Option 2 | Option 3 |
|---|---|---|---|
| First use | evidence | evidence | evidence |
| Repeat use | evidence | evidence | evidence |
| Recovery | evidence | evidence | evidence |
