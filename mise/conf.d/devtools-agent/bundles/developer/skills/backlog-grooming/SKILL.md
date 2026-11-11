---
name: backlog-grooming
description: Grooms one or many backlog tickets. Fans out one research subagent per ticket to check each claim against the codebase, tests, LSP traces or E2E tests, then publishes a collated HTML report to shared context and asks which proposed ticket actions to apply. Use when the user says groom, refine, size, triage or qualify tickets, a sprint, an epic or a backlog query.
user-invocable: true
---

# Backlog grooming

Route `UserRequest` through four phases. This file dispatches only. Each playbook owns its procedure.

```text
resolve ──► fan-out ──► collate ──► propose
  │            │           │           │
ticket list  reports/   index.html   chosen actions
             <KEY>.md   (published)  (applied)
```

## Global rules

1. Resolve this installed skill directory as `GROOMING_SKILL_ROOT`. Script paths are relative to that directory, not the repository. Run scripts by absolute path from the target repository.
2. You MUST use the `reading-and-writing-tickets` skill for every ticket read, list, comment, or update. Apply its **Subcommand router** before you touch a ticket. Do not call a tracker CLI or API directly.
3. You MUST use the `shared-context` skill to resolve the run directory. Do not build the path by hand.
4. You MUST use the `muxer-subagents` skill to start research subagents. It owns spawn, wait, and close.
5. Research subagents MUST NOT change code, tickets, or branches. Only the parent applies ticket actions, and only after the user selects them.
6. Write every report and question in plain language, with the `iso-24495-1` skill.

## Route

| Phase | Read when | Playbook |
|---|---|---|
| Resolve | The request names keys, a query, an epic, a sprint, or an initiative | [Resolve tickets](references/playbooks/resolve.md) |
| Fan out | The ticket list is fixed and the run directory exists | [Fan out research](references/playbooks/fan-out.md) |
| Research | You are a research subagent with one ticket | [Research one ticket](references/playbooks/research.md) |
| Collate | Every subagent finished, or timed out and was recorded | [Collate and publish](references/playbooks/collate.md) |
| Propose | The report is published and `actions.json` lists one or more actions | [Propose actions](references/playbooks/propose.md) |

The report file contract is in [Report contract](references/report-contract.md). Read it before you write or check a report.

The steps a person sees are in [Groom backlog tickets](how-to-groom-backlog.md). Read it when the user asks how the skill works or what a summary line means.

## On a partial request

- If the request names only a run directory, start at **Collate**.
- If the request names a run directory and says "apply" or "actions", start at **Propose**.
- Otherwise start at **Resolve**.

## Handoff

When you stop, state what is done, what is blocked, the open questions, and the files touched. Include the published report link.
