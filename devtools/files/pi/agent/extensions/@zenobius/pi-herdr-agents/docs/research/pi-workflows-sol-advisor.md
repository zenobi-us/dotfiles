# Research: pi-dynamic-workflows and sol-advisor

**Date:** 2026-08-03
**Question:** What are the architectures, execution/data flows, and extension points of first-party `pi-dynamic-workflows` and `DannyMac180/sol-advisor`, and which ideas transfer to a potential `pi-herdr-subagents` workflow feature?
**Method:** Read-only review of GitHub source/docs clones. No code modified.
**Local transfer context (not the research targets):** `giuseppecrj/pi-herdr-agents` ADR-0002 taxonomy and draft orchestrator-designed-workflows spec.

> This is preliminary research. The later ADRs and [`../orchestrated-review-workflow-plan.md`](../orchestrated-review-workflow-plan.md) supersede its early recommendation for a declarative workflow document.

## Sources pinned

| Project | Repo | Branch | Commit | Notes |
| --- | --- | --- | --- | --- |
| pi-dynamic-workflows | <https://github.com/Michaelliv/pi-dynamic-workflows> | `main` | `31b2aca0f1cb195aafbfc5e3ee2b8c83ad3f21a2` (Release v1.0.1, 2026-05-31) | Earliest public tree found (created 2026-05-28; many community forks exist). Package version `1.0.1`. |
| sol-advisor | <https://github.com/DannyMac180/sol-advisor> | `main` | `52c0f5d467a672241665fa45aab15333274c1eef` (merge of Luna task lane, 2026-08-03) | Codex plugin version `0.4.0` in `plugins/sol-advisor/.codex-plugin/plugin.json`. |

Related first-party inspiration cited by the workflow package:

- Anthropic dynamic workflows post: <https://claude.com/blog/introducing-dynamic-workflows-in-claude-code>

## 1. pi-dynamic-workflows

### What it is

A Pi package that adds one tool: `workflow`. The parent model does not call many subagents itself. It writes a small deterministic JavaScript script; the tool parses and runs that script in a Node `vm` sandbox; the script fans out work through `agent()`, `parallel()`, and `pipeline()`.

Install surface (from README / `package.json`):

- `pi install npm:pi-dynamic-workflows`
- Pi package metadata: `"pi": { "extensions": ["extensions/workflow.ts"] }`
- Peer packages: `@earendil-works/pi-ai`, `@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui` (^0.78.0 in the pinned tree)

### Architecture (modules)

| Path | Role |
| --- | --- |
| `extensions/workflow.ts` | Extension entry: `registerTool(createWorkflowTool())`; on `session_start`, force-activates the tool. |
| `src/workflow-tool.ts` | Tool definition, prompt guidelines, abort handling, streaming progress via tool updates. |
| `src/workflow.ts` | Acorn AST parse/validate of `export const meta`, determinism checks, sandboxed runtime, concurrency limiter, globals. |
| `src/agent.ts` | `WorkflowAgent`: in-memory Pi session per `agent()` call via `createAgentSession` + `SessionManager.inMemory`. |
| `src/structured-output.ts` | Terminating `structured_output` tool (`terminate: true`) for schema-validated returns. |
| `src/display.ts` | Snapshot model + compact text/widget renderers for live progress. |
| `types/workflow.d.ts` | Ambient globals for reusable workflow scripts (`/// <reference types="pi-dynamic-workflows/workflow" />`). |

### Execution / data flow

```text
user asks for a workflow
  → parent Pi model writes a JS script
  → workflow tool receives { script, args? }
  → parseWorkflowScript(script)
       - first statement must be export const meta = { name, description, ... }
       - meta is literal-only (no spreads, computed keys, interpolation, calls)
       - whole AST bans Date.now(), Math.random(), new Date()
  → runWorkflow in vm.createContext
       globals: agent, parallel, pipeline, phase, log, args, cwd, process.cwd, budget
       no require/import/fs/network
  → each agent() call:
       concurrency-limited
       WorkflowAgent.run → createAgentSession(in-memory) + coding tools
       optional schema → structured_output capture
       returns text or validated object (null on non-abort failure)
  → live snapshot streams through tool onUpdate / optional UI widget
  → final structured-cloneable result returned to parent as tool content + details
  → Esc/abort marks running agents skipped and aborts sessions
```

Important runtime details from source:

