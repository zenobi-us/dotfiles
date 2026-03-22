# @davidorex/pi-behavior-monitors

> Behavior monitors for pi that watch agent activity and steer corrections

## Tools

### monitors-status

List all behavior monitors with their current state.

*List all behavior monitors with their current state*

### monitors-inspect

Inspect a monitor — config, state, pattern count, rule count.

*Inspect a monitor — config, state, pattern count, rule count*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `monitor` | string | yes | Monitor name |

### monitors-control

Control monitors — enable, disable, dismiss, or reset.

*Control monitors — enable, disable, dismiss, or reset*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | unknown | yes |  |
| `monitor` | string | no | Monitor name (required for dismiss/reset) |

### monitors-rules

Manage monitor rules — list, add, remove, or replace calibration rules.

*Manage monitor rules — list, add, remove, or replace calibration rules*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `monitor` | string | yes | Monitor name |
| `action` | unknown | yes |  |
| `text` | string | no | Rule text (for add/replace) |
| `index` | number | no | Rule index, 1-based (for remove/replace) |

### monitors-patterns

List patterns for a behavior monitor.

*List patterns for a behavior monitor*

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `monitor` | string | yes | Monitor name |

## Commands

### /monitors

Manage behavior monitors

Subcommands: `on`, `off`, `fragility`, `response-style`

## Events

- `session_start`
- `session_switch`
- `agent_end`
- `turn_start`
- `message_end`

## Bundled Resources

### schemas/ (2 files)

- `schemas/monitor-pattern.schema.json`
- `schemas/monitor.schema.json`

### examples/ (16 files)

- `examples/commit-hygiene/classify.md`
- `examples/commit-hygiene.instructions.json`
- `examples/commit-hygiene.monitor.json`
- `examples/commit-hygiene.patterns.json`
- `examples/fragility/classify.md`
- `examples/fragility.instructions.json`
- `examples/fragility.monitor.json`
- `examples/fragility.patterns.json`
- `examples/hedge/classify.md`
- `examples/hedge.instructions.json`
- `examples/hedge.monitor.json`
- `examples/hedge.patterns.json`
- `examples/work-quality/classify.md`
- `examples/work-quality.instructions.json`
- `examples/work-quality.monitor.json`
- `examples/work-quality.patterns.json`

## Monitor Vocabulary

### Context Collectors

| Collector | Placeholder | Description | Limits |
|-----------|-------------|-------------|--------|
| `user_text` | `{user_text}` / `{{ user_text }}` | Most recent user message text | — |
| `assistant_text` | `{assistant_text}` / `{{ assistant_text }}` | Most recent assistant message text | — |
| `tool_results` | `{tool_results}` / `{{ tool_results }}` | Tool results with tool name and error status | Last 5, truncated 2000 chars |
| `tool_calls` | `{tool_calls}` / `{{ tool_calls }}` | Tool calls and results interleaved | Last 20, truncated 2000 chars |
| `custom_messages` | `{custom_messages}` / `{{ custom_messages }}` | Custom extension messages since last user message | — |
| `project_vision` | `{project_vision}` / `{{ project_vision }}` | .project/project.json vision, core_value, name | — |
| `project_conventions` | `{project_conventions}` / `{{ project_conventions }}` | .project/conformance-reference.json principle names | — |
| `git_status` | `{git_status}` / `{{ git_status }}` | Output of git status --porcelain | 5s timeout |

Any string is accepted in `classify.context`. Unknown collector names produce empty string (graceful degradation).

Built-in placeholders (always available, not listed in `classify.context`):
- `{patterns}` / `{{ patterns }}` — formatted from patterns JSON as numbered list: `1. [severity] description`
- `{instructions}` / `{{ instructions }}` — formatted from instructions JSON as bulleted list with "Operating instructions from the user (follow these strictly):" preamble — empty string if no instructions
- `{iteration}` / `{{ iteration }}` — current consecutive steer count (0-indexed)

