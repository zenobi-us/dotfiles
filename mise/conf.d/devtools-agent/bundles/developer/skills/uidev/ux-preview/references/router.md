# Scenario Router

Choose one primary scenario before generating the report. A secondary scenario may be composed only when it exposes a distinct risk.

| User's uncertainty | Primary scenario | Reference |
|---|---|---|
| "Which visual direction feels right?" | Style | `scenario-style.md` |
| "How much should we show?" | Detail | `scenario-detail.md` |
| "Which works best for this user or context?" | Use case | `scenario-use-case.md` |
| "What happens across steps and failures?" | Stateful flow | `scenario-stateful-flow.md` |
| "How does this behave at different sizes or inputs?" | Responsive | `scenario-responsive.md` |
| "How should this work in a terminal?" | TUI display | `scenario-tui-display.md` |

## Routing rules

- If behavior is fixed and only the visual treatment changes, use **style**.
- If the task, content, and behavior are fixed but hierarchy or disclosure changes, use **detail**.
- If the answer changes by actor, goal, environment, or constraint, use **use case**.
- If the main risk is a transition, async state, validation, cancellation, or recovery, use **stateful flow**.
- If viewport, input method, localization, or content stress is the main risk, use **responsive**.
- If the surface is a terminal UI, CLI dashboard, interactive shell screen, or ANSI-rendered display, use **tui-display**. Read `tui-framework-compatibility.md` first. Add responsive for terminal-size changes and stateful-flow for redraw or recovery as secondary lenses.
- If several apply, choose the one that contains the decision risk as primary. Add the others as constrained lenses, not as a new undirected mega-preview.

## Shared contract

```yaml
option_count: exact integer
primary_scenario: style | detail | use-case | stateful-flow | responsive | tui-display
secondary_scenarios: []
variation_parameters: {}
invariants: []
decision_question: ""
fidelity: low | medium | high
prototype_depth: static | interactive | multistep
```

Every scenario must state its invariants. An option is a deliberate answer to the same decision question, not merely a different color treatment.