- Concurrency default: `hardwareConcurrency - 2`, clamped 1–16 (`src/workflow.ts`).
- Token budget is a rough estimate (`JSON.stringify(result).length / 4`), not provider usage.
- `model`, `isolation: "worktree"`, and `agentType` on `agent()` options are currently **prompt guidance only** (`buildAgentInstructions`); they are not enforced runtime pins.
- Subagents share the parent cwd and coding tools; they are not Herdr panes and not durable sessions.
- README status: prototype. No persisted/resumable runs and no `/workflows` manager yet.

### Extension points

1. **Script API** — `agent` / `parallel` / `pipeline` / `phase` / `log` / `args` / `budget`.
2. **Tool args** — optional JSON `args` injected as script global.
3. **Library API** — `createWorkflowTool`, `runWorkflow`, `WorkflowAgent`, display helpers exported from `src/index.ts` for programmatic use.
4. **Subagent construction** — `WorkflowAgent` accepts `tools`, `session` (model/auth/resourceLoader overrides), and base `instructions`.
5. **Display** — tool-update stream and optional widget display factories.
6. **Structured output** — JSON Schema on `agent()` for machine handoffs.

Not extension points today: durable state, role discovery, worktree isolation enforcement, model attestation, parent fire-and-forget delivery.

### Strengths for transfer

- **Code-mode orchestration**: parent designs graph as executable JS, not only prose.
- **Deterministic sandbox + literal meta**: keeps scripts auditable and parseable.
- **Fan-out primitives**: `parallel` (thunks, input order) and `pipeline` (per-item stages) are small and clear.
- **Live progress snapshot**: phase-grouped agent status without a full TUI framework.
- **Structured handoff via terminating tool**: avoids an extra prose final turn.
- **Prompt guidelines as product policy**: when to use workflows, unique labels, null-tolerant synthesis, final assertion agent.

### Limits / non-goals (as shipped)

- In-process, blocking parent tool call (not async pane orchestration).
- No crash-safe resume/journal.
- No enforced role/model/worktree isolation despite option fields.
- Failed branches soft-fail to `null` unless aborted.
- No parent-owned Git integration boundary.

## 2. sol-advisor

### What it is

A **Codex plugin / skill**, not a Pi extension. It is an architect-orchestration recipe: primary session stays on **GPT-5.6 Sol / High** and owns requirements, architecture, verification, and acceptance. Implementation is delegated on one of two explicit lanes.

Plugin layout (`plugins/sol-advisor/`):

| Path | Role |
| --- | --- |
| `.codex-plugin/plugin.json` | Plugin manifest v0.4.0; skill root; marketplace UI copy. |
| `skills/orchestration/SKILL.md` | Primary operating procedure. |
| `skills/orchestration/references/role-contracts.md` | Native spawn packets and five-part implementation contract. |
| `skills/orchestration/references/luna-task-lane.md` | Opt-in app-task lane contract. |
| `agents/sol-advisor-terra-implementer.toml` | Native implementer pin: `gpt-5.6-terra` / high. |
| `agents/sol-advisor-sol-reviewer.toml` | Native reviewer pin: `gpt-5.6-sol` / high, `sandbox_mode = "read-only"`. |
| `scripts/install-agents.sh` | Install/check companion TOMLs; exact-byte, non-overwrite, legacy migration. |
| `scripts/inspect-agent-runtime.sh` | Allowlisted local rollout inspector for omitted model/effort. |
| `scripts/verify.sh` | Disposable-dir verifier for contracts, installer, inspector fixtures. |

Marketplace entry: `.agents/plugins/marketplace.json` → local plugin path.

### Architecture (two lanes)

**Default native lane (Codex custom agents / subagent V2):**

1. Preflight companion files with `install-agents.sh --check` (Terra + Sol exact match; retired Luna TOML absent).
2. Confirm spawn tool exposes exact `agent_type`s: `sol_advisor_terra_implementer`, `sol_advisor_sol_reviewer`.
3. Primary writes a complete five-part implementation packet (objective, files/ownership, interfaces, constraints, verification + report schema).
4. Spawn Terra with `fork_turns: none`; no per-spawn model/effort overrides (TOML pins them).
5. Observe role/model/effort from public spawn metadata; local inspector only fills omitted fields; public+local must agree.
6. Primary inspects real diff and reruns verification.
7. Spawn **fresh** Sol reviewer (new context, `fork_turns: none`) for `ship | fix-first | rethink`.
8. Only `ship` allows completion; fix-first re-delegates then re-reviews; rethink revises architecture.

**Explicit opt-in Luna task lane (Codex app tasks, outside native subagent V2):**