### When Conditions

- `always` — Fire every time the event occurs
- `has_tool_results` — Fire only if tool results present since last user message
- `has_file_writes` — Fire only if write or edit tool called since last user message
- `has_bash` — Fire only if bash tool called since last user message
- `every(N)` — Fire every Nth activation (counter resets when user text changes)
- `tool(name)` — Fire only if specific named tool called since last user message

### Events

`message_end`, `turn_end`, `agent_end`, `command`

### Verdict Types

`clean`, `flag`, `new`

### Scope Targets

`main`, `subagent`, `all`, `workflow`

---

---
name: pi-behavior-monitors
description: >
  Behavior monitors that watch agent activity and steer corrections when issues are detected.
  Monitors are JSON files (.monitor.json) in .pi/monitors/ with classify, patterns, actions,
  and scope blocks. Patterns and instructions are JSON arrays. Use when creating, editing,
  debugging, or understanding behavior monitors.
---

<objective>
Monitors are autonomous watchdogs that observe agent activity, classify it against a
JSON pattern library using a side-channel LLM call, and either steer corrections or
write structured findings to JSON files for downstream consumption.
</objective>

<monitor_locations>
Monitors are discovered from two locations, checked in order:

1. **Project**: `.pi/monitors/*.monitor.json` (walks up from cwd to find `.pi/`)
2. **Global**: `~/.pi/agent/monitors/*.monitor.json` (via `getAgentDir()`)

Project monitors take precedence — if a project monitor has the same `name` as a global
one, the global monitor is ignored. The extension silently exits if zero monitors are
discovered after checking both locations.
</monitor_locations>

<seeding>
On first run in a project, the extension seeds bundled example monitors into
`.pi/monitors/` if ALL of the following are true:

- `discoverMonitors()` finds zero monitors (neither project nor global)
- The `examples/` directory exists in the extension package
- The target `.pi/monitors/` directory contains no `.monitor.json` files

Seeding copies all `.json` files from `examples/` (monitor definitions, patterns, and
instructions files) into `.pi/monitors/`. It skips files that already exist at the
destination. The user is notified: "Edit or delete them to customize."

To customize seeded monitors, edit the copies in `.pi/monitors/` directly. To remove a
bundled monitor, delete its three files (`.monitor.json`, `.patterns.json`,
`.instructions.json`). Seeding never re-runs once any monitors exist.
</seeding>

<file_structure>
Each monitor is a set of files sharing a name prefix:

```
.pi/monitors/
├── fragility.monitor.json       # Monitor definition (classify + patterns + actions + scope)
├── fragility.patterns.json      # Known patterns (JSON array, grows automatically)
├── fragility.instructions.json  # User corrections (JSON array, optional)
├── fragility/
│   └── classify.md              # Nunjucks template for classification prompt (optional)
```

The instructions file is optional. If omitted, the extension defaults the path to
`${name}.instructions.json` and treats a missing file as an empty array.

The classify template is optional. When `classify.promptTemplate` is set in the monitor
definition, the template is resolved through a three-tier search: `.pi/monitors/` (project),
`~/.pi/agent/monitors/` (user), then the package `examples/` directory. A user overrides a
bundled template by placing a file at the same relative path in `.pi/monitors/`.
</file_structure>

<monitor_definition>
A `.monitor.json` file conforms to `schemas/monitor.schema.json`:

