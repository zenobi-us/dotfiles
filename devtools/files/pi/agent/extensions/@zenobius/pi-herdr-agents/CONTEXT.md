# Feature Delivery

This context defines language for the shipped first-flow workflow runtime and deferred follow-up. [`README.md`](./README.md) is authoritative for shipped behavior; [`docs/orchestrated-review-workflow-plan.md`](./docs/orchestrated-review-workflow-plan.md) records the shipped implementation and deferred work. The workflow coordinates existing subagent roles without becoming a general-purpose workflow engine.

## Language

**Feature-delivery workflow**:
A bounded, user-approved plan that coordinates work needed to deliver one feature and ends in reviewable evidence.
_Avoid_: General task graph, orchestrator agent

**Workflow script**:
The per-run `workflow.js` containing a runner-validated JSON metadata block and the user-approved executable strategy.
_Avoid_: Execution plan, generic script, inferred policy

**Workflow metadata**:
The JSON block at the start of a workflow script that the runner parses and validates before loading any executable JavaScript.
_Avoid_: Evaluated metadata, inferred policy

**Approved runtime**:
A mandatory exact `provider/model` reference and thinking level declared in workflow metadata; every execution node must resolve to one of these approved runtimes. Missing values fail preparation rather than inheriting parent or role defaults. All subagent and workflow execution is Pi-backed.
_Avoid_: Runtime tiers, external CLI adapter, silent fallback, inherited runtime

**Pi subagent runtime**:
The single execution path for fresh and resumed children. `launchPiSubagent()` owns the complete Pi and Herdr launch transaction; completion uses Pi sidecar evidence first and the terminal exit marker as fallback.
_Avoid_: Runtime dispatch, adapter registry, split launch ownership

**Legacy external CLI role**:
An old role definition that contains `cli`. Discovery reports a migration diagnostic, and launch fails before Herdr creates a pane or worktree. Remove `cli` and `cli-model`, then select the model through Pi provider/model routing.
_Avoid_: Silent Pi reinterpretation, compatibility adapter

**Run journal**:
The runner-owned append-only `run.jsonl` that starts with approval binding the workflow-script hash, canonical repository identity, and committed base, then records observed node calls and results. Exactly one terminal event contains the bounded runtime envelope; a following delivery event references it without duplicating the task result.
_Avoid_: User-authored plan, mutable audit log, duplicated result

**Terminal lifecycle**:
Completed read and review panes close after result capture while child session files and run evidence remain. Writer-worktree retention belongs to a deferred writer workflow.
_Avoid_: Retaining every clean pane, deleting review evidence

**Restart boundary**:
Workflow ownership survives Pi lifecycle transitions handled inside the same process, including `/reload`. A full process restart performs interruption reconciliation only: it marks a stale run interrupted, retains sessions, journals, branches, and worktrees as evidence, and requires a newly approved run. There is no replay, restart of children, cleanup, or history surface.
_Avoid_: Automatic replay, durable workflow manager, lost-artifact claim

**Execution artifact directory**:
The project-local `.pi/plans/<run>/` directory that keeps its workflow script and run journal together.
_Avoid_: Session-only state, runner-global artifacts

**Execution run**:
One immutable orchestration attempt with its own unique artifact directory; a retry or revised plan creates a new run that can reference its predecessor. Approval binds the canonical repository root, Git common directory, and committed base SHA. Read-only execution nodes share a run-owned checkout pinned to that identity.
_Avoid_: Overwritten feature directory, mutable run history, parent-checkout reads, SHA-only repository ambiguity

**Execution source**:
A user-selected PRD, ticket set, URL, or combination that the orchestration skill reads before preparation. Local paths must resolve inside the approved repository; remote or tracker content is materialized into the exact approved script or prompt evidence rather than fetched by workflow children. Metadata source strings are provenance, not runtime read authority.
_Avoid_: Required ticket conversion, fixed ticket graph, runtime refetch, path escape

**Orchestration skill**:
The user-facing native Pi skill bundled with this package that accepts an execution source, derives a workflow script, and invokes the runner only after approval.
_Avoid_: Extension command, separate skill package, raw runner API

