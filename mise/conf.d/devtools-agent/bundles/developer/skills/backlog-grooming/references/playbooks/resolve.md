# Playbook: resolve tickets

Turn the user request into a fixed list of ticket keys and a run directory. This playbook reads tickets only.

## Resolve the tracker

1. Load the `shared-context` skill. If a `<shared-agent-context />` block is in context, use its route table. Otherwise run its CLI `report`.
2. Read `docs/agents/issue-tracker.md` from the alignment root.
3. Load the `reading-and-writing-tickets` skill and apply its **Subcommand router**. Pass it the route table, alignment root, and repository root.

## Build the ticket list

| Request names | Do this |
|---|---|
| One or more ticket keys | Use the keys as given. Read each one with the ticket skill `read` to confirm it exists. |
| An epic, initiative, or spec | Use the ticket skill `list` for its children. |
| A sprint, board, label, or query | Use the ticket skill `list` with that selector. |
| Nothing selectable | Ask the user for keys or a selector. Do not guess a query. |

- Drop tickets in a done or closed state. Report each dropped key and its state.
- If the list holds more than 20 tickets, show the count and ask the user to confirm or narrow it.
- Do not change any ticket in this phase.

## Create the run directory

Set `RUN_ID` to `<YYYY-MM-DD>-<short-slug>`, for example `2026-11-10-sprint-42`. Resolve the run directory:

```sh
"$SHARED_CONTEXT_SKILL_ROOT/scripts/shared-context/cli.ts" resolve evidence --workflow grooming --run "$RUN_ID" --json
```

Set `RUN_DIR` to the returned `path`. Create `$RUN_DIR/reports/`. Write the ticket keys, one per line, to `$RUN_DIR/tickets.txt`.

## Next

Go to [Fan out research](fan-out.md) with `RUN_DIR` and the ticket list.