```json
{
  "name": "my-monitor",
  "description": "What this monitor watches for",
  "event": "message_end",
  "when": "has_tool_results",
  "scope": {
    "target": "main",
    "filter": { "agent_type": ["audit-fixer"] }
  },
  "classify": {
    "model": "claude-sonnet-4-20250514",
    "context": ["tool_results", "assistant_text"],
    "excludes": ["other-monitor"],
    "promptTemplate": "my-monitor/classify.md",
    "prompt": "Inline fallback if template not found. {tool_results} {assistant_text} {patterns} {instructions}\n\nReply CLEAN, FLAG:<desc>, or NEW:<pattern>|<desc>."
  },
  "patterns": {
    "path": "my-monitor.patterns.json",
    "learn": true
  },
  "instructions": {
    "path": "my-monitor.instructions.json"
  },
  "actions": {
    "on_flag": {
      "steer": "Fix the issue.",
      "write": {
        "path": ".workflow/gaps.json",
        "merge": "append",
        "array_field": "gaps",
        "template": {
          "id": "monitor-{finding_id}",
          "description": "{description}",
          "status": "open",
          "category": "monitor",
          "source": "monitor"
        }
      }
    },
    "on_new": {
      "steer": "Fix the issue.",
      "learn_pattern": true,
      "write": { "...": "same as on_flag" }
    },
    "on_clean": null
  },
  "ceiling": 5,
  "escalate": "ask"
}
```
</monitor_definition>

<fields>

**Top-level fields:**

| Field | Default | Description |
|-------|---------|-------------|
| `name` | (required) | Monitor identifier. Must be unique across project and global. |
| `description` | `""` | Human-readable description. Also used as command description for `event: command` monitors. |
| `event` | `message_end` | When to fire: `message_end`, `turn_end`, `agent_end`, or `command`. |
| `when` | `always` | Activation condition (see below). |
| `ceiling` | `5` | Max consecutive steers before escalation. |
| `escalate` | `ask` | At ceiling: `ask` (confirm with user) or `dismiss` (silence for session). |

**Scope block:**

| Field | Default | Description |
|-------|---------|-------------|
| `scope.target` | `main` | What to observe: `main`, `subagent`, `all`, `workflow`. |
| `scope.filter.agent_type` | — | Only monitor agents with these names. |
| `scope.filter.step_name` | — | Glob pattern for workflow step names. |
| `scope.filter.workflow` | — | Glob pattern for workflow names. |

Steering (injecting messages into the conversation) only fires for `main` scope.
Non-main scopes can still write findings to JSON files.

**Classify block:**

| Field | Default | Description |
|-------|---------|-------------|
| `classify.model` | `claude-sonnet-4-20250514` | Model for classification. Plain model ID uses `anthropic` provider. Use `provider/model` for other providers. |
| `classify.context` | `["tool_results", "assistant_text"]` | Context collector names. Any string accepted — unknown collectors produce empty string. |
| `classify.excludes` | `[]` | Monitor names — skip activation if any of these already steered this turn. |
| `classify.promptTemplate` | — | Path to `.md` Nunjucks template file. Searched in `.pi/monitors/`, `~/.pi/agent/monitors/`, then package `examples/`. Takes precedence over `prompt`. |
| `classify.prompt` | — | Inline classification prompt with `{placeholder}` substitution. Used when `promptTemplate` is absent. One of `promptTemplate` or `prompt` is required. |

**Actions block** — per verdict (`on_flag`, `on_new`, `on_clean`):

| Field | Description |
|-------|-------------|
| `steer` | Message to inject into conversation. `null` = no steering. Only effective for `scope.target: "main"`. |
| `write.path` | JSON file to write findings to. Relative paths resolve from `process.cwd()`, not from the monitor directory. |
| `write.merge` | `append` (add to array) or `upsert` (update by matching `id` field). |
| `write.array_field` | Which field in target JSON holds the array (e.g. `"gaps"`, `"findings"`). |
| `write.template` | Template mapping with `{finding_id}`, `{description}`, `{severity}`, `{monitor_name}`, `{timestamp}`. |
| `write.schema` | Optional schema path for documentation. Not enforced at runtime. |
| `learn_pattern` | If true, add new pattern to patterns file on `new` verdict. |

`on_clean` can be configured with a `write` action to log clean verdicts. Setting it to
`null` means no action on clean (the default behavior).
</fields>