**Source resolution**:
The orchestration skill reads an execution source through capabilities already available to the parent; the extension has no built-in tracker client and stops when the source is inaccessible.
_Avoid_: Required tracker integration, silent fallback

**Execution node**:
A bounded planned subagent run that may cover one, part of one, or several source tickets while retaining source traceability. The shipped first flow accepts only `kind: "review"`; `read` and `write` remain deferred kinds for later workflows.
_Avoid_: Ticket, untracked child run, inferred effect, first-flow read/write node

**Review node**:
A declared workflow execution identity that pins one role, exact runtime, and
thinking level. Node IDs are unique within a workflow; several nodes can use
the same role.
_Avoid_: Role identity, implicit runtime, duplicate-role prohibition

**Writer lane (deferred)**:
A possible later single write node and retained worktree; it is not part of the first review-only workflow and requires separate evidence and approval.
_Avoid_: First-flow writer, parallel writers, shared-checkout writer

**Read-only fan-out**:
The shipped first flow runs bounded parallel review nodes, then one fresh synthesis node. A later writer workflow may define separate pre-write and post-write review stages.
_Avoid_: Unbounded fan-out, first-flow writer, reviewing through a writer

**Code-oriented orchestration**:
The parent writes JavaScript against a narrow capability API so intermediate subagent results stay in code and only the final useful result returns to the parent context, similar in shape to Cloudflare Code Mode.
_Avoid_: Direct parent turn per child result, broad generated tool API, security-equivalence claim

**Workflow SDK**:
The extension-private JavaScript API that workflow scripts use to launch and await policy-checked execution nodes through the existing subagent lifecycle. V1 exposes only `agent()` and `log()`; scripts use ordinary JavaScript control flow and `Promise.all`.
_Avoid_: Public `subagent()` tool, third-party package API, speculative helper framework

**Tool derivation**:
The runner computes each node's effective tools from its resolved role, the hard maximum for its declared kind, and extension deny rules; `agent()` has no script-controlled `tools` option. Workflow children receive the exact derived list without public child-control tools such as `caller_ping`.
_Avoid_: Script-granted capability, duplicated tool policy, public child-control tool

**Agent result**:
The explicit success-or-failure value returned by `agent()`, preserving output, retryability, session reference, and any Git handoff without collapsing operational failure to `null`.
_Avoid_: Nullable result, prose-only failure

**Runtime envelope**:
The runner-owned final wrapper containing only operational facts such as run ID, terminal runtime state, returned task result, and a runtime error when present.
_Avoid_: Review verdict, delivery semantics, task-specific state machine

**Task result**:
Any JSON-compatible value returned by `workflow.js`; the parent-authored script chooses its task-specific shape and vocabulary.
_Avoid_: Global verdict enum, mandatory review receipt type, workflow DSL

**Workflow runtime**:
A native Node Worker thread containing the restricted `vm` that executes an approved workflow script with only the Workflow SDK. The Worker protects Pi's main event loop from accidental asynchronous infinite loops; neither the Worker nor `vm` is a security boundary.
_Avoid_: Main-thread workflow execution, untrusted-code sandbox, normal Node module execution

**First-flow effect boundary**:
An execution node may only inspect or review one runner-owned detached checkout pinned to the approved repository identity and committed base. It cannot write files, create commits, mutate the parent checkout, integrate work, or mutate external systems.
_Avoid_: Writer node, ticket mutation, deployment, publishing, messaging, PR action, late-bound base

**Fresh review**:
Independent read-only review nodes with fresh contexts and the exact source or candidate evidence; the bundled authoring skill requires them in every first-flow script.
_Avoid_: Worker self-review, inherited-context review

**Review-policy boundary**:
The bundled skill authors review fan-out and synthesis, and exact-script approval binds that task strategy; the runner enforces operational capabilities and evidence without a fixed review receipt or data-flow state machine.
_Avoid_: Hidden task semantics, runner-certified review completeness

**Review workflow**:
The first product flow: an approved JavaScript run fans out to independent read-only reviewers, then passes every explicit result to one fresh review synthesizer.
_Avoid_: Parent-scheduled review nodes, prose-only aggregation

