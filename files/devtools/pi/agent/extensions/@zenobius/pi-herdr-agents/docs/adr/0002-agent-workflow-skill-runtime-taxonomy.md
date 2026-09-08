# ADR-0002: Adopt the agent, workflow, skill, and runtime taxonomy

- **Status:** Accepted in part; external CLI provisions superseded
- **Date:** 2026-08-02
- **Decision owners:** `acrnm`
- **Scope:** `giuseppecrj/pi-herdr-agents`
- **Historical tracking:** legacy issues #4 and #5 (not carried into the clean repository)
- **Superseded in part by:** ADR-0008 removes the external CLI runtime adapter

## Decision

Keep `pi-herdr-agents` small: it owns **agent execution**, not a second
skill system or a general workflow engine.

Use these terms consistently:

- **Agent role** — A reusable child-agent responsibility with an operating
  prompt and capability limits. Owned by this package or a project override;
  sometimes user-facing through `/subagent`.
- **Workflow** — A named recipe that composes roles, order, artifacts, and
  runtime policy to achieve an outcome. Owned by the parent/orchestrator and
  user-facing.
- **Skill** — A Pi-native instruction set that teaches the current agent a
  reusable procedure. It may invoke workflows or roles. Owned by Pi or the
  skill author and user-facing.
- **Runtime** — The authenticated Pi provider/model and thinking selection for
  one invocation. Owned by invocation/configuration and not user-facing.

An agent role is **not** a workflow merely because it can spawn other agents.
A coordinator role is allowed when it owns an interactive or multi-stage child
session. A workflow is the user-intent layer above it.

## Why this is needed

The package has a sound execution model but exposes mixed concepts on the same
surface:

- Agent definitions are discovered from package, global, and project folders,
  with project definitions overriding global and bundled definitions.
- The bundled list includes reusable roles (`scout`, `worker`, `reviewer`) and
  a multi-stage orchestration (`adversarial-reviewer`). Every definition runs
  through Pi.
- The extension can request Pi skills, select model defaults, and start
  sessions, but it has no first-class workflow definition or agent-definition
  schema validation.

That makes `/subagent list` technically accurate but semantically unclear: it
is a list of executable definitions, not a list of comparable user tasks.

## Standard

### 1. Agent roles have one responsibility

An agent definition answers: **what responsibility can this child take on,
and under which constraints?** It must not promise a broad product outcome.

A bundled role should have:

- a stable, verb-first or noun-role name (`scout`, `reviewer`, `worker`);
- a description stating its input and output, not its implementation;
- the minimum tools and skills needed for that responsibility;
- explicit `spawning`, `auto-exit`, and interaction behavior when it matters;
- a report or handoff contract in its body; and
- no user-specific model ID unless the role cannot function without that
  runtime.

Use an agent role directly when a caller has already chosen the task and needs
one bounded child responsibility. Examples: inspect a module, review a diff,
or implement a specified change.

`planner` is a coordinator role: it may delegate factual gaps because that is
part of planning. `reviewer`, `scout`, and `worker` are leaf roles and should
keep `spawning: false`.

### 2. Workflows own user intent and composition

A workflow answers: **what result does the user want, and which roles run in
what order to produce it?** It owns:

- entry-point name and user-facing description;
- required context and optional inputs;
- role selection, sequence, and fan-out;
- artifact locations and aggregation;
- runtime-selection policy; and
- completion and verification criteria.

The package already exposes these workflow surfaces:

- **Planning** — `/plan`, a user-facing command backed by `plan-skill.md` that
  coordinates scout, interactive planner, workers, and reviewer.
- **Iteration** — `/iterate`, a user-facing command that forks the current
  session for focused work.
- **Side question** — `/btw` and `/btw-close`, user-facing commands that manage
  an ephemeral interactive side session.
- **Adversarial review** — `adversarial-reviewer`, a user-facing orchestration
  agent that is incorrectly presented as an agent rather than a workflow.
- **Approved review runner** — `herdr_workflow`, a low-level control tool for
  exact approved project-local JavaScript. It is an execution surface, not the
  user-facing workflow recipe.
- **Orchestrated review authoring** — bundled native `/skill:orchestrate`, which
  teaches the parent to author and approve the first-flow review workflow.

An orchestration agent remains a compatibility implementation detail—not a
general pattern for new roles. Do not add more user-outcome orchestration
prompts to `agents/` just because `subagent` is an available launcher.

The next user-facing review surface should be a workflow named for the outcome,
not a child implementation:

- **Review** — one or more evidence-backed review passes against a supplied
  base/ref and rubric.
- **Adversarial review** — independent multi-runtime passes followed by
  verification of proposed findings.

Whether these become commands, Pi skills, or a parent prompt is a separate UX
decision. The workflow contract should be settled before adding a new command.

### 3. Skills remain outside this package's taxonomy

A skill teaches the current Pi agent how to act. It is not an agent definition,
even if it causes `subagent` calls. This package should:

- accept the existing `skills` agent field as a dependency declaration;
- document required skill names and prerequisites; and
- not discover, install, version, or duplicate Pi skills.

A package-owned `plan-skill.md` should be described as the instruction backing
the package's `/plan` workflow, not as a second kind of subagent definition.

### 4. Runtimes are selected by policy, not role identity

A role describes the work; a runtime describes which authenticated Pi
provider/model and thinking level one invocation uses. The model-resolution
chain is explicit invocation choice, agent default, per-agent configuration,
global configuration, then the parent model. Inheritance is the resolver fallback,
not the orchestrator default; independent review requires a different
provider/family than the model that produced the work.

Apply these rules:

1. Prefer per-invocation `model` and `thinking` for a workflow's deliberate
   diversity or cost/quality policy.