<!-- when_conditions and context_collectors tables are generated from code registries — see Monitor Vocabulary section in SKILL.md -->

<patterns_file>
JSON array conforming to `schemas/monitor-pattern.schema.json`:

```json
[
  {
    "id": "empty-catch",
    "description": "Silently catching exceptions with empty catch blocks",
    "severity": "error",
    "category": "error-handling",
    "examples": ["try { ... } catch {}"],
    "source": "bundled"
  },
  {
    "id": "learned-pattern-abc",
    "description": "Learned pattern from runtime detection",
    "severity": "warning",
    "source": "learned",
    "learned_at": "2026-03-15T02:30:00.000Z"
  }
]
```

| Field | Required | Description |
|-------|----------|-------------|
| `id` | yes | Stable identifier for dedup. Auto-generated for learned patterns: lowercased, non-alphanumeric replaced with hyphens, truncated to 60 chars. |
| `description` | yes | What this pattern detects. Used for dedup (exact match) when learning. |
| `severity` | no | `"error"`, `"warning"`, or `"info"`. Defaults to `"warning"` in prompt formatting. |
| `category` | no | Grouping key (e.g. `"error-handling"`, `"avoidance"`, `"deferral"`). |
| `examples` | no | Example manifestations. Stored but not surfaced in classification prompts. |
| `source` | no | `"bundled"`, `"learned"`, or `"user"`. Learned patterns are tagged `"learned"`. |
| `learned_at` | no | ISO timestamp for learned patterns. |

Patterns grow automatically when `learn_pattern: true` and a `NEW:` verdict is returned.
Dedup is by exact `description` match — duplicates are silently skipped.

**Critical**: If the patterns array is empty (file missing, empty array, or unparseable),
classification is skipped entirely for that activation. A monitor with no patterns does nothing.
</patterns_file>

<instructions_file>
JSON array of user rules (called "instructions" on disk, "rules" in the command surface):

```json
[
  { "text": "grep exit code 1 is not an error", "added_at": "2026-03-15T02:30:00.000Z" },
  { "text": "catch-and-log in event handlers is correct for non-critical extensions", "added_at": "2026-03-15T03:00:00.000Z" }
]
```

Manage via `/monitors <name> rules` (list), `/monitors <name> rules add <text>` (add),
`/monitors <name> rules remove <n>` (remove by number), `/monitors <name> rules replace <n> <text>`
(replace by number). The LLM can also edit the `.instructions.json` file directly.

Rules are injected into the classification prompt under a preamble
"Operating instructions from the user (follow these strictly):" — only if the array is
non-empty. An empty array or missing file produces no rules block in the prompt.
</instructions_file>

<prompt_templates>
Monitors support two prompt rendering modes:

**Inline prompts** (`classify.prompt`) — simple `{placeholder}` string replacement. Good for
single-paragraph classifiers. All context collectors and built-in placeholders are available
as `{name}`.

**Nunjucks templates** (`classify.promptTemplate`) — `.md` files with full Nunjucks syntax:
conditionals (`{% if %}`), loops (`{% for %}`), template inheritance, filters. Used when
the classify prompt needs conditional sections (e.g., iteration-aware acknowledgment).

Template variables use `{{ name }}` syntax. All context collectors and built-in placeholders
are available: `{{ patterns }}`, `{{ instructions }}`, `{{ iteration }}`, plus any collectors
listed in `classify.context`.

When both `promptTemplate` and `prompt` are set, the template is tried first. If the template
file is not found or fails to render, the inline prompt is used as fallback.

**Iteration-aware acknowledgment pattern** — templates should include this block to support
monitor-agent dialogue (the agent acknowledging a steer and stating a plan):

```markdown
{% if iteration > 0 %}
NOTE: You have steered {{ iteration }} time(s) already this session.
The agent's latest response is below. If the agent explicitly acknowledged
the issue and stated a concrete plan to address it (not just "noted" but
a specific action), reply CLEAN to allow the agent to follow through.
Re-flag only if the agent ignored or deflected the steer.

Agent response:
{{ assistant_text }}
{% endif %}
```

