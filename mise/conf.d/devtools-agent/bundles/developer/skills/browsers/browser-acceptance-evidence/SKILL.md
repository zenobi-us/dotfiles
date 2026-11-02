---
name: browser-acceptance-evidence
description: Proves a change in a running app in five stages - reads the branch, ticket and work receipts, writes manual test steps as JSON and Markdown, confirms the plan with the user, drives it in a real browser with surf or Playwright for screenshots and optional video, then publishes the evidence to shared context and posts the steps to the issue with a link to the evidence. Use when a change needs manual test steps, QA steps, acceptance criteria, a smoke test, visual verification, "show me it works", or a hand-off that needs screenshots. Results in a confirmed plan, re-runnable scripts, a published evidence page and an issue comment instead of a claim in chat.
---

# browser-acceptance-evidence

Proving a change works in a running app is a procedure, not a vibe. This skill
runs it in five stages. Each stage has a playbook; read the playbook before you
start its stage, and finish each stage before the next one.

## Stages

| Stage | Goal | Playbook |
|---|---|---|
| 1. Context | Know what changed, what the ticket asks, and what the environment can prove | `references/playbooks/1-context.md` |
| 2. TestPlan | Write the steps in `plan.ts`; generate `plan.json` and `test-plan.md` with no evidence | `references/playbooks/2-test-plan.md` |
| 3. Confirm | Show the plan to the user and agree it, the driver and video | `references/playbooks/3-confirm.md` |
| 4. CollectEvidence | Run the plan; collect screenshots and, when agreed, video | `references/playbooks/4-collect-evidence.md` |
| 5. PublishEvidence | Build `results.json` and `evidence.md`, commit and push, post the steps to the issue | `references/playbooks/5-publish-evidence.md` |

Propose this whole sequence when the user asks for evidence, test steps or a
check in the browser. Name the stage you are in when you report progress.

When the user asks for one stage only, such as "just write the test steps",
run that stage and the stages it depends on, and stop. Stage 3 is never
skipped before stage 4: a run of an unconfirmed plan is the most expensive way
to test the wrong thing.

## Rules for every stage

- You **MUST** resolve the evidence directory through the `agent-core:shared-context`
  skill, never by joining paths:
  `shared-context resolve evidence --workflow <work-id> --run manual-tests --json`.
  Its `path` is `$MT` in every playbook.
- You **MUST NOT** write a plan, evidence, screenshot or report into the
  repository under test. A repository holds code, not session output.
- `plan.ts` is the only file you write by hand. Every other file is generated
  from it or from the run. The one exception is a `WARN` record (stage 5).
- A step has two layers: `says`, the sentence a person follows, and a
  `locator`, which only the driver reads. No locator reaches a reader.
- Report status precisely. A test that did not run is not a pass, and an
  environment that cannot exercise part of the change is a gap you state.

## The CLI

All generated files come from one CLI. Its path is relative to this skill's
installed directory, not to the repository. Resolve the directory that holds
this `SKILL.md`, and call the script by its absolute path from any working
directory:

```sh
SC="<this skill's directory>/scripts/browser-evidence.ts"
"$SC" --help
```

| Command | Stage | Writes |
|---|---|---|
| `init "$MT" [--driver surf]` | 2 | `plan.ts`, `shots/`, `workflows/` |
| `render "$MT"` | 2 | `test-plan.md`, `plan.json` |
| `compile "$MT"` | 4 | `workflows/<work-id>-test-N.*` |
| `run "$MT" [--test N]` | 4 | `evidence.jsonl`, `report/shots/`, `report/videos/`, `runs/` |
| `verdicts "$MT"` | 4 | nothing; prints the summary |
| `report "$MT"` | 5 | `report/index.html`, `results.json`, `evidence.md` |
| `comment "$MT" --url <url>` | 5 | `comment.md`, also printed |

## Reference

| Need | Read |
|---|---|
| The surf driver and its traps | `references/drivers/surf-cli.md` |
| The Playwright driver and its traps | `references/drivers/playwright-cli.md` |
| The `evidence.jsonl` record contract, and how to add a `WARN` | `references/evidence-schema.md` |
| The `Plan` type, every step kind and its fields | `scripts/browser-evidence/plan.ts` |