1. Requires current-request authorization (“Use the Luna task lane…”). Skill install alone is not enough.
2. Tools: `list_projects` → `create_thread` (`gpt-5.6-luna`, thinking `max`) → discover real `threadId`/`hostId` if only `clientThreadId` returned → `wait_threads` / `read_thread` / `send_message_to_thread`.
3. Complete task packet includes starting state/base, git/PR boundary, structured return.
4. Git projects default to isolated worktree; isolation is not merge safety.
5. Primary owns corrections (same task), PR authorization (`PR AUTHORIZED FOR <threadId>`), dependent-stack ordering, and final acceptance.
6. No native Sol reviewer for this lane; primary Sol reviews the actual worktree/diff.

### Execution / data flow (native, condensed)

```text
user request
  → confirm primary is Sol/High
  → choose lane (native default | Luna only if explicit)
  → native preflight: exact role files + exposed agent_types
  → primary keeps architecture + writes complete packet
  → spawn Terra implementer (fresh thread)
  → observe routing evidence (public, then local inspector)
  → primary re-verifies diff/commands
  → spawn fresh Sol reviewer (read-only requested; observe actual sandbox)
  → verdict ship/fix-first/rethink gates reporting done
```

### Extension points

1. **Skill procedure** — SKILL.md + reference contracts are the product surface.
2. **Role pins** — user-owned TOML custom agents installed separately; plugin update never silently overwrites divergent local roles.
3. **Lane selection** — default native vs explicit Luna app-task path.
4. **Packet schemas** — five-part native implementation report; Luna structured return; review verdict schema.
5. **Runtime attestation helpers** — install check + allowlisted rollout inspector.
6. **Verifier script** — contract/stale-claim guards without mutating real Codex config.

### Strengths for transfer

- **Primary remains architect/acceptor**; workers do not own product decisions.
- **Fail-closed routing**: missing/stale/unobservable role/model/effort stops the lane; no silent fallback.
- **Role pins outside the skill text** (exact-byte companion files) so install and discovery are checkable.
- **Fresh-context final review** with explicit `ship | fix-first | rethink` and re-review after any fix.
- **Complete task packets** so children do not rely on inherited chat history.
- **Ownership + concurrency rules**: non-overlapping parallel; shared-file/dependent serial.
- **Worker report ≠ acceptance**: parent re-runs verification and inspects real diffs.
- **PR/push as primary-authorized boundary** (especially Luna lane).
- **Observed sandbox vs requested sandbox** honesty for reviewers.
- **Explicit opt-in for heavier/user-visible lanes** (Luna) vs default tighter native path.

### Limits / non-goals (as shipped)

- Codex-specific tools and models; not portable to Pi/Herdr without re-hosting.
- Policy is mostly prompt/skill text, not an executable graph runner.
- No durable multi-node scheduler; concurrency is human-procedure based.
- Sol-on-Sol review is context-clean, not cross-model-family independence (README states this).

## 3. Transfer map for pi-herdr-subagents

Local package already owns **agent execution** in Herdr (async `subagent`, panes, worktrees, completion steer, role discovery). ADR-0002 says workflows compose roles and should not become a second skill system or general engine. Draft local spec `agent-adrs/specs/0001-orchestrator-designed-workflows.md` already aims at approved `workflow.md` graphs with evidence receipts — closer to sol-advisor’s control plane than to pure code-mode scripts.

### High-value transfers

| Idea | From | Why it fits herdr-subagents |
| --- | --- | --- |
| Workflow as composition layer above roles | both; ADR-0002 already | Keep `subagent` as execution; add workflow registry/runner only when two surfaces share mechanics. |
| Explicit approval boundary before writers | sol-advisor packets; local draft `workflow.md` | Parent designs graph; user/parent approves before effectful nodes. |
| Complete task packets / structured handoff envelopes | sol-advisor; pi-dynamic structured_output | Child must not depend on parent chat history; return status, evidence, artifacts, runtime, worktree metadata. |
| Parent re-verification + fresh review verdict | sol-advisor | Map to existing `reviewer` / adversarial-review patterns; gate on `ship \| fix-first \| rethink`. |
| Fail-closed model/role policy | sol-advisor | Align with local routing: exact authenticated provider/model refs; no silent substitute. |
| Parallel writers only with distinct worktrees + non-overlapping ownership | sol-advisor Luna/native; herdr worktree docs | Already supported by `worktree: { branch, base }`; workflow runner should enforce it. |
| Integration/PR/cleanup reserved for parent | sol-advisor; herdr worktree research | Worker commits/reports; parent integrates. |
| Live progress snapshot | pi-dynamic-workflows display | Optional overlay on runner state; do not block on in-process tool completion. |
| Concurrency + budget hard limits | pi-dynamic limiter/budget; sol-advisor limits language | Encode as workflow document limits, not soft prose. |

