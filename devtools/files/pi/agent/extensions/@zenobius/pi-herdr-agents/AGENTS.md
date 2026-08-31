# Repository instructions for agents

These instructions apply to humans and coding agents changing `pi-herdr-agents`.

## What this package is

`pi-herdr-agents` (Pi Herdr Agents) is a Pi extension that launches asynchronous Pi child agents and approved read-only review workflows exclusively in Herdr. Ordinary runs use dedicated Herdr panes/tabs. Writing tasks may opt into one isolated Herdr-managed Git worktree per branch. Legacy role definitions that request an external CLI fail before Herdr creates resources.

The extension is fire-and-forget: `subagent` returns an acknowledgement, and completion is delivered to the parent automatically. Never add polling guidance that tells callers to sleep, tail sessions, or repeatedly check status.

## Read these first

- [`README.md`](./README.md) — canonical installation, API, configuration, lifecycle, and agent-authoring reference
- [`docs/README.md`](docs/README.md) — map of shipped contracts, active design, ADRs, and background research
- [`CONTEXT.md`](CONTEXT.md) — workflow domain language and prototype evidence; read it before changing workflow design
- [`docs/adr/0003-installable-role-packs.md`](docs/adr/0003-installable-role-packs.md) — installable role-pack discovery, precedence, and collision contract
- [`docs/worktree-subagents.md`](docs/worktree-subagents.md) — canonical worktree operating, review, recovery, and cleanup guide
- [`RELEASING.md`](RELEASING.md) — release checks and publishing procedure

Bundled role prompts live in [`agents/`](agents/). The native `/skill:orchestrate` workflow authoring skill lives at [`skills/orchestrate/SKILL.md`](skills/orchestrate/SKILL.md). The `/plan` orchestration prompt lives at [`pi-extension/subagents/plan-skill.md`](pi-extension/subagents/plan-skill.md).

## Code map

- `pi-extension/subagents/index.ts` — public tools/commands, agent discovery, launch/watch lifecycle, completion delivery, worktree manifests and handoffs
- `pi-extension/subagents/herdr.ts` — Herdr CLI argument construction and response parsing
- `pi-extension/subagents/terminal.ts` — terminal adapter used by the lifecycle
- `pi-extension/subagents/lifecycle.ts`, `status.ts`, `activity.ts` — process/turn state and widget projection
- `pi-extension/subagents/completion.ts`, `session.ts`, `subagent-done.ts` — child completion, transcript handling, `caller_ping`, and `subagent_done`
- `pi-extension/subagents/workflow.ts`, `workflow-worker.js` — workflow preparation, ownership, journal, lifecycle, and Worker execution
- `CONTEXT.md` — domain glossary and validated prototype evidence for active design
- `docs/adr/` — hard-to-reverse architectural decisions
- `docs/research/` — evidence and alternatives, never the shipped contract
- `test/test.ts` — unit tests for public subagent extension seams
- `test/workflow.test.ts` — unit tests for workflow preparation, execution, and cancellation
- `test/package-skill.test.js` — bundled skill and package manifest contract test
- `test/integration/` — real Herdr and Pi lifecycle tests using the deterministic provider by default

## Worktree contract

Preserve these invariants when changing worktree behavior:

1. `worktree: { branch, base? }` is opt-in per `subagent` call.
2. `cwd` selects the source repository; the child starts at the created worktree root.
3. `base` resolves to an exact commit before creation and defaults to committed `HEAD`.
4. Parent uncommitted/untracked files are not copied.
5. An ownership manifest is written before Herdr resource creation.
6. Herdr creates the workspace without stealing focus; launch targets the returned root pane explicitly.
7. Successful, failed, and help-requesting runs retain their worktree workspace.
8. Completion reports reviewable Git state; inspection failures are unknown, never guessed clean or conflict-free.
9. The extension does not push, create PRs, merge, cherry-pick, switch the parent checkout, or remove worktrees/branches automatically.
10. Ordinary non-worktree subagent behavior remains unchanged.

Read [`docs/worktree-subagents.md`](docs/worktree-subagents.md) before changing any of these semantics.

## Orchestration guidance

- Use ordinary panes for read-only scouts and reviewers.
- Use unique worktree branches for independent parallel writing tasks.
- Keep overlapping or dependent writing tasks sequential unless the dependency is committed and used as the next exact base.
- Tell worktree workers whether to commit. A good default is: edit, test, commit, report the SHA, and do not push/merge/remove.
- The parent owns review, integration, publication, and cleanup.
- Do not use `subagent_resume` as if it reattached worktree ownership; v1 resumes into an ordinary pane.

## Documentation synchronization

When behavior changes, update every affected surface in the same commit:

- public tool parameters, role-pack protocol, or lifecycle → `README.md`
- role-pack discovery, precedence, or collision policy → `docs/adr/0003-installable-role-packs.md`
- worktree behavior, handoff, recovery, or cleanup → `docs/worktree-subagents.md`
- agent operating expectations → relevant files in `agents/`
- `/plan` orchestration policy → `pi-extension/subagents/plan-skill.md`
- contributor/release verification → this file, `.pi/skills/run-integration-tests/SKILL.md`, or `RELEASING.md`
- domain terminology → `CONTEXT.md`
- hard-to-reverse workflow trade-offs → the relevant ADR; do not create an ADR for every design question
- active orchestrated-review design → `docs/orchestrated-review-workflow-plan.md`
- architectural evidence and alternatives only → research docs, clearly marked when later decisions supersede them

Do not copy the full worktree guide into every role prompt. Keep canonical detail in the guide and add only the role-specific rule an agent needs while running.

## Verification

For normal changes:

```bash
npm test
npm run lint
npm pack --dry-run
git diff --check
```

Run LSP diagnostics on every changed TypeScript file; lint and tests do not catch every TypeScript error.

For Herdr or lifecycle changes, run the deterministic suite from inside Herdr. Run only one integration suite at a time on a Herdr instance; concurrent suites compete for terminal focus and process capacity and can cause false timeouts or leaked test resources.

When a test reports that a `pi-integ-*` worktree path already exists, first check whether the same test already created that worktree and the deterministic provider dispatched the tool twice after asynchronous completion. Deterministic providers must make each requested tool call one-shot after its started result appears. Remove only verified test-owned residue after confirming that no workspace or process owns it.

```bash
npm run test:integration
```

Use `PI_TEST_MODEL="openai-codex/gpt-5.6-luna" PI_TEST_TIMEOUT=180000 npm run test:integration:live` only for optional provider-compatibility smoke coverage. Do not use skipped Herdr tests as passing evidence.

Before committing:

- inspect `git status` and the final diff;
- confirm the package preview includes `CHANGELOG.md`, `skills/orchestrate/SKILL.md`, and `pi-extension/subagents/workflow-worker.js`, while excluding plans, journals, sessions, prototypes, generated evidence, and local config;
- run `npm pack --dry-run` when package contents or documentation paths changed;
- confirm that no generated plans, journals, sessions, provider configuration, test scripts, or review artifacts are staged; and
- confirm that no accidental empty directory exists at the repository root:

```bash
test -z "$(find . -mindepth 1 -maxdepth 1 -type d -empty -print)"
```

## Release safety

Do not bump `package.json` merely to land documentation or implementation work. A version change on `main` triggers the release workflow. Never commit npm credentials, generated review artifacts, session artifacts, or local `config.json`.