This requires `assistant_text` in the `classify.context` array. When the classifier sees
genuine acknowledgment, it replies CLEAN, which resets `whileCount` to 0 and gives the agent
a fresh turn without re-flagging.

**Template search order** (first match wins):
1. `.pi/monitors/<template-path>` — project-level override
2. `~/.pi/agent/monitors/<template-path>` — user-level
3. Package `examples/<template-path>` — builtin

All four bundled monitors ship with Nunjucks templates in `examples/<name>/classify.md`.
</prompt_templates>

<verdict_format>
The classification LLM must respond with one of:

- `CLEAN` — no issue detected. Resets consecutive steer counter to 0.
- `FLAG:<description>` — known pattern matched. Triggers `on_flag` action.
- `NEW:<pattern>|<description>` — novel issue. The text before `|` becomes the learned pattern description; the text after `|` becomes the finding description. If no `|` is present, the full text after `NEW:` is used for both. Triggers `on_new` action.

Any response that does not start with `CLEAN`, `FLAG:`, or `NEW:` is treated as `CLEAN`.

Classification calls use `maxTokens: 150`.
</verdict_format>

<runtime_behavior>

**Dedup**: A monitor will not re-classify the same user text. Once a user message has been
classified, the monitor skips until the user text changes. This prevents redundant
side-channel LLM calls within the same user turn.

**Ceiling and escalation**: After `ceiling` consecutive steers (flag/new verdicts without
an intervening clean), the monitor escalates. With `escalate: "ask"`, the user is prompted
to continue or dismiss. With `escalate: "dismiss"`, the monitor is silently dismissed for
the session. A `CLEAN` verdict resets the consecutive steer counter.

**Turn exclusion**: The `excludes` array prevents double-steering. If monitor A steers in
a turn, and monitor B has `"excludes": ["A"]`, monitor B skips that turn. Exclusion tracking
resets at `turn_start`.

**Buffered steer delivery**: Monitors on `message_end` or `turn_end` buffer their steer
messages and deliver them at `agent_end`. This is because pi's async event queue processes
extension handlers after the agent loop has already checked for steering messages. The
buffer is drained at `agent_end` — only the first buffered steer fires per agent run; the
corrected response re-triggers monitors naturally for any remaining issues. Monitors on
`agent_end` or `command` events deliver steers immediately (they already run post-loop).

**Abort**: Classification calls are aborted when the agent ends (via `agent_end` event).
Aborted classifications produce no verdict and no action.

**Write action**: Relative `write.path` values resolve from `process.cwd()`, not from the
monitor directory. Parent directories are created automatically. If the target file doesn't
exist or is unparseable, a fresh object is created. The `upsert` merge strategy matches on
the `id` field of array entries.
</runtime_behavior>

<commands>
All monitor management is through the `/monitors` command. Subcommands are
discoverable via pi's TUI autocomplete — typing `/monitors ` shows available
monitor names and global commands; selecting a monitor shows its verbs.

| Command | Description |
|---------|-------------|
| `/monitors` | List all monitors with global on/off state and per-monitor status |
| `/monitors on` | Enable all monitoring (session default) |
| `/monitors off` | Pause all monitoring for this session |
| `/monitors <name>` | Inspect a monitor: description, event, state, rule count, pattern count |
| `/monitors <name> rules` | List current rules (numbered) |
| `/monitors <name> rules add <text>` | Add a rule to calibrate the classifier |
| `/monitors <name> rules remove <n>` | Remove a rule by number |
| `/monitors <name> rules replace <n> <text>` | Replace a rule by number |
| `/monitors <name> patterns` | List current patterns (numbered, with severity and source) |
| `/monitors <name> dismiss` | Dismiss a monitor for this session |
| `/monitors <name> reset` | Reset a monitor's state and un-dismiss it |

