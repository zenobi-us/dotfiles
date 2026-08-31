# Orchestrated review workflow implementation plan

- **Status:** Shipped first-flow implementation; verification and deferred writer work remain separate
- **Scope:** First review-only workflow
- **Spec origin:** legacy issue #6 (not carried into the clean repository)
- **Reviewed spec revision:** `2026-08-04T11:57:03Z`, SHA-256 `20a0d529770bbfd0b693d67856d04aa5e4b3e627270cb78c46232cf000739e65`
- **Primary evidence:** `prototype/js-review-workflow@4622e08731d31ccda1c33eb01cff5610d86d0166`
- **Research:** [`research/pdw-architecture-assessment.md`](research/pdw-architecture-assessment.md)
- **Domain language:** [`../CONTEXT.md`](../CONTEXT.md)

The reviewed legacy issue #6 revision is the original product contract; narrower implementation decisions may refine it; accepted ADRs constrain architecture; this plan records shipped behavior and remaining follow-up. Current shipped behavior and accepted ADRs remain authoritative for existing APIs. A `ready-for-agent` label or design review does not approve remaining implementation or a workflow execution.

## Implementation status

Shipped:

- exact preparation, approval, journal creation, and bounded Worker execution;
- fresh read-only Pi children in one detached exact-base checkout;
- bounded parallel review, fresh synthesis, and explicit non-retryable failure evidence for parent-guided recovery;
- one final parent delivery; and
- fail-closed cancellation with process-exit confirmation before checkout cleanup.

Package and runtime slices are shipped. Remaining work is limited to deferred writer behavior and any future workflow extensions.

The required integration suite uses real Pi and Herdr processes with a deterministic local provider. Live-provider runs are optional compatibility smoke coverage, not a merge gate.

## Outcome

Ship the smallest approved JavaScript workflow that can:

1. launch bounded parallel Pi-backed read-only reviewers;
2. preserve every reviewer success or failure for parent-guided recovery;
3. pass every final result to one fresh read-only synthesizer;
4. return one JSON-compatible task result;
5. deliver one bounded final receipt to the parent.

The parent authors the script and owns approval. After approval, only the script launches workflow nodes.

## Non-goals

The first flow has no writer, Claude adapter, structured-output subsystem, workflow registry, task manager, replay, checkpoints, saved commands, nested workflows, external-system effects, automatic integration, or cleanup engine.

The existing public fire-and-forget `subagent()` API does not change.

## Unknowns first

### Verified facts

- `launchSubagent()` and `watchSubagent()` are already separate; public delivery is a later callback in `index.ts`.
- Existing process-global runtime state and `selectCompletionApi()` preserve active public children across `/reload`.
- `pi -ne -e subagent-done.ts` launches real self-hosted children without loading both the project and globally installed subagent extensions.
- The prototype returned four real Luna child results to JavaScript without a public parent steer.
- A shared detached exact-base checkout worked for parallel read-only children and was removed without force.
- A disposable Herdr probe observed a foreground `sleep` PID and process group through `pane process-info`; synchronous `pane close` removed the pane and the process was gone within 200 ms.
- The deterministic real Pi/Herdr integration suite now proves cancellation of queued and active workflow children, process exit before checkout cleanup, and one terminal outcome.
- Node `vm` host callbacks are escapable and are not a security boundary.
- A `vm` timeout stops a synchronous loop but does not stop an infinite loop started after `await`; running workflow JavaScript on Pi's main event loop can freeze Pi.

### Current constraints

- The project is trusted before the runner reads `.pi/plans/`.
- The first flow permits only `kind: "review"` and Pi-backed roles.
- Hard v1 ceilings are eight `agent()` calls and four concurrent real children; workflow metadata may declare lower limits.
- Current runtime child failures remain explicit non-retryable evidence. The bundled skill contains a dormant bounded replacement branch that acts only on an explicit `retryable: true` envelope and preserves the same role/runtime; parent-guided recovery remains the path for current failures.
- A native Node Worker thread is the smallest acceptable containment for accidental asynchronous infinite loops. It is availability isolation, not a security sandbox.

### Acceptance risks still to prove

