# Troubleshooting: inspection fails on a blocker cycle

## Symptom

`inspect.ts <canonical-ticket-ref> --json` prints an error such as:

```text
Cycle in ticket blocker graph: RM-2183 -> RWR-5450 -> RM-2183
```

## Cause

Inspection checks the blocker chain of the requested ticket: the ticket, its blockers, and their blockers. Two or more tickets in that chain block each other, so no ticket in the cycle can become ready. Cycles outside that chain do not stop inspection.

The tracker data is the source of the cycle. For Jira, a wrong "blocks" link, or a pair of links in both directions, is the usual cause.

## Fix

- Do not edit the tracker mirror to break the cycle. The next sync restores it.
- Find the wrong link in the tracker and remove it. Ask the user which direction is correct when the tickets do not make it clear.
- For Jira, run `jira-mirror.ts sync` after the change, then run the inspector again.
- The coordination report lists the same cycle as a diagnostic for each affected ticket. It does not stop the report.