Monitors with `event: "command"` also register `/<name>` as a programmatic trigger
for other extensions or workflows to invoke classification directly.
</commands>

<bundled_monitors>
Four example monitors ship in `examples/` and are seeded on first run. Each has a
Nunjucks classify template in `examples/<name>/classify.md` with iteration-aware
acknowledgment support:

**fragility** (`message_end`, `when: has_tool_results`)
Watches for unaddressed fragilities after tool use — errors, warnings, or broken state the
agent noticed but chose not to fix. Steers with "Fix the issue you left behind." Writes
findings to `.workflow/gaps.json` under `category: "fragility"`. Excludes: none. Ceiling: 5.
12 bundled patterns across categories: avoidance (dismiss-preexisting, not-my-change,
blame-environment, workaround-over-root-cause, elaborate-workaround-for-fixable),
error-handling (empty-catch, happy-path-only, early-return-on-unexpected,
undocumented-delegation, silent-fallback), deferral (todo-instead-of-fix,
prose-without-action).

**hedge** (`turn_end`, `when: always`)
Detects when the assistant deviates from what the user actually said — substituting
questions, projecting intent, or deflecting instead of answering. Steers with "Address
what the user actually said." Does not write to files (steer-only). Excludes: `["fragility"]`
(skips if fragility already steered this turn). Ceiling: 3.
8 bundled patterns across categories: substitution (rephrase-question, reinterpret-words),
projection (assume-intent, attribute-position), augmentation (add-questions),
deflection (ask-permission, qualify-yesno, counter-question).

**work-quality** (`command`, `when: always`)
On-demand work quality analysis invoked via `/work-quality`. Analyzes user request, tool
calls, and assistant response for quality issues. Writes findings to `.workflow/gaps.json`
under `category: "work-quality"`. Ceiling: 3.
11 bundled patterns across categories: methodology (trial-and-error, symptom-fix,
double-edit, edit-without-read, insanity-retry, no-plan), verification (no-verify),
scope (excessive-changes, wrong-problem), quality (copy-paste), cleanup (debug-artifacts).

**commit-hygiene** (`agent_end`, `when: has_file_writes`)
Fires when the agent finishes a turn that included file writes. Checks tool call history
for git commit commands. If no commit occurred, steers to commit. If committed with a
generic or certainty-language message, steers to improve. Does not write findings — commits
are their own artifact. Ceiling: 3.
6 bundled patterns across categories: missing-commit (no-commit), message-quality
(generic-message, certainty-language, no-context), commit-safety (amend-not-new, force-push).
</bundled_monitors>

<disabling_monitors>
**Session-level** (temporary):
- `/monitors off` — pauses all monitoring for the current session
- `/monitors <name> dismiss` — silences a single monitor for the session
- `/monitors <name> reset` — un-dismisses and resets a monitor's state

**Permanent**:
- Delete its `.monitor.json` file (and optionally its `.patterns.json` and `.instructions.json`)
- Or empty its patterns array — a monitor with zero patterns skips classification entirely
- To disable all monitoring: remove all `.monitor.json` files from `.pi/monitors/` and
  `~/.pi/agent/monitors/`. The extension exits silently when zero monitors are discovered.

Monitors also auto-silence at their ceiling. With `escalate: "ask"`, the user is prompted
to continue or dismiss. With `escalate: "dismiss"`, the monitor silences automatically.
</disabling_monitors>