- Future writer workflows need separate review-visibility, ownership, and recovery evidence.
- The bundled skill's explicit retry branch remains dormant until the runtime exposes typed retryability; no current failure is classified as retryable.

### Stop-and-ask conditions

Stop before widening scope if implementation appears to require:

- changing the public `subagent()` contract;
- a non-Pi runtime adapter;
- a writer or mutable shared checkout;
- direct filesystem, shell, network, or MCP access from workflow JavaScript;
- durable replay or a workflow manager;
- more than the control tool and the two-function JavaScript SDK;
- treating Node `vm` or Worker threads as a security boundary.

## External control surface

The bundled `orchestrate` skill is the user entry point. The extension provides the parent-facing control tool that skill uses:

```ts
herdr_workflow({ action: "prepare", path: string })
herdr_workflow({ action: "start", runId: string })
herdr_workflow({ action: "cancel", runId: string })
```

There is no list, status, resume, or history action in v1. The tool is not registered when `PI_SUBAGENT_ID` is present, so ordinary and workflow children cannot prepare, start, or cancel workflows.

### Prepare

`prepare` must:

1. require Herdr, a persistent parent session, and a trusted project;
2. require `<cwd>/.pi/plans/<run>/workflow.js` and reject paths outside that shape or through symlinks;
3. require that the adjacent `run.jsonl` does not already exist;
4. parse and strictly validate metadata before compiling JavaScript;
5. compile without evaluating the script;
6. resolve and bind the canonical repository root, Git common directory, and exact base commit;
7. require explicit authenticated `model` and `thinking` values for every role;
8. resolve effective read-only tools and reject a role whose derived allowlist is empty;
9. resolve each role's current source and prompt body plus its exact runtime and effective tools into a canonical policy fingerprint;
10. require local source paths to resolve inside the canonical repository; treat URL and ticket source strings as provenance for evidence already materialized by the parent into the approved script or prompts;
11. hash the exact script bytes with SHA-256;
12. store the current parent session ID/file and branch leaf after which approval must occur;
13. keep one pending candidate in process-local state and return a written approval packet containing the script hash, repository identity, materialized-source summary, and role-policy fingerprints.

Preparation creates no journal or other run effect.

A second prepare invalidates the previous pending candidate. Exactly one workflow may be active in the Pi process; prepare and start reject while that process-global owner exists.

### Start

`start` must:

1. require the same parent session ID/file that prepared the candidate;
2. find the latest actual user message in the active branch and prove its entry occurs after the stored prepare leaf;
3. require the exact form `APPROVE <8 lowercase hex characters>`;
4. match that prefix against the one pending candidate's full hash;
5. re-read and re-hash the bytes;
6. revalidate the canonical repository identity, base commit, exact authenticated runtimes, role source/body, and effective tools against the stored policy fingerprints;
7. consume approval for one run;
8. create `run.jsonl` exclusively, with an `approved` first event containing the full script hash, canonical repository root and Git common directory, preparing session ID/file, approving user-entry ID, base SHA, materialized-source summary, and role-policy fingerprints;
9. append `started` before creating the reader checkout or launching children;
10. start the workflow in the background and return an acknowledgement.

The LLM cannot authorize execution by passing approval text in tool arguments. `/new`, `/resume`, and `/fork` invalidate pending approval; `/reload` preserves it only when the same session remains active.

### Cancel

`cancel` must:

1. atomically change the process-global owner from `running` to `cancelling`; if another path already won the terminal gate, return that outcome;
2. abort the run controller and reject queued `agent()` requests as cancelled;
3. capture each active pane's foreground PID/process group through Herdr `pane process-info`;
4. call synchronous `pane close`, then await both pane absence and exit of every captured foreground PID;
5. terminate and await the workflow Worker;
6. suppress late agent, synthesis, and success messages after cancellation owns the gate;
7. dispose the reader checkout only after termination is confirmed;
8. append one `cancelled` terminal event and deliver one bounded cancellation receipt.

If a captured process remains after the bounded wait, retain the checkout and append `failed` with `cancel_termination_failed`; never report successful cancellation or clean up underneath a live child. All completion, failure, interruption, and cancellation paths use the same compare-and-set terminal gate. Repeated cancellation is idempotent.