**Review synthesis**:
The final fresh read-only review node that receives every explicit reviewer success or failure plus exact source evidence, deduplicates or resolves findings, and returns one review verdict.
_Avoid_: Filtered failures, mechanical worst-verdict rule, parent-side synthesis

**Parent-guided recovery**:
Current runtime child failures are explicit non-retryable evidence. The parent can approve a new smaller workflow for missing coverage. The bundled skill also contains one dormant same-node replacement branch, used only when a required failure explicitly has `retryable: true`; it never infers retryability from prose or runtime error text.
_Avoid_: Error-text retry classification, silent model fallback, unbounded retries

**Incomplete review**:
A review-workflow task-result state chosen by the script when a declared reviewer fails; it is not a runner-owned terminal state.
_Avoid_: Hidden missing coverage, runtime-wide review semantics

**Ready for integration (deferred)**:
A possible later writer-workflow result containing retained commits, verification, and review evidence. It is not a first-flow result and cannot claim automatic acceptance.
_Avoid_: First-flow handoff, ship verdict, automatic integration

**Run assembly (deferred)**:
A possible later post-writing step that combines writer commits on a run-owned branch without modifying the parent checkout; adoption requires a separate end-to-end prototype.
_Avoid_: First-flow assembly, parent integration, automatic conflict repair

**Delivery verdict (deferred)**:
A possible later delivery workflow's task-specific recommendation, assembled in JavaScript from review evidence and accepted or rejected by the parent; its vocabulary would remain outside the runtime contract.
_Avoid_: First-flow verdict requirement, runtime-wide verdict enum, automatic acceptance, worker self-acceptance

**Workflow-script authority**:
The parent is the only actor that may author or revise a workflow script; children can only return findings or recommendations.
_Avoid_: Child-authored workflow script, self-modifying workflow

**Execution approval**:
An explicit `APPROVE <8-character SHA-256 prefix>` authorization entered by the user after preparation in the same active parent session to execute one exact workflow-script revision once. Preparation also binds resolved role behavior and tools; any change requires preparation and approval again. Parent-guided recovery creates a new run.
_Avoid_: Pre-prepare approval, cross-session approval, friendly-ID mapping, reusable approval, implicit approval

**Preflight discovery**:
A parent-directed, read-only investigation after an orchestration request and before execution approval; it is not workflow execution.
_Avoid_: Unapproved node, workflow execution

## Prototype evidence

### JavaScript review workflow — validated

- **Question:** Can JavaScript await real Pi-backed Herdr children internally, fan review out, synthesize every final result, and return one value without public subagent steers?
- **Primary source:** branch `prototype/js-review-workflow`, commit `4622e08731d31ccda1c33eb01cff5610d86d0166`
- **Run:** `npm run prototype:review-workflow`
- **Observed:** three parallel Luna reviewers and one Luna synthesizer completed; the prototype's synthetic replacement is historical evidence only and is not part of the shipped flow; every real child used only read-only tools; no child result entered the parent session; completed panes closed; the exact-base shared checkout was disposed; sessions and a 15-event journal remained.
- **VM result:** `agent.constructor(...)` reached the host `process`, confirming that Node `vm` is not a security boundary.
- **Event-loop result:** a separate Node 26.3 probe showed that the VM timeout stops a synchronous infinite loop but not one started after `await`; production workflow code must run in a terminable Worker thread rather than Pi's main event loop.
- **Self-hosting result:** child `pi -ne -e subagent-done.ts` avoided duplicate loading of the repository and globally installed subagent extensions.
- **Answered later:** cancel-all is shipped as `herdr_workflow cancel` under a process-global terminal gate: active panes capture Herdr process identities before close, checkout dispose requires confirmed exit, and unconfirmed termination retains the checkout and ends `failed` with `cancel_termination_failed`.
- **Not answered:** writer review visibility; typed retryability remains deferred, while real launch-failure classification is covered by the shipped workflow failure envelope and same-process `/reload` ownership is covered by the process-global workflow owner.