<creating_monitors>
When the user asks to create a monitor — either from a described behavior ("flag responses
that end with questions") or from a discovered need during conversation ("that response
did X wrong, make a monitor for it") — follow this workflow:

**Step 1: Determine the detection target.** What specific behavior in the assistant's output
should trigger a flag? Translate the user's description into concrete, observable patterns.

**Step 2: Choose event and when.** Match the detection target to the right trigger:
- Response content issues (trailing questions, lazy options, tone) → `turn_end`, `when: always`
- Tool use issues (no commit, no test, bad edits) → `agent_end`, `when: has_file_writes` or `has_tool_results`
- Post-action fragility (ignoring errors) → `message_end`, `when: has_tool_results`
- On-demand analysis → `command`, `when: always`

**Step 3: Choose context collectors.** What data does the classifier need to see?
- Checking the assistant's final response text → `assistant_text`
- Checking what the user asked (to compare against response) → `user_text`
- Checking what tools were called → `tool_calls`
- Checking tool outputs for errors/warnings → `tool_results`
- Checking git state → `git_status`
- Include `assistant_text` if you want iteration-aware acknowledgment (recommended).

**Step 4: Write the patterns file.** Each pattern is a specific, observable anti-pattern.
Write descriptions that a classifier LLM can match against the collected context. Start with
3-8 seed patterns. Set `learn: true` so the monitor grows its pattern library from `NEW:`
verdicts at runtime.

**Step 5: Write the classify template.** Use a Nunjucks `.md` file for anything beyond
trivial classification. The template must:
- Present the collected context to the classifier
- List the patterns to check against
- Include the verdict format instructions (CLEAN/FLAG/NEW)
- Include the iteration-aware acknowledgment block if `assistant_text` is collected

**Step 6: Write the monitor definition.** Wire everything together in the `.monitor.json`.

**Step 7: Create empty instructions file.** Write `[]` so the user can add calibration
rules via `/monitors <name> rules add <text>`.

**Step 8: Activate.** After creating the files, tell the user to run `/reload 3` to
reload extensions and activate the new monitor without restarting the session.

### Example: response-mandates monitor

User says: "create a monitor that flags responses ending with questions and responses
that present lazy deferral options."

**Files to create:**

1. `.pi/monitors/response-mandates.monitor.json`:

```json
{
  "name": "response-mandates",
  "description": "Flags responses that violate communication mandates: trailing questions, lazy deferral options, non-optimal solutions",
  "event": "turn_end",
  "when": "always",
  "scope": { "target": "main" },
  "classify": {
    "model": "claude-sonnet-4-20250514",
    "context": ["assistant_text", "user_text"],
    "excludes": ["fragility"],
    "promptTemplate": "response-mandates/classify.md"
  },
  "patterns": { "path": "response-mandates.patterns.json", "learn": true },
  "instructions": { "path": "response-mandates.instructions.json" },
  "actions": {
    "on_flag": { "steer": "Rewrite your response: report findings and state actions — do not end with a question or present options that defer proper work." },
    "on_new": { "steer": "Rewrite your response: report findings and state actions — do not end with a question or present options that defer proper work.", "learn_pattern": true },
    "on_clean": null
  },
  "ceiling": 3,
  "escalate": "ask"
}
```

2. `.pi/monitors/response-mandates/classify.md`:

```markdown
The user said:
"{{ user_text }}"

The assistant's response:
"{{ assistant_text }}"

{{ instructions }}

Check the assistant's response against these anti-patterns:
{{ patterns }}

Specifically check:
1. Does the response end with a question to the user? The final sentence or paragraph
   should not be a question unless the user explicitly asked to be consulted. Rhetorical
   questions, permission-seeking ("shall I...?", "would you like...?"), and steering
   questions ("what do you think?") are all violations.
2. Does the response present options where one or more options leave known issues
   unaddressed? If a problem has been identified, every option presented must address it.
   Options that defer proper work to a vague future ("we could address this later",
   "for now we can...") are violations.
3. Does the response propose a non-durable solution when a durable one is known? Workarounds,
   temporary fixes, and partial solutions when the root cause is understood are violations.

{% if iteration > 0 %}
NOTE: You have steered {{ iteration }} time(s) already this session.
If the agent explicitly acknowledged the mandate violation and rewrote its response
without the violation, reply CLEAN. Re-flag only if the violation persists.

Agent response:
{{ assistant_text }}
{% endif %}

Reply CLEAN if the response follows all mandates.
Reply FLAG:<description> if a known pattern was matched.
Reply NEW:<pattern>|<description> if a violation not covered by existing patterns was detected.
```

3. `.pi/monitors/response-mandates.patterns.json`:

```json
[
  { "id": "trailing-question", "description": "Response ends with a question to the user instead of reporting and acting", "severity": "error", "category": "communication", "source": "bundled" },
  { "id": "permission-seeking", "description": "Asks permission before acting when the user has already given direction", "severity": "warning", "category": "communication", "source": "bundled" },
  { "id": "steering-question", "description": "Ends with 'what do you think?', 'does that sound right?', or similar steering questions", "severity": "error", "category": "communication", "source": "bundled" },
  { "id": "lazy-deferral", "description": "Presents options that defer known issues to a vague future ('we can address later', 'for now')", "severity": "error", "category": "anti-laziness", "source": "bundled" },
  { "id": "fragility-tolerant-option", "description": "Offers an option that leaves identified fragility unaddressed", "severity": "error", "category": "anti-laziness", "source": "bundled" },
  { "id": "workaround-over-fix", "description": "Proposes workaround when root cause is understood and fixable", "severity": "warning", "category": "anti-laziness", "source": "bundled" }
]
```

4. `.pi/monitors/response-mandates.instructions.json`:

```json
[]
```

After creating all files, tell the user: "Monitor created. Run `/reload 3` to activate
it in this session."
</creating_monitors>

<modifying_monitors>
**Adding patterns** — When the user identifies a new anti-pattern during conversation
("that kind of response should also be flagged"), add it to the patterns JSON file.
Each pattern needs `id`, `description`, `severity`, and `source: "user"`.

**Adding rules** — Use the `monitors-rules` tool or `/monitors <name> rules add <text>`
to add calibration rules. Rules fine-tune the classifier without changing patterns.
Example: "responses that end with 'let me know' are not questions."

**Changing the classify prompt** — Edit the Nunjucks template file or the inline prompt.
For template-based monitors, edit the `.md` file. For inline monitors, edit the `prompt`
field in the `.monitor.json`.

**Upgrading inline to template** — When a monitor needs conditionals (iteration-aware
acknowledgment, optional context sections), create a `<name>/classify.md` template file
in `.pi/monitors/` and add `"promptTemplate": "<name>/classify.md"` to the classify block.
The inline `prompt` remains as fallback.

**Adjusting sensitivity** — Lower the `ceiling` to escalate sooner if the monitor is
over-firing. Raise it to give the agent more chances. Set `escalate: "dismiss"` to
auto-silence without prompting.

After any file changes, tell the user to run `/reload 3` to pick up the changes.
</modifying_monitors>

<success_criteria>
- Monitor `.monitor.json` validates against `schemas/monitor.schema.json`
- Patterns `.patterns.json` validates against `schemas/monitor-pattern.schema.json`
- Patterns array is non-empty (empty patterns = monitor does nothing)
- Classification prompt (template or inline) includes `{{ patterns }}` / `{patterns}` and verdict format instructions (CLEAN/FLAG/NEW)
- If using `promptTemplate`, the `.md` file exists at the declared path relative to one of the template search directories
- If using templates, `assistant_text` is in `classify.context` for iteration-aware acknowledgment
- Actions specify `steer` for `scope.target: "main"` monitors, `write` for findings output
- `write.path` is set relative to project cwd, not monitor directory
- `excludes` lists monitors that should not double-steer in the same turn
- Instructions file exists (even if empty `[]`) to enable `/monitors <name> rules add <text>` calibration
- After creating or modifying monitor files, remind user to run `/reload 3`
</success_criteria>

---

*Generated from source by `scripts/generate-skills.js` — do not edit by hand.*