## Workflow metadata

The first bytes of `workflow.js` contain one parse-only JSON comment:

```js
/* herdr-workflow
{
  "version": 1,
  "name": "review ADR 0006",
  "sources": ["docs/adr/0006-limit-v1-execution-effects-to-isolated-worktrees.md"],
  "baseSha": "0123456789abcdef0123456789abcdef01234567",
  "maxAgents": 5,
  "maxConcurrency": 3,
  "roles": [
    {
      "id": "architecture",
      "role": "architecture-reviewer",
      "kind": "review",
      "model": "openai-codex/gpt-5.6-luna",
      "thinking": "low"
    },
    {
      "id": "synthesis",
      "role": "review-synthesizer",
      "kind": "review",
      "model": "openai-codex/gpt-5.6-luna",
      "thinking": "low"
    }
  ]
}
*/
```

Unknown fields, duplicate review-node IDs, missing or non-exact models, missing or unsupported thinking, non-review kinds, empty derived tool allowlists, missing commits, `maxAgents > 8`, `maxConcurrency > 4`, or concurrency above the agent cap fail preparation. Multiple nodes can reference one review role.

`sources` records provenance only. Workflow children cannot read arbitrary parent paths or refetch URLs and tickets; the parent materializes exact source evidence into the approved script or prompts before preparation.

Metadata is an approved capability envelope, not a promise of the exact future node graph.

## Review-policy boundary

The bundled `orchestrate` skill must author the first flow as independent reviewers followed by one fresh synthesizer that receives every final result. The runtime deliberately does not infer prompts, impose a fixed task receipt, or prove JavaScript data flow. Exact-script human approval is the enforcement boundary for task semantics; the runner enforces only operational capabilities and evidence.

A generated script that omits review or synthesis must not be presented for approval, but no hidden review state machine is added to the runtime.

## JavaScript SDK

V1 exposes only:

```ts
agent(
  prompt: string,
  options: { kind: "review"; node: string },
): Promise<AgentResult>;

log(message: string): void;
```

The review node selects its exact approved role, model, and thinking from metadata. The script cannot select tools, models, thinking, cwd, branches, extensions, skills, or environment variables.

```ts
type AgentResult =
  | { ok: true; value: string; sessionFile: string }
  | {
      ok: false;
      code: string;
      message: string;
      retryable: boolean;
      sessionFile?: string;
    };
```

A negative review is `ok: true`. Operational failure is never `null` and never thrown for normal child failure. Invalid SDK use throws and fails the workflow.

The script may return any JSON-compatible value. `undefined`, functions, symbols, `BigInt`, cyclic data, and non-serializable values fail the run.

Hard first-flow bounds are deliberately fixed rather than configurable beyond lower metadata caps:

- workflow source: 256 KiB;
- whole-run deadline: 30 minutes;
- `agent()` calls: 8;
- concurrent real children: 4;
- each agent prompt: 100,000 characters;
- `log()` events: 100, at 4,000 characters each;
- serialized task result: 64 KiB.

Workflow `agent()` retains the full child summary for script use; the 16,000-character bound is only public `subagent` delivery presentation. Crossing an explicit bound fails or cancels the run; output is never silently dropped.

## Runtime shape

### Worker thread

Run the restricted `vm` inside one native Node Worker thread per workflow run. The Worker:

- receives the approved bytes;
- exposes only local `agent()` and `log()` bridge functions;
- disables string and Wasm code generation;
- applies a short timeout to initial synchronous evaluation;
- sends agent requests and logs to the main extension through `MessagePort`;
- returns one JSON-compatible task result.

The main extension owns all Herdr, model, tool, checkout, journal, cancellation, and delivery effects. Cancellation terminates the Worker. A VM escape reaches the Worker host and remains trusted-code execution; it must not freeze Pi's main event loop.

### Agent execution

Add one internal awaitable wrapper around the existing launch/watch seams plus a new workflow-only launch option. The option must add `-ne -ns -np -nc`, ignore role `cwd`, `session-mode`, skills, and discovered context, force a standalone fresh auto-exit session in the approved reader checkout, and load only `subagent-done.ts` for completion lifecycle hooks; the existing public launch path remains unchanged. The workflow option must pass its exact non-empty read-only `--tools` list directly instead of calling `buildSubagentToolAllowlist()`, so `caller_ping` and `subagent_done` remain inactive. The wrapper must:

- resolve the approved role through existing discovery precedence;
- derive tools as `role tools ∩ {read, grep, find, ls} ∩ extension deny rules`, without public child-control tools;
- launch Pi with `-ne -ns -np -nc -e subagent-done.ts`;
- run in the shared exact-base checkout;
- set auto-exit and preserve the child session;
- await `watchSubagent()`;
- store ownership only inside the process-global workflow run, never in public `runningSubagents` tracking;
- close its ordinary pane after evidence capture;
- map the result to `AgentResult` without calling `sendSubagentResult()`.

Public listing, widgets, interrupt, resume, and shutdown paths cannot see or target workflow-owned children. The workflow controller alone cancels and finalizes them.

A small private FIFO inside the bridge enforces metadata concurrency. Every `agent()` call, including retries, consumes the total-agent cap. This limiter is not exposed as a workflow API.

### Failure classification

| Evidence | Result | Retryable |
| --- | --- | --- |
| Role/model/tool/policy validation failure | `policy_error` | No |
| Herdr or command launch throws without a typed transient signal | `launch_error` | No |
| Completion sidecar reports protocol failure | `protocol_error` | No |
| Child exits nonzero without structured provider evidence | `child_error` | No |
| Pane disappears before completion evidence | `lost_child` | No |
| Run cancellation | `cancelled` | No |
| Valid review containing blockers | Success | Not applicable |

Do not classify failures from `errorMessage` or a bare `stopReason: "error"`. Pi does not expose its typed retry outcome to extensions, so all workflow child failures remain non-retryable. Existing public subagent completion behavior and sidecar shape remain unchanged.

### Shared reader checkout

Add a separate runner-owned reader-checkout seam; existing Herdr per-child worktree creation does not provide it. For each started run:

1. revalidate the approved canonical repository root and Git common directory;
2. create one detached Git worktree under a unique temporary path at `baseSha` with an explicit Git command;
3. record its repository identity, path, and SHA before launching children;
4. give every reviewer and synthesizer that cwd;
5. never fall back to the parent checkout;
6. remove it without force after terminal completion;
7. retain and report it if removal fails;
8. do not auto-remove a checkout discovered after full process restart.

Parent staged, unstaged, and untracked files are intentionally absent.

### Operational envelope

```ts
type RunEnvelope = {
  runId: string;
  state: "completed" | "failed" | "cancelled" | "interrupted";
  result?: JsonValue;
  error?: { code: string; message: string };
};
```

`completed` means JavaScript returned a valid task result. Task-specific values such as `complete`, `incomplete`, `accept`, or `revise` belong inside `result`.

The full bounded `RunEnvelope` exists exactly once, inside the single terminal event (`completed`, `failed`, `cancelled`, or `interrupted`). Parent presentation derives from that event, reuses existing result-size bounds, and always includes the run directory and child session references.

## Run journal

`run.jsonl` is diagnostic evidence, not replay state. Append only these observed events as applicable:

```text
approved
started
reader_checkout_ready | reader_checkout_retained | reader_checkout_disposed
agent_started
agent_completed
agent_result
pane_close_failed
workflow_log
completed | failed | cancelled | interrupted
delivery
```

`agent_completed` records the observed child exit, session availability, final assistant-text length, and (when present) final stop reason before the corresponding `agent_result` records the workflow-facing success or failure envelope.

`delivery` follows the terminal event and contains only its terminal-event ID/state, target parent session, attempt time, and `sent | failed` delivery status. It never duplicates the task result. Evidence readers obtain the result from the referenced terminal event. Do not add mutable snapshots, locks, leases, backups, call caching, or replay.