### Borrow carefully / adapt, do not copy wholesale

| Idea | Risk if copied raw into herdr-subagents |
| --- | --- |
| Parent-written JS `vm` workflow scripts (pi-dynamic) | Powerful but fights current “approved workflow.md / no recursive child graphs” draft. Prefer declarative approved graph first; optional code-mode later. |
| Blocking in-memory subagent sessions (pi-dynamic) | Contradicts herdr’s non-blocking pane model and completion-steer delivery. Reuse `subagent` launch/watch instead of `SessionManager.inMemory`. |
| Soft-fail agents to `null` (pi-dynamic) | Hides failures; sol-advisor/local draft prefer explicit node failure and evidence gaps. |
| Exact Codex TOML role pins + rollout inspector | Concept (attestation) transfers; implementation must use Pi/Herdr session metadata and agent frontmatter/config, not Codex scripts. |
| Sol/Terra/Luna model family as product identity | Do not hardcode vendor lanes. Express as configurable role→runtime policy. |
| Skill-only orchestration (sol-advisor) | Good for procedure docs (`/plan`-style), weak for multi-node state, cancellation, and one final receipt. |

### Concrete recommended shape (synthesis)

1. **Keep execution in `subagent`** (roles, worktrees, model resolution, completion).
2. **Add workflow as parent-owned composition**: validated document or registry entry with nodes, deps, ownership, limits, verification/review policy — not another agent prompt pretending to be a product surface.
3. **From sol-advisor**: architect-in-parent, complete packets, fail-closed routing, fresh review verdict, PR/integration authorization, serial dependent stacks.
4. **From pi-dynamic-workflows**: phase-aware progress snapshot, optional structured terminating handoff, small fan-out helpers *inside the runner* (not necessarily user-authored JS), strict “when to use workflow” guidelines.
5. **Defer**: durable Temporal-like engine, child-authored recursive graphs, silent model fallback, auto-merge, full code-mode sandbox unless a second consumer needs the same mechanics (ADR-0002 phase 3).

### Non-transfers

- Replacing Herdr panes with in-memory Pi sessions.
- Baking GPT-5.6 Sol/Terra/Luna names into package defaults as identity.
- Growing `agents/` with more outcome-orchestration prompts (ADR-0002 explicitly rejects cloning `adversarial-reviewer` as the pattern).
- Auto-activating a heavy lane merely because a skill/package is installed (sol-advisor Luna rule is the cautionary example).

## 4. Side-by-side summary

> Historical research baseline table only. The `herdr-subagents` column records the pinned 2026-08-03 research baseline and is not current package status.

| Dimension | pi-dynamic-workflows | sol-advisor | herdr-subagents at research baseline |
| --- | --- | --- | --- |
| Host | Pi tool/extension | Codex plugin + skill + custom agents | Pi extension inside Herdr |
| Orchestration medium | Deterministic JS script in vm | Skill procedure + spawn/app tools | Parent prompts + `subagent` tool + a few commands (`/plan`, `/iterate`, `/btw`) |
| Child runtime | In-memory Pi session | Codex native thread or app task | Herdr pane/session (Pi or CLI adapter) |
| Isolation | Shared cwd; worktree option not enforced | Worktree default on Luna Git projects; ownership rules | Optional managed worktrees |
| Model policy | Guidance strings | Exact TOML pins + attestation | Invocation → agent → config → parent chain |
| Acceptance | Parent tool result JSON | Parent re-verify + fresh Sol verdict | Completion steer; no first-class workflow receipt |
| Durability | None | Thread/task identity in Codex | Session files + worktree metadata; no workflow graph state |
| Status | Prototype v1.0.1 | Plugin 0.4.0 with installer/verifier | Mature execution package; workflow feature was still at the taxonomy/spec stage |

## 5. Bottom line

- **pi-dynamic-workflows** is a compact **code-mode fan-out engine** for Pi: script → sandbox → many short in-memory agents → one tool result. Best borrowed pieces: progress snapshots, structured handoffs, and tight fan-out primitives — not its blocking in-memory runtime.
- **sol-advisor** is a **control-plane recipe** for architect/implement/review with fail-closed routing and evidence-based acceptance. Best borrowed pieces: complete packets, primary-owned verification, fresh review verdicts, explicit lane opt-in, and integration authorization.
- For **pi-herdr-subagents**, the high-leverage path is sol-advisor-style control + herdr execution + optional pi-dynamic presentation/helpers, matching the local draft “approved workflow document → runner → evidence receipt” direction rather than cloning either repo wholesale.
