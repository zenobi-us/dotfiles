---
title: Groom backlog tickets
---

The `backlog-grooming` skill researches each ticket in a separate subagent, publishes one HTML report, and then asks which ticket changes to make.

1. Ask for grooming and name the tickets: one key, several keys, an epic, a sprint, or a query. For example, type `/developer:backlog-grooming ABC-12 ABC-15` in Claude Code, or `/skill:backlog-grooming ABC-12 ABC-15` in OMP.
2. Wait for the research. The skill starts one subagent for each ticket, at most five at a time. Each subagent checks the ticket claims against the code, tests, call traces and the running app, and saves screenshots and logs as evidence.
3. Read the report. The skill publishes it to shared context and prints one summary line for each ticket:
   - `[ABC-12]: groomed 3` means the ticket is ready, with its story points.
   - `[ABC-15]: questions - 2` means two questions block sizing.
   - `[ABC-18]: cancel - Fixed in a1b2c3d` means the ticket no longer applies.
   - `[ABC-21]: split - Two separate changes` means another step must come first.
4. Choose the actions. For each ticket with proposed actions, the skill shows a checklist, such as posting the questions as a comment or setting the story points. It changes only the tickets and actions you select.

The subagents never change code, tickets or branches. The skill reads and writes tickets through the `reading-and-writing-tickets` skill, so it works with any tracker that skill supports.