One process-global owner records the run ID, canonical project identity, lifecycle gate, Worker, and private child handles. `/new`, `/resume`, and `/fork` cannot start a second workflow while this owner exists; cancellation names the run ID and must match the current canonical project identity. On same-process `/reload`, the owner and Worker continue, and completion selects the latest extension API once. On full startup, scan only direct child directories under the current project's `.pi/plans/` and inspect only each journal's last valid event. A `delivery` event carries its referenced terminal state, a terminal event is already settled, and a non-terminal running event with no live process-global owner receives one `interrupted` terminal event. Do not recurse, restart, clean, or expose history UI.

## Implementation slices

All slices are sequential because they touch the same runtime and lifecycle seams.

### Slice 1 — contract, preparation, and approval (shipped)

**Files**

- Add `pi-extension/subagents/workflow.ts` for metadata, hashing, pending state, journal primitives, and control input validation.
- Update `pi-extension/subagents/index.ts` to register `herdr_workflow` and attach workflow state to the existing process-global runtime.
- Add `test/workflow.test.ts`; include it in `npm test`.

**Exit criteria**

- Strict metadata and path validation pass.
- Preparation never evaluates JavaScript or starts a child.
- Only a real user approval in the same session and after preparation can start.
- Byte, base, role prompt/default/source, effective-tool, runtime, or pending-candidate changes invalidate approval.
- Approval is single-use.

### Slice 2 — Worker, internal Pi execution, and happy path (shipped)

**Files**

- Add `pi-extension/subagents/workflow-worker.js` for VM execution and bridge messages. Keep the Worker as plain JavaScript so it does not depend on Pi's Jiti loader or Node's TypeScript-stripping version.
- Add the minimal internal awaitable child wrapper and workflow-only isolated launch option in `index.ts`; reuse existing watch/session/model behavior without public delivery or public `runningSubagents` registration.
- Add the runner-owned detached reader-checkout functions in `workflow.ts`; do not route them through Herdr's per-child worktree API.
- Extend completion sidecar/result types with structured failure evidence.
- Add `test/integration/workflow-review.test.ts`.

**Exit criteria**

- Three reviewers can run in parallel under their exact approved runtimes and one synthesizer receives every final result.
- No intermediate child result enters the parent session.
- Child extension discovery is disabled.
- Child tools are read-only and model/thinking match metadata.
- The exact-base checkout is shared and disposed.
- Async infinite-loop workflow code can be terminated without freezing Pi.

### Slice 3 — cancellation, reload, interruption, and delivery (shipped)

**Files**

- Extend `workflow.ts`, the existing process-global runtime, and integration coverage only as needed.

**Exit criteria**

- Cancel stops queued, active, and future work and delivers once.
- `/reload` does not duplicate or lose final delivery; unit coverage proves the existing same-process API-selection helper remains valid for `/new`, `/resume`, and `/fork` without four duplicate real-LLM scenarios.
- Full restart records interruption and performs no replay, restart, cleanup, or history.
- Every terminal path closes read-only panes and retains session/journal evidence.

### Slice 4 — bundled skill and documentation (shipped)

**Files**

- Add `skills/orchestrate/SKILL.md`.
- Add `"skills": ["./skills"]` to the package manifest.
- Update `README.md`, `AGENTS.md`, `.pi/skills/run-integration-tests/SKILL.md`, and proposed ADR statuses only after implementation approval.

**Skill flow**

1. Resolve the user-selected ADR, PRD, ticket set, or combination through parent capabilities.
2. Perform preflight discovery.
3. Create a unique `.pi/plans/<run>/workflow.js` at committed `baseSha`.
4. Call `herdr_workflow prepare`.
5. Present the returned packet without rewriting it.
6. Ask for `APPROVE <prefix>`.
7. After that exact user reply, call `herdr_workflow start`.
8. Wait for the single final workflow delivery.

**Exit criteria**

- The installed package exposes the skill and extension together.
- The skill does not call public `subagent()` for workflow nodes.
- Documentation states that Node `vm` and Worker threads are not security boundaries.
- `npm pack --dry-run` contains the skill and no sessions, plans, or prototype files.

## Acceptance-test list

### Unit

