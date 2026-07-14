Quickstart:

```bash
npx skills add mattpocock/skills --skill=to-issues
```

```bash
npx skills update to-issues
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/to-issues)

## What it does

`to-issues` breaks a plan, spec, or PRD into a set of independently-grabbable issues and publishes them to your project's issue tracker, in dependency order.

Every issue is a **tracer bullet** — a thin *vertical* slice that cuts through all integration layers end-to-end (schema, API, UI, tests), never a horizontal slice of one layer. A completed slice is demoable or verifiable on its own, which is what makes the resulting tickets safe to hand to independent agents.

## When to reach for it

You invoke this by typing `/to-issues` — the agent won't reach for it on its own.

Reach for it once you have an agreed plan or a written spec and you want it split into tickets an agent can pick up. Point it at the conversation, or pass an existing issue reference and it fetches the body and comments first. If the change hasn't been written up as a spec yet, produce one first — for that, use [to-prd](https://aihero.dev/skills-to-prd).

## Prerequisites

`to-issues` publishes into your issue tracker, so [setup-matt-pocock-skills](https://aihero.dev/skills-setup-matt-pocock-skills) must have configured the tracker and its triage label vocabulary for this repo first. It applies the ready-for-agent triage label itself as it publishes.

## Vertical slices, not horizontal ones

The whole skill turns on one distinction. A **horizontal** slice ships one layer of the change — all the schema, or all the API — and nothing works until every layer lands. A **vertical** slice, the tracer bullet, ships one narrow path through *every* layer at once, so it can be demoed the moment it's done.

Before slicing, `to-issues` looks for prefactoring — "make the change easy, then make the easy change" — and orders that work first. It then quizzes you on the breakdown (granularity, dependencies, what to merge or split) before writing anything, and publishes blockers first so each issue's "Blocked by" field can reference a real ticket.

## The wide-refactor exception

One shape breaks the tracer-bullet rule: a **wide refactor** — a single mechanical change (rename a column, retype a shared symbol) whose **blast radius** fans across the whole codebase, so one edit breaks thousands of call sites at once and no vertical slice can land green. `to-issues` slices it as **expand–contract** instead: expand (add the new form beside the old so nothing breaks), migrate (move call sites over in batches sized by blast radius, one issue per batch, CI green throughout because the old form still exists), then contract (delete the old form once no caller remains). When even the batches can't stay green alone, they share an integration branch that all block a final integrate-and-verify issue, and green is promised only there.

## Where it fits

`to-issues` is a step in the main build chain:

```txt
grill-with-docs → to-prd → to-issues → implement → code-review
```

It sits between [to-prd](https://aihero.dev/skills-to-prd), which hands it a settled spec with user stories to slice against, and [implement](https://aihero.dev/skills-implement), which builds each independently-grabbable issue, driving [tdd](https://aihero.dev/skills-tdd) internally to write the tests test-first, before its [code-review](https://aihero.dev/skills-code-review) pass. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
