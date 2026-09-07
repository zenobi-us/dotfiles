# Dynamic workflow architecture assessment

**Date:** 2026-08-04
**Historical research baseline (not current package status):** legacy source commit `939ee2aadd5e776ed0a4bfd261fd7ad55c073270` (not carried into the clean repository history)
**Compared implementations:** [`milanglacier/pi-dynamic-workflow@ccf6c47`](https://github.com/milanglacier/pi-dynamic-workflow/tree/ccf6c47f438a02cdf610a5a9a2781a44db5468ee) (`0.1.2`) and [`QuintinShaw/pi-dynamic-workflows@0363b04`](https://github.com/QuintinShaw/pi-dynamic-workflows/tree/0363b0400b217e66a9c14425747a32b5a5fbe93f) (`3.5.0` plus one post-release fix).
**Evidence rule:** “Docs” means a documented contract. “Source” means behavior observed at the pinned commit. Claude Code is closed source, so its internal runtime and security properties cannot be source-verified here.

> This assessment establishes direction and comparisons. The later validated contract and implementation details in [`../orchestrated-review-workflow-plan.md`](../orchestrated-review-workflow-plan.md) supersede illustrative API examples in this report.

## 1. Executive verdict

**Do not port either PDW implementation into `pi-herdr-subagents`, and do not make this package a general workflow engine.** That would contradict the accepted boundary that this package owns agent execution while workflows remain the user-intent layer, and that a registry is justified only after repeated shared mechanics appear ([ADR-0002 execution boundary](../adr/0002-agent-workflow-skill-runtime-taxonomy.md#decision), [small migration plan](../adr/0002-agent-workflow-skill-runtime-taxonomy.md#small-migration-plan)).

The smallest coherent direction is narrower:

1. Ship one **package-bundled Pi skill** that teaches a parent agent to author a reviewable `workflow.js`. Do not add a second skill or workflow discovery system.
2. Require explicit approval of the **exact script bytes** before execution. `APPROVE <8-char-hash>` is acceptable only as a display prefix for a stored full SHA-256, with one unambiguous pending script in the session. It is not an eight-hex-digit security token.
3. Parse a JSON metadata header without evaluating the script. Treat that header as input to the parent’s written approval packet, not proof of what arbitrary JavaScript will do. V1 needs no confirmation-card component.
4. Run the approved script in a restricted Node `vm` with only a small private `agent()` and `log()` surface. State plainly that `node:vm` is **determinism and namespace hygiene, not a security boundary**. Both inspected PDWs say the same because injected host functions can expose the host `Function` constructor ([singular `sandbox.ts` lines 74–94](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/sandbox.ts#L74-L94), [plural `workflow.ts` lines 369–383](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow.ts#L369-L383)). Approval, tool policy, and checkout isolation are the real controls.
5. Make `agent()` return an explicit discriminated result. Do **not** copy the PDW convention where operational failure becomes `null`; filtering nulls can turn missing coverage into a false clean result.
6. Validate exact authenticated `provider/model-id` values through the existing runtime resolver. Do not add tiers or silent model fallback. The current resolver already fails on malformed, unknown, or unauthenticated explicit models ([`runtime-routing.ts`](../../pi-extension/subagents/runtime-routing.ts)).
7. Make `read`, `write`, and `review` runtime kinds explicit. A shared clean reader checkout at the approved base is new infrastructure and must be proven before use; never fall back to a dirty parent checkout. Every writer gets an SDK-owned worktree at the approved base SHA and is retained. Every run ends with fresh review; when a writer exists, the reviewer must inspect that retained candidate before it can be called `ready_for_integration`.
8. Keep integration hands-off. No push, PR, merge, cherry-pick into the user branch, cleanup, or branch deletion. This matches the current worktree contract ([worktree guide](../worktree-subagents.md)).
9. **Do not ship multiple writers until run assembly is proven.** For the first implementation, allow many readers/reviewers but at most one writer. The unresolved assembly problem is not a small detail: without an integration checkout, retained writer branches do not produce one candidate that a final reviewer can evaluate.

### Hypothesis assessment

| Current hypothesis | Verdict | Required correction |
| --- | --- | --- |
| Package-bundled native skill | **Borrow now** | Skill teaches authoring and approval; it does not discover/install workflows. |
| Approved `workflow.js` with parse-only JSON header | **Borrow now** | Hash exact raw bytes. Header is descriptive, never authoritative over code. |
| `APPROVE <8-char hash>` | **Borrow with guardrails** | Store and compare full SHA-256; require a unique pending script; invalidate approval on any byte change. |
| Restricted Node `vm` | **Borrow as hygiene only** | Never call it a sandbox or run untrusted third-party scripts. Use sync timeout and frozen globals. |
| Private `agent()` / `log()` SDK | **Borrow now** | Reuse the current launch/watch/result seams internally; do not call the public fire-and-forget tool from inside the VM. |
| Exact model allowlist | **Borrow now** | Reuse authenticated registry resolution; no tiers or fallback. |
| Explicit read/write/review kinds | **Borrow now** | Kind must drive tools, checkout placement, retention, and review policy. It is not a prompt label. |
| SDK-owned worktrees; pinned base SHA | **Borrow now** | Fail closed on creation failure. Never run a writer in the shared checkout as fallback. |
| Shared read checkout | **Prototype first** | This package does not have this seam today. Prove create/pin/fail/dispose behavior; never fall back to an unverified dirty parent checkout. |
| Retained writer branches | **Borrow now** | Return exact base/head/status metadata and leave integration and cleanup to the parent. |
| Mandatory fresh review | **Borrow now** | Review every run; when writing occurs, review the retained candidate rather than trusting worker self-review. |
| Hands-off `ready_for_integration` baseline | **Borrow now** | It is a review state, not proof of mergeability or authorization to integrate. |
| Unresolved run assembly | **Blocking for multi-writer** | Ship one writer first; prototype deterministic assembly before widening the cap. |

## 2. End-to-end architecture maps

### 2.1 Claude Code dynamic workflows: documented contract, not source-observed internals

```text
human prompt / saved command / bundled workflow
  └─ Claude authors JavaScript with metadata + orchestration body
       └─ conditional launch approval
            ├─ default / acceptEdits: prompt each run unless approved always
            ├─ auto: prompt first launch; ultracode can skip it
            └─ bypass / -p / Agent SDK: no launch prompt
                 └─ background workflow runtime
                      ├─ script variables hold intermediate results
                      ├─ script has no direct filesystem or shell access
                      ├─ agent() launches subagents (always acceptEdits)
                      ├─ max 16 concurrent / 1,000 total agents
                      └─ /workflows UI: inspect, pause/resume, stop, restart, save
                           ├─ stop: cache completed prefix under ordered replay rule
                           ├─ resume: documented within the same Claude session
                           └─ cross-session/post-exit durability is not documented as supported
```

The official contract says that a workflow is JavaScript written by Claude and executed in the background, with intermediate results in script variables ([workflows: “When to use a workflow”](https://code.claude.com/docs/en/workflows#when-to-use-a-workflow)). The launch card exposes phases and raw script, but whether it appears depends on permission mode; `-p` and Agent SDK runs start without approval ([workflows: “Approve the plan before it runs”](https://code.claude.com/docs/en/workflows#approve-the-plan-before-it-runs)). The launch prompt does **not** constrain worker edits: workflow subagents always use `acceptEdits`, inherit the tool allowlist, and may still prompt for shell, web, or MCP tools.

The runtime contract is deliberately bounded: no mid-run user input except permission prompts, no direct filesystem or shell access from the script, up to 16 concurrent agents, and 1,000 agents per run ([workflows: “Behavior and limits”](https://code.claude.com/docs/en/workflows#behavior-and-limits)). `/workflows` provides phase/agent detail plus pause/resume, stop, and restart controls ([workflows: “Watch the run”](https://code.claude.com/docs/en/workflows#watch-the-run)). Resume is ordered-prefix replay: after the first unfinished call, later calls rerun even if they had finished. The documented resume contract is within the same Claude session; cross-session or post-exit durability is not documented as supported ([workflows: “Resume after a pause”](https://code.claude.com/docs/en/workflows#resume-after-a-pause)).

Claude’s broader substrate is more mature than the workflow feature alone:

- Subagents have separate context windows, independent permissions, tool filters, optional model selection, and optional `isolation: worktree` ([subagents](https://code.claude.com/docs/en/sub-agents)).
- Worktree-isolated subagents branch from the repository default branch unless `worktree.baseRef` is `head`; unchanged temporary worktrees are removed, while changed, untracked, or unpushed work is kept from periodic cleanup ([worktrees: subagent isolation and cleanup](https://code.claude.com/docs/en/worktrees#isolate-subagents-with-worktrees)).
- Worktrees isolate files, not all repository state: they share `.git`, project plugins, and repository-level saved approvals ([worktrees: shared state](https://code.claude.com/docs/en/worktrees#understand-what-worktrees-share)).
- Sessions persist continuously, but resumption has exceptions: plan and bypass permission modes are not restored, and background Bash/monitor tasks are not restored ([sessions](https://code.claude.com/docs/en/sessions)).
- Agent teams add shared tasks, dependencies, messaging, and lead-approved teammate plans, but are experimental, token-heavy, and have resume/shutdown limitations. Worktree isolation is a separate concern rather than a capability supplied by the team feature itself ([agent teams](https://code.claude.com/docs/en/agent-teams)).

**Skeptical limit:** the documentation says “isolated environment,” but it does not publish the workflow runtime source or prove a process, VM, container, or capability-security boundary. We can compare contracts, not internal enforcement.

### 2.2 Singular PDW (`milanglacier/pi-dynamic-workflow@ccf6c47`): small but permissive

```text
/workflow <task>
  └─ extension injects authoring guide and triggers parent model turn
       └─ model calls lazily registered workflow tool
            ├─ source = inline script | saved workflow | script path
            ├─ no approval gate
            └─ node:vm async wrapper with host hooks
                 ├─ agent(): spawn `pi --mode json -p --no-session`
                 ├─ parallel()/pipeline(): failures collapse to null
                 ├─ semaphore + 200-agent hard cap + soft token/cost gate
                 ├─ successful calls append to best-effort JSONL journal
                 └─ foreground result OR detached workflow-complete message
                      └─ /workflow-stop or session shutdown aborts children
```

**Trigger and approval.** `/workflow` injects the guide and creates a parent turn; it does not inspect or approve the generated script ([`src/index.ts` lines 28–59](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/index.ts#L28-L59)). There is no source-level confirmation gate between authoring and `runWorkflowScript()`.

**Script and runtime.** The script is a plain async JavaScript body wrapped in `(async () => { ... })()` with host functions injected as globals ([`sandbox.ts` lines 62–111](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/sandbox.ts#L62-L111)). It blocks common nondeterminism, but its own security note shows that `agent.constructor("return process")()` can reach host globals. This is not suitable for a third-party workflow marketplace.

**Agent execution and output.** `agent()` spawns a new Pi process in JSON mode with `--no-session`; model and tools are passed on the command line ([`subagent.ts` lines 106–166](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/subagent.ts#L106-L166)). A schema creates a temporary `emit_result` extension. The final internal result includes success, text, optional structured value, usage, exit state, abort state, model, and error ([`subagent.ts` lines 241–304](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/subagent.ts#L241-L304)). The workflow-facing API discards that clarity: operational failures resolve to `null` ([`tool.ts` lines 294–354](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/tool.ts#L294-L354)).

**Scheduling and persistence.** A semaphore limits concurrent subprocesses; `parallel()` and `pipeline()` catch failures and produce `null` ([`scheduler.ts` lines 12–80](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/scheduler.ts#L12-L80)). Cost/token budgets are soft pre-spawn gates, so already-running agents can overshoot. The journal hashes prompt and behavior, groups equal hashes as queues, and replays any match rather than the official ordered unchanged prefix ([`journal.ts` lines 71–128](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/journal.ts#L71-L128)). Journal writes swallow all filesystem failures ([`journal.ts` lines 154–182](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/journal.ts#L154-L182)); a run can therefore claim resumability when no durable journal exists.

**Lifecycle and worktrees.** Background runs return immediately and later inject a completion message, but die with Pi; shutdown aborts all active runs ([`index.ts` lines 89–94](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/index.ts#L89-L94), [`tool.ts` lines 511–546](https://github.com/milanglacier/pi-dynamic-workflow/blob/ccf6c47f438a02cdf610a5a9a2781a44db5468ee/src/tool.ts#L511-L546)). There is no worktree ownership, retention, integration, or cleanup model.

### 2.3 Mature plural PDW (`QuintinShaw/pi-dynamic-workflows@0363b04`): broad and operationally capable, but too much and unsafe for writers

```text
keyword / effort mode / explicit command / saved or built-in workflow
  └─ parent model receives workflow authorization guidance
       └─ workflow tool parses required `export const meta` first statement
            ├─ default background manager run
            ├─ in-memory Pi SDK subagents, extension-free resource loader
            ├─ model tier/exact routing, schemas with repair, retries, budgets
            ├─ workflow manager + run JSON + locks + journals + task panel
            ├─ list/status/pause/resume/stop + usage-limit auto-resume
            ├─ process-local reload handoff; cold restart marks running as paused
            └─ result follow-up with persisted full-result pointer
```

The plural project credits Michael Livs’ earlier project and Claude Code, not the inspected singular repository ([README lines 343–344](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/README.md#L343-L344)). Treat the inspected singular and plural repositories as separate products; ancestry between them is not established by these pinned sources.

**Trigger and script format.** Keyword and effort hooks transform interactive input and temporarily add the workflow tool ([`workflow-editor.ts` lines 303–384](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow-editor.ts#L303-L384)). The parser uses Acorn and requires `export const meta = ...` as the first statement, with literal metadata ([`workflow.ts` lines 1343–1403](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow.ts#L1343-L1403)). There is no hash-bound human approval in the extension. The parent model is authorized to call the tool; background execution is the default ([`workflow-tool.ts` lines 145–270](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow-tool.ts#L145-L270)).

**Runtime and API.** The VM exposes a large API: `agent`, `parallel`, `pipeline`, nested workflows, verification helpers, loops, retry/gate/checkpoint, shared store, budgets, and logging. This is a product, not a thin seam. Its own runtime notes that VM globals are not a security sandbox ([`workflow.ts` lines 369–383, 1248–1264](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow.ts#L369-L383)).

**Agents, models, structured output.** Agents are in-memory Pi SDK sessions. The resource loader disables host extensions but still loads other Pi resources; exact model requests fail closed, while untagged agents can fall back from an unavailable implicit medium tier to the session model ([`agent.ts` lines 703–843](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/agent.ts#L703-L843)). Structured output gets two repair prompts, then attempts schema-validated extraction from prose, then fails ([`agent.ts` lines 116–165](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/agent.ts#L116-L165)). This is more robust than silent JSON parsing but adds turns and model-dependent fallback behavior.

**Scheduling and journal.** The runtime shares a limiter, agent cap, token accounting, abort controller, and in-flight set across nested workflows. Resume uses a positional call index plus hash and stops cache replay at the first miss, matching the documented Claude contract ([`workflow.ts` lines 404–550, 625–673](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow.ts#L404-L550)). The manager freezes run options, persists initial state before work, and maintains leases ([`workflow-manager.ts` lines 419–517](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow-manager.ts#L419-L517)). Persistence uses atomic write/rename, backups, lock ownership, and terminal-run retention ([`run-persistence.ts` lines 218–475](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/run-persistence.ts#L218-L475)).

**Controls and restart.** Pause aborts and journals; resume reconstructs run settings and replays the unchanged prefix; stop can mark a live or persisted run aborted ([`workflow-manager.ts` lines 1113–1329](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow-manager.ts#L1113-L1329)). Same-version `/reload` hands the live manager through a process-global slot; mismatch or unclaimed handoff pauses runs ([`extension-reload.ts` lines 11–105](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/extension-reload.ts#L11-L105)). Cold-start recovery marks stale `running` records `paused`, but catches and suppresses all recovery errors ([`workflow-manager.ts` lines 360–382](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow-manager.ts#L360-L382)). Result delivery failures are swallowed, with the persisted run view as fallback ([`task-panel.ts` lines 140–233](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/task-panel.ts#L140-L233)).

**Critical worktree defect.** `createWorktree()` falls back to `isolated: false` and the shared base checkout on any Git/worktree failure ([`worktree.ts` lines 41–59](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/worktree.ts#L41-L59)). That is unacceptable for an explicit writer isolation request: a collision, stale branch, missing Git, or command error silently moves writes into the shared tree. After every isolated agent attempt, the runtime calls cleanup in `finally`; cleanup uses `git worktree remove --force` and `git branch -D`, swallowing errors ([`workflow.ts` lines 873–879](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/workflow.ts#L873-L879), [`worktree.ts` lines 62–76](https://github.com/QuintinShaw/pi-dynamic-workflows/blob/0363b0400b217e66a9c14425747a32b5a5fbe93f/src/worktree.ts#L62-L76)). This can discard dirty files and unique local commits. It also means the advertised “path surfaced for inspection” is not a retained review handoff. This mechanism does not fit Herdr’s retained workspace model.

### 2.4 Current `pi-herdr-subagents`: strong execution and handoff, no workflow runtime

```text
subagent({...})
  └─ resolve role + exact authenticated model/thinking + cwd/session mode
       ├─ ordinary run: create no-focus Herdr tab/pane
       └─ writer run: resolve base ref -> exact SHA
            ├─ write ownership manifest before Herdr resource creation
            └─ Herdr creates no-focus managed worktree workspace
                 └─ launch Pi or Claude command into explicit pane ID
                      ├─ current public tool returns acknowledgement immediately
                      ├─ watcher combines exit sidecar/sentinel/pane inspection
                      ├─ widget projects process + turn lifecycle
                      └─ completion extracts bounded summary
                           ├─ ordinary pane: close
                           └─ worktree: retain + inspect Git + persist handoff
                                └─ steer result into replacement/current parent session
```

**Launch and model policy.** The launch path resolves a role, exact runtime, session placement, worktree, command, control extension, tool allowlist, and watcher record in one large function ([`index.ts`](../../pi-extension/subagents/index.ts)). A workflow SDK should extract a narrow private execution seam; it should not invoke the public tool, which intentionally returns before results exist.

**Worktree ownership.** For an isolated run, the extension resolves the requested base to a SHA, writes a `provisioning` manifest, asks Herdr to create the workspace, records observed path/workspace/pane/branch, and launches in that root ([`index.ts`](../../pi-extension/subagents/index.ts)). On completion it captures head SHA, commits ahead, staged/unstaged/untracked/conflicted files, and reports unknown rather than guessing if inspection fails ([`index.ts`](../../pi-extension/subagents/index.ts)). Worktree runs are retained in success, failure, and help states; non-worktree panes are closed ([`index.ts`](../../pi-extension/subagents/index.ts)).

**Lifecycle and errors.** Completion checks an exit sidecar, Claude sentinel, terminal sentinel, and Herdr pane state. A disappeared pane without completion evidence is an explicit failure after a bounded artifact grace period ([`completion.ts`](../../pi-extension/subagents/completion.ts)). The lifecycle separates process state, turn state, health, completion, and delivery ([`lifecycle.ts`](../../pi-extension/subagents/lifecycle.ts)). `subagent_interrupt` sends Escape and leaves the process/session/pane alive; it is not a full run stop.

**Reload and restart.** Watchers and their map are process-global, so `/reload`, `/new`, `/resume`, and `/fork` preserve active workers; quit suppresses delivery and aborts watchers ([`index.ts`](../../pi-extension/subagents/index.ts)). A full restart retains Herdr worktrees and manifests but does not reconcile watchers; worktree-aware resume is absent ([worktree guide](../worktree-subagents.md)).

**Delivery and data loss.** The child’s full session remains on disk. The parent receives a bounded result directly in the wake-up message, with a display-only custom message beside it ([`index.ts`](../../pi-extension/subagents/index.ts)). This avoids the plural PDW’s “swallow delivery and make the user find the run” default. Git inspection failures become unknown, not clean. The main remaining data-loss risk is operator cleanup after the handoff, not automatic extension deletion.

**Security boundary.** Herdr panes and Git worktrees are not sandboxes. The Pi path runs with the user’s permissions; the Claude adapter currently uses `--dangerously-skip-permissions` and only checks workspace drift afterward ([`index.ts`](../../pi-extension/subagents/index.ts)). A workflow private SDK should exclude that adapter from the first version unless the user explicitly chooses its different permission contract.

## 3. Evidence-backed comparison table

| Concern | Claude Code docs | Singular PDW source | Mature plural PDW source | Current `pi-herdr-subagents` source |
| --- | --- | --- | --- | --- |
| Trigger / authoring | Prompt, keyword/ultracode, bundled or saved command; Claude writes script | `/workflow` injects a guide, then model calls tool | Keyword/effort/command authorizes tool; model or saved workflow supplies script | No general workflow trigger; `/plan` is prompt orchestration |
| Approval | Conditional phase/script card; absent in bypass, `-p`, SDK | None | None bound to exact bytes | No workflow approval; worktree spawn is a tool call |
| Script format | Metadata plus plain JS body | Plain async JS body | First statement must be literal `export const meta` | Not applicable |
| Runtime boundary | Docs say isolated environment; implementation closed | `node:vm`; explicitly escapable through host functions | `node:vm`; explicitly not security sandbox | Separate OS processes in Herdr; same user permissions |
| Direct script I/O | Contract says no direct FS/shell | VM omits direct FS/shell but host escape exists | VM omits direct FS/shell but host escape exists | Child agents have configured Pi/CLI tools |
| Agent API | `agent()` plus orchestration helpers; errors can become null | `agent(prompt, opts)` → text/structured/null | Large API; `agent()` → text/structured/null | Public `subagent()` → immediate acknowledgement; result arrives later |
| Structured output | Documented schema option/structured workflow patterns | Temporary `emit_result` extension | Tool capture, two repairs, schema extraction fallback | Completion is prose plus structured metadata; no workflow schema contract |
| Model routing | Session model unless script routes or env overrides | Explicit model/agent default passed to Pi | Exact model, phase routes, semantic tiers, implicit fallback | Exact authenticated ID with deterministic precedence |
| Tool routing | Workflow agents inherit allowlist and run in `acceptEdits` | Per-call tools; omission means broad Pi access | Agent type/call allowlists; host extensions disabled | Role/tool allowlist and extension-specific deny controls |
| Concurrency | 16 concurrent; 1,000 total | CPU-derived 2–8 default; 200 total | Up to 16; 1,000 total | No central cap; callers may spawn many fire-and-forget children |
| Budget | Usage warning and plan rate limits; size guideline is advice | Optional soft token/cost pre-spawn gate | Optional soft token/phase budgets; usage-limit scheduler | No run-wide token/cost budget |
| Journal / replay | Ordered completed prefix; same session only | Best-effort hash multiset, 50 runs | Durable positional prefix with hashes, leases, settings carryover | Child sessions and worktree manifests, not workflow replay |
| Background lifecycle | `/workflows`; session remains responsive | Detached promise; dies with Pi | Managed run, task panel, reload handoff, cold pause | Herdr child process, watcher, process/turn widget |
| Pause / resume / stop | Pause/resume, agent/workflow stop, agent restart | Stop only; resume means a new run using cached calls | List/status/pause/resume/stop; usage-limit auto-resume | Interrupt active Pi turn; resume opens ordinary pane, not worktree-aware |
| Reload / restart | Workflow resume only in same session; exit starts fresh | Shutdown aborts | Same-version reload carries live manager; restart marks stale run paused | Reload/new/resume/fork preserve watcher; full restart does not reconcile |
| Worktree base | Default branch unless `baseRef=head` | None | Current `HEAD`; not recorded as approved SHA | Requested ref resolved and recorded as exact SHA |
| Worktree failure | Docs describe errors/retention, source unavailable | None | **Falls back to shared checkout** | Fails creation; manifest records failure; no writer fallback |
| Worktree completion | Unchanged may auto-remove; changed work retained for sweep | None | **Always force-removes worktree and `-D` branch** | Retains success/failure/help workspace and branch |
| Integration | Product-dependent; agent view may open draft PR | None | No coherent retained assembly | Parent-owned; extension never pushes/merges/cherry-picks |
| Final delivery | One consolidated result in session | Tool result or `workflow-complete` message | Follow-up message; persisted run is fallback | Bounded result wakes parent; full child session + Git handoff retained |
| Failure semantics | Agent may resolve null; ordered replay can rerun later successes | Null by default; easy to filter away | Null/retry/error mix; substantial classification code | Explicit nonzero/error summary; Git unknowns remain unknown |

## 4. What to borrow now, later, or reject

### Borrow now

| Mechanism | Why it earns its cost | Minimum form |
| --- | --- | --- |
| Code holds orchestration | Loops and branching stay out of the parent context; the official workflow rationale is sound | Approved plain JS; standard `Promise.all`, arrays, loops; no custom `parallel()`/`pipeline()` helpers |
| Parse-before-execute metadata | Enables a stable written approval packet without running code | One JSON comment/header parsed with `JSON.parse`; reject missing/invalid/unknown required fields |
| Exact-byte approval | Prevents “approved plan, changed script” ambiguity | Full SHA-256 stored; eight-character display prefix; one pending candidate |
| Explicit kinds | Converts intent into enforceable runtime policy | `read`, `write`, `review` map to tool policy, checkout placement, and required handoff |
| Exact model validation | Existing code already has it; silent substitution is dangerous | Reuse authenticated registry; no model tiers |
| Hard agent/concurrency limits | Stops accidental fan-out without needing cost accounting | Conservative fixed defaults plus metadata-declared lower values; refuse higher values |
| Explicit result union | Prevents missing work from looking successful | `{ ok: true, value, handoff }` or `{ ok: false, code, message, handoff? }` |
| Pinned worktree ownership and retention | This repository already implements it and has the right data-loss posture | Use existing manifest and handoff fields; fail closed |
| Fresh review gate | Independent review is cheap relative to integrating bad writes | New review agent after candidate exists; failure blocks `ready_for_integration` |

### Borrow later, only on a measured trigger

| Mechanism | Why not now | Revisit trigger |
| --- | --- | --- |
| Durable workflow journal and prefix replay | The plural implementation needs hundreds of lines of manager, persistence, lease, compatibility, and cache semantics | Users repeatedly lose expensive runs to restart, and one-run/session recovery is insufficient |
| Pause/resume/restart of individual agents | Current child interrupt is turn-level, not process/run control | Long runs need operator control beyond cancel-all, with clear ownership semantics |
| Token/cost budgets | Current child completion does not expose reliable run-wide usage | Pi child sessions expose stable usage metadata and users need hard spend policy |
| Structured output repair | Two repair turns and prose extraction add cost and ambiguity | Real workflows need machine data and direct tool capture proves unreliable |
| Saved workflow discovery/commands | Duplicates Pi skills and creates precedence/versioning policy | At least two independent workflow products need shared discovery mechanics |
| Built-in quality helpers | Plain JS plus reviewer roles can express them | Three or more scripts duplicate the same verified helper and tests |
| Usage-limit auto-resume | Requires durable run state and provider-specific classification | Durable replay exists and limits are a common interruption mode |
| Multi-writer assembly | Needs deterministic integration, conflicts, candidate identity, and review target | Single-writer workflows are limiting real work; prototype passes conflict/data-loss tests |

### Reject

| Mechanism | Reason |
| --- | --- |
| Port the plural manager/runtime wholesale | It duplicates this package’s lifecycle, status, model, role, worktree, and persistence layers and violates ADR-0002’s scope. |
| VM as a security claim | Both source implementations admit host-function escape. Use approval and capabilities; call the VM hygiene only. |
| Failure-to-`null` as the default | It invites `.filter(Boolean)` to erase missing coverage. Failures must remain named and countable. |
| Writer isolation fallback to shared checkout | Violates the explicit isolation request and can corrupt the user’s working tree. |
| Automatic `--force` worktree removal or `branch -D` | Can destroy uncommitted files and unique commits. It directly conflicts with Herdr’s retained lifecycle. |
| Automatic push/PR/merge/cherry-pick | Adds irreversible shared side effects before run assembly and review are settled. |
| Model tiers and heuristic fallback | The current exact authenticated model resolver is safer and already sufficient. |
| General workflow package/role contribution manifest | ADR-0003 intentionally limits the contribution seam to roles ([ADR-0003](../adr/0003-installable-role-packs.md)). |
| Multiple writers without one reviewable candidate | A set of branches is not an integrated result. Calling it ready is false. |

## 5. Smallest coherent technical architecture for this extension

### 5.1 Scope and non-goals

The first product slice is a review workflow:

- one approved workflow run at a time per parent session;
- bounded parallel independent `review` agents;
- one fresh review synthesizer receiving every explicit result;
- background execution with a small status row and cancel-all;
- one final evidence-backed receipt.

The next slice adds bounded `read` fan-out plus exactly one `write` agent and retained worktree before the same review-and-synthesis phase.

The first slice does not support writers, a `/workflows` navigator, task panel, saved workflow discovery, nested workflows, mid-run user checkpoints, per-agent restart, durable replay, usage-limit auto-resume, automatic integration, publication, or cleanup.

### 5.2 Authoring and approval

The bundled Pi skill teaches the parent to write an artifact such as:

```js
// workflow-meta: {"name":"auth-audit","base":"<exact-sha>","maxAgents":6,"concurrency":3,"models":["provider/model-id"]}
const files = await agent("List auth entry points", {
  kind: "read",
  model: "provider/model-id",
  tools: ["read", "grep"],
});

const change = await agent(`Implement the approved change using: ${files.value}`, {
  kind: "write",
  model: "provider/model-id",
  tools: ["read", "edit", "write", "bash"],
});

return agent(`Review this candidate: ${change.handoff.branch}`, {
  kind: "review",
  model: "provider/model-id",
  tools: ["read", "grep", "bash"],
});
```

The runtime performs only these actions before approval:

1. Read exact bytes.
2. Parse and validate the JSON header.
3. Parse JavaScript syntax; do not evaluate.
4. Validate declared models against the authenticated registry.
5. The parent posts a written approval packet in conversation: source, kinds, exact models, hard runtime limits, exact base SHA, filesystem policy, worktree retention, known unknowns, and hash. V1 adds no dedicated card UI.
6. Store `{ fullHash, path, bytes, baseSha, createdAt }` as the only pending candidate.

`APPROVE deadbeef` succeeds only if `deadbeef` is the unique prefix of that pending candidate’s full hash and the bytes still hash identically. Any edit, base change, or new candidate invalidates approval. Revalidate declared model pins immediately before launch; an unavailable pin fails without executing but does not require a separate catalog-version protocol. Do not add “always approve” in v1; Claude’s own “Always” path reduces repeated friction but also weakens review, and its approval can disappear entirely in non-interactive modes.

### 5.3 Runtime

Run only already-approved bytes. Create one VM context with:

- frozen `agent` and `log` host functions;
- frozen JSON-compatible `args` and metadata;
- standard language intrinsics needed for arrays, objects, and promises;
- no `require`, `import`, `process`, direct filesystem, shell, timers, network, or dynamic code generation;
- a short synchronous execution timeout for pre-`await` loops;
- an overall run abort signal.

Even with `codeGeneration: { strings: false, wasm: false }`, injected host functions make this a weak boundary. The threat model is therefore: **the user approved model-authored code running with a narrowly capability-checked SDK**. Third-party or remotely downloaded scripts are out of scope.

Use normal JavaScript instead of adding `parallel()`, `pipeline()`, `retry()`, `gate()`, `verify()`, or a shared store. `Promise.all` and explicit loops are sufficient. Put the concurrency limiter inside `agent()` so raw `Promise.all` cannot bypass it.

### 5.4 Private SDK

A minimal internal contract is:

```ts
type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
type AgentKind = "read" | "write" | "review";
type RunState = "completed" | "failed" | "cancelled" | "interrupted";

type AgentResult =
  | { ok: true; value: string; sessionFile: string; handoff?: WorktreeHandoff }
  | {
      ok: false;
      code: string;
      message: string;
      retryable: boolean;
      sessionFile?: string;
      handoff?: WorktreeHandoff;
    };

type RunEnvelope = {
  runId: string;
  state: RunState;
  result?: JsonValue;
  error?: { code: string; message: string };
};

agent(
  prompt: string,
  options: {
    kind: AgentKind;
    role: string;
    model: `${string}/${string}`;
  },
): Promise<AgentResult>;

log(message: string): void;
```

The runner owns only the operational envelope. A `completed` run means the approved JavaScript returned a JSON-compatible value; task-specific states such as `incomplete`, review verdicts, retries, and evidence layout remain ordinary JavaScript. V1 does not need `input`, schema, retry, parallel, pipeline, or verdict APIs. The runner derives effective tools as `resolved role tools ∩ kind maximum ∩ extension deny rules`; `agent()` cannot grant tools.

The private executor should reuse current implementation behavior but change policy:

- `read`: use a new, clean shared run-base checkout only after Stage 0 proves its create/pin/fail/dispose lifecycle; deny mutation tools and workflow spawning, and fail closed rather than falling back to the parent checkout.
- `write`: create one Herdr-managed worktree from approved `baseSha`; fail closed on any creation error; retain it and return the full Git handoff.
- `review`: start a fresh context on every run, after the writer when one exists; inspect the retained candidate for a writing run. It must not share a prior agent’s conversation or be able to mutate.
- all kinds: exact authenticated model only; no Claude CLI adapter in v1; no public `subagent_result` steer for each child.

This requires extracting a private “launch + await + return result” seam from `launchSubagent()` and `watchSubagent()`. Keep public fire-and-forget delivery unchanged. Do not add flags throughout the public path such as `suppressWidget`, `suppressDelivery`, `returnResult`, or `workflowKind`; a dedicated private adapter is smaller and avoids mixed lifecycle states.

### 5.5 Run state and delivery

Use one small process-local record, not a durable manager:

```text
pending_approval
  -> running
  -> reviewing
  -> ready_for_integration | failed | cancelled
```

Persist only an append-only run summary artifact sufficient for diagnosis: approved full hash, exact base SHA, child IDs/session paths, worktree handoff, result, and terminal state. Do not claim resume. On `/reload` within the same process, retain the record and controllers in the same process-global style as current subagent watchers. On full restart, mark an observed stale run `interrupted` and point to retained child/worktree artifacts; do not replay automatically.

The parent gets one final bounded workflow result, not one steer per child. Full child sessions and the retained worktree remain the fallback. A failed review produces `failed_review`, not `ready_for_integration`.

### 5.6 Checkout and candidate model

At approval, resolve the base ref to an exact SHA. Stage 0 must prove that the runner can create, pin, and dispose one clean shared checkout at that SHA for readers; failure must block the run. Do not promise visibility of parent uncommitted files or fall back to that checkout, because either behavior would weaken reproducibility and approval.

For one writer:

```text
approved base SHA
  └─ SDK-owned writer branch/worktree
       ├─ writer changes and tests
       ├─ retained exact head/status handoff
       └─ fresh review of base...head plus working-tree state
            └─ ready_for_integration (no integration action)
```

For more than one writer, there is no valid candidate until branches are assembled. That is deliberately deferred.

## 6. Staged implementation and verification plan

### Stage 0 — prove the risky seams; no product surface

Build throwaway tests or a prototype for these questions:

1. Can an approved VM script escape through `agent.constructor` despite disabled string code generation? Record the answer and keep the security claim honest.
2. Can the existing launch/watch path return a child result internally without emitting a public steer, while preserving normal public behavior?
3. Can a read-only child be pinned to a clean shared checkout with mutation tools absent?
4. Can a writer create, fail, finish, or request help while its worktree remains retained with exact handoff metadata?
5. Can a fresh reviewer inspect committed and uncommitted candidate state without mutating it?

**Gate:** no implementation ticket until all five have executable evidence.

### Stage 1 — approved review workflow

Implement the smallest vertical slice:

- bundled authoring skill;
- parse-only JSON header and syntax validation;
- exact-byte full hash plus eight-character approval prefix;
- VM with only `agent(review)` and `log`;
- bounded parallel independent reviewers followed by one fresh synthesizer;
- exact models, hard `maxAgents` and concurrency;
- explicit result union passed intact into synthesis;
- one script-owned fresh replacement attempt for each retryable required-reviewer failure, using the same role and exact model;
- one final delivery;
- cancel-all and terminal status.

**Verification:** unit-test header rejection, unknown fields, byte-change invalidation, ambiguous/stale approvals, model auth failure, agent cap, concurrency cap, abort, VM global absence, failure preservation, retry classification, the one-replacement cap, same-model enforcement, and synthesis input completeness. Real integration tests must launch multiple Pi reviewers, force one recoverable launch/provider failure, verify a fresh replacement starts, verify no child can write, prove every final result reaches the synthesizer, and prove only one final parent delivery occurs.

### Stage 2 — research fan-out, one retained writer, and mandatory review synthesis

Add:

- approved exact base SHA;
- one SDK-owned writer worktree;
- no fallback to shared checkout;
- retained success/failure/help handoff;
- fresh read-only review;
- `ready_for_integration` terminal state.

**Verification:** use a dirty parent checkout and prove it is unchanged; prove uncommitted parent files are absent from the writer base; inject worktree creation failure and prove no writer starts; leave staged/unstaged/untracked/conflicted files and verify accurate handoff; kill the child and prove retention; fail review and prove readiness is withheld. Run the repository’s normal `npm test`, `npm run lint`, `git diff --check`, and real Herdr integration suite.

### Stage 3 — reload and interruption hardening

Carry process-local run ownership across `/reload` without changing the public worker lifecycle. On a full restart, reconcile only enough to label stale runs interrupted and expose retained artifacts; do not auto-resume.

**Verification:** reload during read, write, and review; package-version mismatch; parent quit; missing pane; missing completion evidence; delivery failure; corrupt summary artifact. No state may be guessed clean or complete.

### Stage 4 — multi-writer assembly prototype

Prototype, do not yet productize, a runner-owned integration worktree:

```text
approved base SHA
  ├─ writer A retained branch
  ├─ writer B retained branch
  └─ integration branch/worktree at approved base
       ├─ apply exact writer commits in declared deterministic order
       ├─ stop on first conflict; retain all state
       ├─ run destination checks
       └─ fresh review of the assembled candidate
```

Compare cherry-pick, merge-commit, and patch application using real conflict cases. Require exact input head SHAs and reject dirty writer branches unless the assembly method explicitly includes their patch. The extension must not touch the user’s destination branch.

**Gate:** only widen beyond one writer when the prototype preserves dirty files, unique commits, conflict state, and exact provenance across failure and restart.

### Stage 5 — add durability only if usage proves it is needed

If real workflows are expensive enough that restart loss matters, add a minimal ordered journal. Reuse the official/plural unchanged-prefix rule rather than singular hash-multiset replay. Add leases and atomic writes only at that point. Do not add saved workflow discovery, model tiers, auto-resume, or 300-run history as collateral scope.

## 7. Revised ordered grilling plan

### 7.1 Facts that evidence resolves — do not spend user time on them again

1. **A worktree is not a security sandbox.** It isolates checkout/index/HEAD, while the process keeps user permissions and shares repository state.
2. **A Node `vm` with host callbacks is not a security boundary.** Both PDWs explicitly admit the escape.
3. **The current extension already has the safer worktree posture.** It resolves an exact base, writes ownership before creation, retains work, and reports unknown inspection state instead of deleting or guessing.
4. **The plural PDW’s writer fallback and cleanup are incompatible.** Shared-checkout fallback plus forced worktree/branch deletion must not be borrowed.
5. **The singular PDW is not enough.** It lacks approval, worktrees, durable trustworthy journaling, per-agent retry, and restart control.
6. **The plural PDW is too much for this package.** Its manager, persistence, scheduler, UI, model tiers, helper library, saved workflows, and role behavior duplicate existing or explicitly deferred ownership.
7. **Exact models should fail closed.** The current resolver already implements this.
8. **A set of writer branches is not one feature-wide candidate.** Individual branches can be reviewed and marked ready for integration, but a `ship` verdict for the combined feature needs run assembly.
9. **Official Claude workflow resume is not durable restart recovery.** Resume is documented within one session; cross-session or post-exit durability is not documented as supported.
10. **Approval must bind bytes, not prose.** A written approval summary or JSON header alone cannot constrain arbitrary JavaScript.
11. **Approval UX is settled for v1.** The parent posts a written packet and the user replies `APPROVE <8-character hash prefix>`; no dedicated confirmation card or friendly-ID mapping.
12. **The hands-off baseline is settled.** Retain writer branches and evidence without automatic integration or a feature-wide `ship` claim.
13. **Run assembly remains a prototype question.** Do not productize it or use it to justify multiple-writer feature verdicts before executable evidence.
14. **The first release has one writer lane.** Read and review phases may fan out within limits, but exactly one write node and retained worktree own the candidate.
15. **Review aggregation is settled.** The bundled authoring skill produces approved JavaScript in which independent read-only reviewers feed one final fresh synthesis reviewer. The runtime stays task-agnostic rather than adding a fixed review state machine.
16. **The first product flow is settled.** An approved JavaScript review workflow launches the parallel reviewers and synthesis node; parent-scheduled nodes and writing are outside this first slice.
17. **The agent return contract is settled.** `agent()` returns an explicit discriminated success-or-failure result; operational failures never collapse to `null`.
18. **Review failure policy is settled.** Every declared reviewer is required. JavaScript makes one fresh replacement attempt after a retryable infrastructure or exhausted-provider failure, using the same approved role and exact model. The synthesizer receives every final success or failure envelope; a failure after replacement makes the workflow `incomplete` and blocks acceptance without suppressing the final explanation.
19. **Approved scripts are the trust boundary.** V1 does not attempt to run unreviewed third-party scripts safely inside Node `vm`.
20. **Dirty-parent semantics are settled.** Execution reads and writers use the approved base commit; parent uncommitted changes are not copied implicitly.
21. **The runtime/task boundary is settled.** The runner returns a small fixed operational envelope; `workflow.js` may return any JSON-compatible task result. Review receipts, verdict vocabularies, retry loops, and synthesis semantics are script-owned rather than runtime APIs.
22. **KISS is a design constraint.** Prefer ordinary JavaScript and existing Herdr seams; do not add helpers or state machines for behavior a parent-authored script can express directly.
23. **Approval is single-use.** `APPROVE <hash-prefix>` authorizes one whole run. Script-owned reviewer replacement remains inside that run; rerunning the workflow creates a new run and requires approval again.
24. **The Code Mode analogy is useful but bounded.** Both approaches keep intermediate calls in model-authored code behind a narrow capability API ([Cloudflare Code Mode](https://blog.cloudflare.com/code-mode/)). Herdr adds exact-byte human approval and long-running subagent lifecycle, while its Node `vm` is not Cloudflare's secure isolate and its SDK must not expand into a broad generated tool catalog.
25. **Tool policy is settled.** The runner derives effective tools from resolved role tools, the hard kind maximum, and extension deny rules. `agent()` has no script-controlled `tools` option.
26. **Terminal lifecycle is settled.** Reuse current Herdr behavior: close completed ordinary read/review panes after result capture, retain child session files and run evidence, and retain writer worktree workspaces.
27. **Restart behavior is settled.** Same-process Pi lifecycle transitions such as `/reload` preserve active ownership. A full process restart marks a stale workflow interrupted, retains artifacts, performs no replay, and requires a new approved run.
28. **The first runtime adapter is Pi-only.** Private workflow `agent()` launches only Pi-backed agents in the first flow. Existing public Claude-backed `subagent()` behavior remains unchanged; a workflow adapter waits until it can enforce the same model, tool, and result contracts.

### 7.2 Product decisions remaining

None for the first review workflow. Product grilling is complete.

### 7.3 Prototype results and remaining gates

#### Validated: JavaScript review flow

Branch `prototype/js-review-workflow` at `4622e08731d31ccda1c33eb01cff5610d86d0166` is the primary source. `npm run prototype:review-workflow` used three parallel Pi-backed Luna reviewers, one synthetic retryable start failure and fresh replacement, then one Luna synthesizer. The run returned one JSON-compatible result in one operational envelope.

Observed evidence:

- all four real children reported `openai-codex/gpt-5.6-luna`;
- child tool calls were limited to `read`, `grep`, and `find`;
- no prototype child result or ping entered the parent session;
- `pi -ne -e subagent-done.ts` avoided the repository/global extension conflict;
- the exact-base shared checkout was created and cleanly disposed;
- all completed panes closed while four session files and a 15-event journal remained;
- `agent.constructor("return typeof process")()` reached the host `process`, confirming the VM is not a security boundary;
- a separate Node 26.3 probe showed that the VM timeout stops a synchronous infinite loop but not one started after `await`, so production workflow JavaScript must run in a terminable Worker thread rather than Pi's main event loop.

The retry failure was synthetic. This run therefore validates JavaScript replacement control flow, not real launch-failure classification.

#### Historical review-flow gates and later status

1. **Real failure classification:** still open at this assessment boundary; actual launch and exhausted-provider failures need stable retryable/non-retryable results without guessing from prose.
2. **Cancellation:** resolved after this assessment; fail-closed cancellation has shipped. See the active implementation plan for current evidence.
3. **Reload ownership:** still open; one process-local record must survive `/reload` and select the fresh Pi API for exactly one final delivery.

#### Later writer-flow gates

1. **Review visibility:** can a read-only reviewer reliably inspect committed, staged, unstaged, untracked, and conflicted state in a retained writer worktree?
2. **Run assembly:** only if multiple writers are later requested, can a runner-owned integration worktree apply exact writer heads deterministically, stop on conflict, and preserve provenance without touching the destination branch?

**Stop product grilling here.** The first review flow justifies no structured-output subsystem, scheduler DAG, merge queue, workflow registry, durable controller, saved-command system, or general integration engine.