- Metadata header must be first, valid JSON, version 1, strict, and within hard caps.
- Paths outside `.pi/plans/<run>/workflow.js`, symlinks, reused journals, and missing files fail.
- Unknown, duplicate, legacy external-CLI, unauthenticated, or non-review roles fail.
- Script syntax failure does not evaluate code.
- Prepare records exact bytes, full hash, base SHA, session identity/leaf, role-policy fingerprints, runtimes, and effective tools in pending memory without creating the journal.
- A matching later user message in the same session starts; assistant text, pre-prepare or other-session user text, malformed text, uppercase/short/long prefixes, and surrounding whitespace fail.
- Changed bytes, base, role definition/source/defaults, tools, or runtime fail; a second prepare invalidates the first; one approval cannot start twice.
- SDK rejects unknown roles, mismatched kinds, extra capabilities, and calls beyond caps.
- FIFO never exceeds concurrency and cancellation resolves queued calls as cancelled.
- Every operational child outcome maps to an explicit success-or-failure envelope; no failure is inferred retryable from prose.
- Script, deadline, prompt, log-count/log-size, and task-result bounds fail explicitly at their limits. Workflow `agent()` retains the full child summary; the 16,000-character bound is public `subagent` delivery presentation only.
- JSON-compatible script returns succeed; nested `undefined`, `NaN`, `Infinity`, functions, symbols, `BigInt`, cycles, and other lossy or non-serializable values fail.
- The journal is created only after approval; its first event binds the full hash, preparing session, approving user entry, base, and role policies. Order remains append-only and every terminal path has one terminal event.
- The compare-and-set terminal gate permits exactly one terminal journal event when cancellation races Worker or child completion; the following delivery event references it without copying the result.
- The control tool is absent whenever `PI_SUBAGENT_ID` is present, workflow child allowlists are non-empty and exclude `caller_ping` and `subagent_done`, and only one workflow can be active per Pi process.
- Role `cwd`, `session-mode`, skills, and context cannot override the fresh standalone reader-checkout session.
- Workflow children never enter public listing, widget, interrupt, resume, or shutdown tracking.
- Worker termination stops an async post-`await` infinite loop.
- Every test fixture that creates Git commits sets repository-local `commit.gpgsign=false`, so tests do not inherit machine signing configuration.

### Real Herdr/Pi integration — deterministic required suite

Run with:

```bash
npm run test:integration
```

The required suite uses a local scripted provider while retaining real Pi processes and Herdr resources. The optional provider-compatibility smoke test is:

```bash
PI_TEST_MODEL="openai-codex/gpt-5.6-luna" \
PI_TEST_TIMEOUT=180000 \
npm run test:integration:live
```

Scenarios:

1. Prepare a review workflow and prove no pane starts before approval.
2. Approve, run three parallel reviewers plus one synthesizer, and observe one final parent delivery.
3. Verify every child reports its configured runtime and only read-only tools.
4. Verify `caller_ping` and `subagent_done` are inactive and no child `subagent_result` or ping enters the parent session.
5. Run inside this repository with the global package installed and prove `-ne` prevents duplicate extension registration.
6. Keep an uncommitted marker only in the parent checkout and prove reviewers cannot see it.
7. Exhaust the agent and concurrency caps without launching excess children.
8. Prove synthesis receives every reviewer success or failure envelope and returns an incomplete task result when coverage is missing.
9. Cancel with queued and active reviewers; capture their Herdr process IDs, prove they exit after pane closure and before checkout cleanup, and prove no synthesis or late success starts. A synthetic surviving-process case must retain the checkout and end `failed` with `cancel_termination_failed`.
10. Reload during review and during synthesis; prove exactly one final delivery through the fresh API.
11. Simulate full restart; prove the journal becomes interrupted without replay or cleanup.
12. Verify all ordinary panes close, `git worktree list` no longer contains a clean shared checkout, dirty or failed-removal checkouts are retained, and sessions/journal remain.

### Repository gate

```bash
npm test
npm run lint
npm run test:integration
npm pack --dry-run
git diff --check
git status --short
```

Also confirm no accidental empty root directory and no generated `.pi/plans`, session, journal, or prototype artifacts are staged.

## Deferred follow-up

A later writer workflow may add one isolated writer lane before the same review fan-out and synthesis. It requires its own review-visibility acceptance tests. Multiple writers and run assembly remain out of scope until separately prototyped and approved.