2. Use ignored local `config.json` for a person's durable role preferences.
3. Leave bundled role `model` unset unless a particular model is a functional
   prerequisite.
4. State runtime prerequisites before launch and fail closed when a required
   Pi runtime is unavailable.
5. Reject legacy role definitions that contain `cli` before Herdr resource
   creation; do not reinterpret them as Pi roles.

This preserves the useful multi-model review behavior without baking a
particular vendor choice into the generic `reviewer` role. Adversarial review
first applies project review constraints, then selects three distinct eligible
exact authenticated Pi model IDs, prefers provider diversity, and launches
generic `reviewer` children followed by fresh reviewer synthesis.

### 5. Subagent execution is Pi-only

Every visible or hidden role executes through Pi. Claude models remain available
through normal Pi provider/model routing. A legacy role that contains `cli`
receives a migration diagnostic and cannot create a Herdr pane or worktree.
There is no runtime adapter registry or compatibility path.

### 6. Agent frontmatter is a constrained contract

The package should document and validate the frontmatter it consumes. Do not
silently add fields that are neither parsed nor documented. In particular,
standardize on `skills` (plural); compatibility support for `skill` can remain
until a documented deprecation date.

The current parser is permissive: unsupported or unknown frontmatter may be
ignored instead of rejected. The README therefore provides a complete template,
a checklist, and a list/launch smoke-test procedure rather than promising schema
validation that does not exist yet.

For a future validation pass, require at least `name` and `description`, reject
unknown package-owned fields, validate tool/skill list syntax, and report the
source path in errors. The authoring template must cover the complete existing
README frontmatter reference (`tools`, `deny-tools`, `thinking`, `system-prompt`, `spawning`, `auto-exit`,
`interactive`, `session-mode`, `cwd`, and `disable-model-invocation`) rather
than introduce a partial second schema. Keep extension fields separate from arbitrary prompt metadata so
project authors can still add their own namespaced fields.

## Current mapping

- `scout` — Leaf agent role. Keep.
- `worker` — Leaf agent role. Keep.
- `reviewer` — Leaf agent role. Keep as the model-neutral review pass.
- `planner` — Coordinator agent role. Keep; `/plan` remains the workflow that
  invokes it.
- `poteto` — Coordinator agent role. Keep only if its distinct autonomous
  engineering responsibility remains intentional.
- `visual-tester` — Leaf agent role with skill prerequisite. Keep its
  `chrome-cdp` dependency declared through canonical `skills` metadata.
- `claude-reviewer` — Removed. Use the generic `reviewer` role with an
  authenticated Claude model through Pi provider/model routing.
- `adversarial-reviewer` — Transitional workflow implementation. It applies
  project review constraints, selects three distinct eligible exact
  authenticated Pi model IDs, and launches generic `reviewer` children followed
  by fresh reviewer synthesis. Do not clone this pattern for new outcomes;
  migrate its user contract to an adversarial-review workflow.
- `plan-skill.md` — Planning workflow instruction. Document by workflow purpose,
  not agent type.
- `skills/orchestrate/SKILL.md` — Bundled native authoring skill for the first
  review workflow; exposed with the package through Pi skills metadata.

## Small migration plan

Phases 1 and 2 are implemented in the current package. Phase 3 remains
conditional on repeated registry needs; the low-level `herdr_workflow` runner is
not a general workflow registry.

### Phase 1 — establish the contract (documentation only)

1. Adopt this vocabulary in the README and agent-authoring reference.
2. Add a short agent-authoring template and a checklist for role authors.
3. Audit bundled frontmatter for undocumented or unconsumed keys, including
   `scout`'s `output` metadata and `visual-tester`'s compatibility `skill` key.
4. Document every current workflow—planning, iteration, side questions, and
   adversarial review—with its roles, artifacts, prerequisites, and runtime
   policy in one place. Adversarial review applies project constraints, selects
   three distinct eligible exact authenticated Pi model IDs, prefers provider
   diversity, and uses generic `reviewer` children with fresh synthesis.
5. Remove bundled `claude-reviewer`; callers use the generic `reviewer` role
   with Pi provider/model routing.

### Phase 2 — improve discovery without a new framework

1. Make `subagents_list` show the source for every visible definition.
2. Keep `/subagent` focused on directly runnable roles; describe workflows in
   the command/skill documentation that owns them.

### Phase 3 — add a workflow registry only when two surfaces need the same mechanics

If `/plan` and adversarial review need the same registration, discovery, and
artifact mechanics, add the smallest explicit workflow registry. It should
compose existing roles and call `subagent`; it must not reimplement session,
worktree, model-resolution, or completion lifecycle logic.

Do not add a workflow engine, durable scheduler, or another configuration
language before that repeated need exists.

## Acceptance criteria

- A user can distinguish a workflow from a directly runnable role before
  launching either.
- Legacy external CLI roles fail with a migration diagnostic before launch.
- A role author can create and smoke-test a valid definition from one documented
  template; schema-level frontmatter errors remain a deferred validation pass.
- A workflow can select different authenticated runtimes per child without
  changing generic role definitions.
- Existing project/global override precedence and runtime-resolution behavior
  remain unchanged.
- No behavior is added to the package solely to duplicate Pi's skill system.

## Evidence

This decision is based on the current implementation:

- `pi-extension/subagents/index.ts` parses and discovers agent definitions in
  package → global → project load order (later definitions win), so effective
  priority is project > global > package; it also launches child sessions.
- `pi-extension/subagents/model-config.ts` provides per-agent and global model
  defaults; launch-time arguments remain the appropriate workflow override.
- `README.md` documents `/plan`, `/iterate`, `/btw`, agent discovery,
  frontmatter, and runtime precedence.
- `agents/` contains the role/coordinator set mapped above.
