# Herdr worktree tracker plugin

- **Purpose:** Find out how a Herdr plugin can track `/worktree` skill worktrees, show their workflow step in the sidebar, and start the next step on a click.
- **Date:** 2026-10-09
- **Reader:** Q, before writing the plugin.
- **Sources:** Herdr 0.9.3 CLI output, the bundled API schema, Herdr docs at the `v0.9.3` tag, Herdr source at the `v0.9.3` tag, local skill files, local ADRs, and real receipts in the shared-context store. See `## Sources`.
- **Recommendation:** Build shape 1 (sidebar tokens on existing workspace rows) plus one keybound plugin action. `[bias: ...]` in section 7. The row layout is settled; see **Settled layout** in section 2.

Directory choice: `docs/` holds `adr/`, `agents/`, `plans/`, and `reviews/`. No research directory existed, so this file creates `docs/research/` as the task named it (`ls docs/`).

## 1. Plugin surface

Herdr 0.9.3 has a plugin API. It is manifest-driven and out-of-process.

- **Language.** Any argv command. The docs say a plugin "can be a Bash script, JavaScript app, Lua script, Rust binary, or any other argv command" (`plugins.mdx` lines 6-8). Herdr does not run commands through a shell (`plugins.mdx` lines 119-121).
- **File layout.** A directory with `herdr-plugin.toml` and the commands it names (`plugins.mdx` lines 18-21, 125-132).
- **Manifest format.** TOML. Required top-level keys are `id`, `name`, `version`, and `min_herdr_version` (`plugins.mdx` line 101). Tables are `[[build]]`, `[[startup]]`, `[[actions]]`, `[[events]]`, `[[panes]]`, and `[[link_handlers]]` (`plugins.mdx` lines 60-99). Action ids cannot contain dots; Herdr qualifies them as `plugin.id.action` (`plugins.mdx` lines 108-111).
- **Load path.** `herdr plugin link <path>` registers a local directory; `herdr plugin install owner/repo[/subdir]` clones from GitHub (`herdr plugin --help`; `cli-reference.mdx` lines 468-486). Both write `plugins.json` next to `session.json` (`socket-api.mdx` lines 455-460). On this machine `~/.config/herdr/plugins.json` is a symlink to a path that does not exist, so `herdr plugin list --json` returns `"plugins":[]` (`ls -la ~/.config/herdr/`; `herdr plugin list --json`). The repo copy at `files/shells/herdr/plugins.json` shows the registry shape: each entry carries `plugin_id`, `manifest_path`, `plugin_root`, `enabled`, `actions`, `events`, `panes`, and `source`.
- **Lifecycle hooks.** `[[startup]]` runs once after session restore when the socket is ready (`plugins.mdx` lines 235-249). `[[events]]` run when Herdr emits a matching event name (`socket-api.mdx` lines 575-576). `[[actions]]` run on `plugin.action.invoke`, a keybinding, or a link handler. `[[panes]]` open a terminal pane with the plugin's command (`plugins.mdx` lines 285-324).
- **Environment.** Runtime commands get `HERDR_SOCKET_PATH`, `HERDR_BIN_PATH`, `HERDR_ENV=1`, `HERDR_PLUGIN_ID`, `HERDR_PLUGIN_ROOT`, `HERDR_PLUGIN_CONFIG_DIR`, `HERDR_PLUGIN_STATE_DIR`, `HERDR_PLUGIN_CONTEXT_JSON`, and any available `HERDR_WORKSPACE_ID`, `HERDR_TAB_ID`, `HERDR_PANE_ID`. Event hooks also get `HERDR_PLUGIN_EVENT` and `HERDR_PLUGIN_EVENT_JSON` (`plugins.mdx` lines 253-261; `src/app/api/plugins/runtime.rs` lines 59-62).
- **Storage.** None from Herdr. The plugin owns files under `HERDR_PLUGIN_STATE_DIR` (`plugins.mdx` lines 357-360).
- **Local example.** `files/shells/herdr/plugins/local/tempomat/` is a working Bun plugin in this repo. Its manifest uses `[[build]]`, `[[startup]]`, four `[[events]]`, and two `[[actions]]` (`herdr-plugin.toml` lines 1-37). Its script calls Herdr through `HERDR_BIN_PATH` and reads `HERDR_PLUGIN_EVENT_JSON` (`track.ts` lines 21, 56-62, 155-158).

Nearest alternatives are not needed. A plugin can also open a raw socket (`HERDR_SOCKET_PATH`) for `events.subscribe` (`socket-api.mdx` lines 771-787).

## 2. Sidebar

**Tokens on an existing row: yes.** Space (workspace) rows render custom `$name` tokens from workspace metadata (`configuration.mdx` lines 395-402, 458-476; `--default-config` comment "Custom values reported through workspace metadata use a $name token"). A plugin sets a token with:

```sh
herdr workspace report-metadata <workspace_id> --source <id> --token wt="review due" [--ttl-ms N] [--seq N]
```

Verified live: `herdr workspace report-metadata w7 --source research:wt-tracker --token wt_step=review --ttl-ms 8000` then `herdr workspace get w7` returned `"tokens":{"wt_step":"review"}`. After the TTL, `tokens` was `null`. Limits: 16 keys per report, 32 keys per workspace, values capped at 80 characters, token names match `^[A-Za-z0-9_-]{1,32}$` (`herdr api schema --json`, `WorkspaceReportMetadataParams`; `socket-api.mdx` lines 745-768). Token metadata is not restored after a server restart (`socket-api.mdx` line 764), so the `[[startup]]` hook must re-report it.

**A grouped worktree row has an empty second row.** In `space_rows`, `Branch` and `GitStatus` return `None` when `suppress_git_details` is true, which is the case for indented worktree children. A row whose tokens all resolve to nothing is dropped by `(!resolved.is_empty()).then_some(resolved)` (`src/ui/sidebar/tokens.rs`, `space_rows`; test `grouped_children_suppress_all_builtin_git_details` yields one row from the two-row default). `Custom(name)` has no such guard, so a `$name` token renders on a child row where `branch` and `git_status` cannot. An absent custom token elides its row the same way (test `missing_custom_tokens_elide_rows_and_separators`), and a `hide = true` rule does too (test `conditional_hide_removes_tokens_and_empty_rows`).

Column budget, measured against the operator's live sidebar at about 35 columns. The child prefix is `"   ├─ "` (6 columns) on the first row and `"   │    "` or `"        "` (8) on later rows; the renderer reserves 2 more (`src/client/shell/sidebar.rs`, `render_workspace_rows`).

| Slot | Columns for tokens |
|---|---|
| Parent row | 32 |
| Child row 1, after the state icon | 25 |
| Child row 2, unused today | 24 |

Separators are one space after `state_icon` and before `git_status`, and ` · ` everywhere else (`tokens.rs`, `separator`). Text truncates from the right, so a leading token always survives.

**Settled layout.** Agreed with Q on 2026-10-09: take the free child row rather than crowd row 1, and report the token only while a worktree waits on a human, so the extra line appears on those worktrees alone. Two tokens replace the `$wt_step` and `$wt_next` pair proposed earlier in drafting:

- `$wt` on a new row 3. A phrase of 22 columns or less, present only when the next step needs a decision, cleared while an agent works.
- `$wt_due` on row 2. A count of waiting children, shown on the parent. It takes the slot of `$active_tab`, which renders nothing because `~/.config/herdr/plugins.json` is a broken symlink.

```toml
[ui.sidebar.spaces]
rows = [
  ["state_icon", { token = "workspace", bold = true }],
  [{ token = "branch", dim = true }, "git_status", { token = "$wt_due", dim = true }],
  [{ token = "$wt", rules = [
    { starts_with = "fix", fg = "#f38ba8", bold = true },
    { starts_with = "review", fg = "#f9e2af" },
    { starts_with = "finish", fg = "#a6e3a1", bold = true },
    { starts_with = "submit", fg = "#a6e3a1", bold = true },
  ] }],
]
```

`starts_with` lets the plugin append detail such as `· 6 findings` without breaking the colour match (`configuration.mdx` lines 418-435). Branch names keep all 25 columns, because row 1 is untouched.

Rendered result, two added lines across five worktrees:

```text
 ○ reckonone-monorepo              ▾
   master ↓6 · 2 due
   ├─ ● fix/RWR-20172-action-men…
   │    fix · 6 findings
   ├─ ○ feature/RWR-20171-list-c…
   ├─ ○ feature/RWR-20173-detail…
   ├─ ● fix/RWR-20763-superstrea…
   └─ ● fix/RWR-20227-payment-se…
        review due
```

Token vocabulary. One token carries the state and the verb, because they are the same word in five of six cases.

| `$wt` value | Meaning | Key starts |
|---|---|---|
| `review due` | implementation landed | `/worktree review` |
| `fix · N findings` | latest verdict was FAILURE | `/worktree fix` |
| `finish due` | verdict SUCCESS, merge path | `/worktree finish` |
| `submit due` | verdict SUCCESS, pull request path | `/worktree submit` |
| absent | agent working, or no workflow | nothing |


**Own sidebar panel: no.** "Runtime action registration and native non-terminal plugin UI are not part of plugin v1" (`plugins.mdx` lines 31-33; `cli-reference.mdx` line 532). The only plugin UI is a terminal pane with `placement` `overlay`, `popup`, `split`, `tab`, or `zoomed` (`plugins.mdx` lines 285-290). A "panel" is therefore a TUI the plugin draws itself inside a pane.

**Clickable action on a row: no.** The sidebar workspace row has two hit targets: the row itself and the group-collapse toggle. A press on the row records a `ClientWorkspacePress` that focuses or drags the workspace (`src/client/shell/mouse.rs` lines 2062-2085). The workspace right-click menu is a fixed list: Rename, Close, New worktree, Open worktree, Delete worktree checkout, Expand/Collapse (`src/client/shell/context_menu.rs` lines 8-44). No plugin entry appears there. The global menu is also fixed (`src/client/shell/global_menu.rs` lines 22-54). Token rendering is text only; `src/ui/sidebar/tokens.rs` has no click handling.

**What a plugin action can be bound to.**

- A keybinding: `[[keys.command]] type = "plugin_action" command = "plugin.id.action"` (`plugins.mdx` lines 331-341; `configuration.mdx` line 232).
- A CLI call: `herdr plugin action invoke <plugin.id.action>` (`herdr plugin action invoke --help`).
- A Ctrl-click on a matching URL in a pane: `[[link_handlers]]` (`plugins.mdx` lines 343-355).
- A click inside a plugin pane the plugin draws itself.

A keybound action receives `HERDR_PLUGIN_CONTEXT_JSON` filled from "the active workspace, tab, focused pane, worktree provenance, and request id" (`socket-api.mdx` lines 555-558). The context carries `workspace_id`, `workspace_cwd`, `workspace_label`, and `worktree` (`herdr api schema --json`, `PluginInvocationContext`). The installed worktrunk plugin uses this: `jq -r '.workspace_cwd // .focused_pane_cwd' <<<"$HERDR_PLUGIN_CONTEXT_JSON"` (`files/shells/herdr/plugins.json`, `worktrunk` entry).

The manifest `contexts` field accepts `global`, `workspace`, `tab`, `pane`, `selection` (`src/api/schema/plugins.rs` lines 355-361). UNVERIFIED: whether `contexts` changes any UI placement in 0.9.3. The client context menus do not read it.

## 3. Worktree matching

Herdr exposes these identifiers for a worktree workspace (`herdr workspace list`; `herdr api schema --json`, `WorkspaceInfo` and `WorkspaceWorktreeInfo`):

| Field | Example from `herdr workspace get w14` |
|---|---|
| `workspace_id` | `w14` |
| `label` | `fix-RWR-20172-action-menu-on-all-tabs` |
| `active_tab_id` | `w14:t2` |
| `agent_status` | `working` |
| `worktree.checkout_path` | `/home/zenobius/Projects/reckonone-monorepo.worktrees/fix-RWR-20172-action-menu-on-all-tabs` |
| `worktree.is_linked_worktree` | `true` |
| `worktree.repo_root` | `/home/zenobius/Projects/reckonone-monorepo` |
| `worktree.repo_key` | `/home/zenobius/Projects/reckonone-monorepo/.git` |
| `tokens` | metadata map, or absent |

`herdr worktree list --cwd <path>` adds `branch` and `open_workspace_id` per checkout (`herdr worktree list` output: `"branch":"master","open_workspace_id":"w7"`). Panes add `cwd`, `foreground_cwd`, `agent`, `agent_status`, and `agent_session.value` (`herdr pane list --workspace w14`).

Every receipt records `worktree:` as an absolute path (74 of 74 receipts in the store; `grep -oE '^[a-z_]+:'` count). It also records `source_branch`, `workflow_id`, and `repository`. So the join key is:

```text
WorkspaceInfo.worktree.checkout_path  ==  receipt.worktree
```

The ticket id is not in Herdr. The plugin gets it from the receipt (`workflow_id: RWR-20172`) or by regex on `label` (`[A-Z][A-Z0-9]+-\d+`), which is what tempomat already does (`rules.example.toml` line 24).

To find receipts, the plugin resolves the workflow root with the shared-context CLI from inside the worktree:

```sh
cd <checkout_path> && /home/zenobius/Projects/dotfiles/files/devtools/agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts resolve workflow --id <ticket-id> --json
```

From the RWR-20172 worktree this returned `"path": "/home/zenobius/Projects/zeno/shared-context/github-com-reckon-limited-reckonone-monorepo--cf409636/workflows/RWR-20172"` and `"store": "shared"`. From `dotfiles` the same command returned a repository store. The store depends on the repo origin, so the plugin MUST resolve per worktree and MUST NOT join paths itself (`shared-context/SKILL.md` lines 137-143; ADR 0006).

Workflow directories hold `events/`, `artifacts/`, `projections/`, and `manifest.yaml` (`find .../workflows/RWR-20172 -maxdepth 3`).

## 4. Receipts and state

A receipt is a YAML file under `events/` named `<phase>-<nnnn>.yaml` (`references/receipts.md` lines 51-104; real files `start-0001.yaml`, `implementation-0001.yaml`, `review-0001.yaml`). Fields present in every real receipt: `schema`, `receipt_id`, `workflow_id`, `phase`, `attempt`, `parent_receipt`, `repository`, `worktree`, `source_branch`, `base_branch`, `source_commit`, `source_tree`, `created_at`, `muxer`, `agent`, `ticket`, `inputs`, `outputs`, `status` (74 of 74). Most also carry `workspace_path`, `pane_id`, `session_id` (73 of 74).

Observed `phase` values: `start`, `implementation`, `validation`, `review`, `review-complete`, `fix`, `submit`. Observed `status` values: `completed`, `blocked`, `failed`, `completed-with-open-questions`. Some receipts add `phase_kind: phase-start | phase-result | phase-complete | addendum`. Review receipts add `verdict`.

**No receipt carries a current step or a next step.** Only one of 74 has a `next_steps:` key, and it is free text (`RWR-20175/events/implementation-0003.yaml` line 87). The `continue` playbook derives the next step by reading `events/` and the review verdict (`playbooks/continue.md` lines 19-28):

- no review artifact → `review`
- latest review `verdict: FAILURE` → `fix`
- latest review `verdict: SUCCESS`, no submit receipt → `submit` or `finish`, ask
- `SUCCESS` and a submit receipt → nothing

Two generated views exist but are not authoritative (ADR 0001, ADR 0004): `manifest.yaml` has `latest_receipt` and `state`; `projections/latest-status.yaml` has `state`, `latest_receipt`, `latest_review_verdict`, `open_findings`. Observed `state` values are `IMPLEMENTING`, `IMPLEMENTED`, `IN_REVIEW`, `REVIEW_FAILED`, `FIXED`, `VALIDATED_WITH_GAPS`. `IN_REVIEW` and `VALIDATED_WITH_GAPS` are not in the documented transition list (`references/receipts.md` lines 249-253), so the plugin cannot rely on `state` alone.

**Minimal field.** Add one key to every phase-complete receipt:

```yaml
next_step: review   # one of: review | fix | finish | submit | none
```

With `phase` and `next_step`, the plugin maps the six-step path `start > review > fix > review > finish > submit` without parsing verdicts. Until the skill writes it, the plugin MUST fall back to the `continue` rules above. A second option is to add `next_step` to `projections/latest-status.yaml`, but ADR 0004 says projections are replaceable views, so the receipt is the safer carrier.

**Reading order for the plugin.** Sort `events/*.yaml` by receipt sequence, take the latest with `phase_kind: phase-complete` (or the latest file when `phase_kind` is absent), read `phase`, `status`, `verdict`, and `next_step` if present.

## 5. Next-step action

A click cannot start a step from the sidebar (section 2). The first version needs one of:

- A keybinding bound to the plugin action while the worktree workspace is active. Herdr fills `HERDR_PLUGIN_CONTEXT_JSON.workspace_cwd` with the worktree path (`socket-api.mdx` lines 555-558).
- A plugin pane (`placement = "popup"` or `"split"`) that lists tracked worktrees and starts the step on Enter or a mouse click. The worktrunk plugin uses this pattern (`files/shells/herdr/plugins.json`, `worktrunk.panes`).

The action then starts a fresh agent in the worktree workspace. Two routes exist:

**Route A: muxer-subagents router.**

```sh
/home/zenobius/Projects/dotfiles/files/devtools/agent/bundles/agent-core/skills/muxer-subagents/scripts/router.ts spawn \
  --muxer herdr --agent claude --cwd <checkout_path> --prompt-file <handoff.md>
```

The router finds the workspace with `herdr worktree list --cwd`, creates a tab with `herdr tab create --workspace <id> --cwd <path> --label agent-<ts> --no-focus --env MUXER_SUBAGENT_DEPTH=<n>`, then runs `herdr agent start <name> --kind claude --pane <pane_id> -- @<handoff>` (`scripts/spawn.ts` lines 107-123). It prints `{ runId, muxer, agent, target, depth }` (`scripts/router.ts` line 222). `wait <runId>` blocks on `herdr agent wait <name> --until done` and `--until blocked` (`scripts/wait.ts` lines 15-63). The router enforces five children per parent and depth 2 (`scripts/session-context.ts` lines 3-4; `SKILL.md` lines 46-52).

**Route B: `herdr agent start` directly.** Same three Herdr calls without the run record. Supported kinds include `claude`, `pi`, `omp`, `codex` (`herdr agent start --help`). `zot` is not supported (`scripts/spawn.ts` line 108).

**What the handoff must contain.** The playbooks require the parent to write a phase-start receipt before launching, and a temporary handoff file with the ticket `ref`, branches, worktree path, frozen commit, receipt paths, and the completion marker (`playbooks/review.md` lines 38-49; `playbooks/fix.md` lines 28-31; `playbooks/start.md` lines 29-40). The plugin cannot write a valid receipt without the ticket skill and the worktree playbook. Therefore the plugin SHOULD NOT reimplement a phase. It SHOULD start a parent agent with the one-line prompt `/worktree <next_step> <ticket-id>` in the worktree, and let the skill run its playbook. `submit` and `finish` do not launch a child agent (`playbooks/submit.md` line 5; `playbooks/finish.md` line 5), so the same parent-agent prompt covers all six steps.

What the plugin needs to know per click: `checkout_path`, `workspace_id`, ticket id, next step, and agent kind. The first four come from sections 3 and 4. Agent kind comes from the receipt's `agent:` field or plugin config.

## 6. Events

Two mechanisms exist. Neither needs polling.

**Manifest event hooks.** `[[events]] on = "<name>"` runs a command per event. Allowed names are the `PLUGIN_HOOK_EVENT_KINDS` list (`src/api/schema/events.rs` lines 286-309): `workspace.created|updated|closed|renamed|moved|reordered|focused`, `worktree.created|opened|removed`, `tab.created|closed|renamed|moved|focused`, `pane.created|closed|focused|moved|exited|agent_detected|agent_status_changed`. Excluded on purpose: `pane.output_changed`, `layout.updated`, `workspace.metadata_updated`, `pane.updated` (`events.rs` lines 351-358). Unknown names link with a warning (`socket-api.mdx` lines 465-469). Every emitted event passes through `run_plugin_event_hooks` before the subscription hub (`src/app/api.rs` lines 761-764).

For this plugin the useful hooks are:

- `pane.agent_status_changed` with payload `pane_id`, `workspace_id`, `agent`, `agent_status`, `title` (`herdr api schema --json`, `PaneAgentStatusChangedEvent`). A change to `done` in a tracked worktree workspace is the trigger to re-read receipts and update the token.
- `worktree.opened`, `worktree.created`, `workspace.created` with `workspace.worktree` to start tracking (`socket-api.mdx` lines 817, 837).
- `worktree.removed`, `workspace.closed` to stop tracking.
- `startup` (via `[[startup]]`) to rebuild all tokens, because tokens do not survive a restart.

**Socket subscription.** `events.subscribe` with `{"subscriptions":[{"type":"pane.agent_status_changed", ...}]}` keeps a connection open and pushes events (`socket-api.mdx` lines 771-787). It covers the same lifecycle events plus `workspace.metadata_updated`. A slow reader gets `events_lost` and must resubscribe and re-read `session.snapshot` (`socket-api.mdx` lines 793-815). This path needs a long-running process; the hook path does not.

Caveat: `pane.agent_status_changed` fires on Herdr's screen-detected state. `done` means the agent is ready for input, not that the receipt is complete (`herdr --skill`, "idle and done both mean the agent is ready for input"). The plugin MUST read the receipt after the event and MUST NOT trust the event alone (ADR 0001; `completion-signals.md` line 58).

## 7. Recommendation

Both shapes use the same manifest, the same receipt reader, and the same action. They differ only in how state is shown and where the click lives.

| Criterion | Shape 1: tokens on existing rows | Shape 2: separate panel (plugin pane) |
|---|---|---|
| API support | Full: `workspace.report_metadata` plus `$wt` in `[ui.sidebar.spaces]`; verified live. | Partial: a `[[panes]]` terminal pane; Herdr has no native sidebar panel. |
| State display | One extra row per waiting worktree, styled by `rules` in config. | Any layout the plugin draws; needs its own TUI code. |
| Click | None on the row. Needs a keybinding or a popup. | Native: the plugin owns the pane and its mouse input. |
| Effort | Small: one Bun script, three event hooks, one startup hook, one config edit. | Medium: the script plus a TUI (list, selection, mouse), and a second process lifecycle. |
| Risk | Tokens vanish on restart (startup hook fixes). Token value capped at 80 chars. | Pane steals layout or focus; popup is modal; stale list if events are missed. |
| UX | Visible under the branch, only on worktrees that want you. | Must be opened; shows only tracked worktrees in one place. |
| Updates | Event hook calls `report-metadata`, and the sidebar repaints. | Event hook must signal the pane process, or the pane polls. |

`[bias: shape 1 first. Shape 2 is the right second step for the click, as a popup that shape 1's keybinding opens.]`

Concrete first version:

1. Manifest with `[[startup]]`, `[[events]]` for `worktree.opened`, `worktree.created`, `workspace.created`, `pane.agent_status_changed`, `worktree.removed`, `workspace.closed`, and one `[[actions]] id = "next"`.
2. One Bun script. On each event: list workspaces, keep those with `worktree.is_linked_worktree == true`, resolve the workflow root per worktree, read the latest receipt, compute the next step, then call `herdr workspace report-metadata <id> --source wt-tracker --token wt="<phrase>" --seq <n>` when a human decision is due, or `--clear-token wt` while an agent works. Report `wt_due` on the parent workspace as the count of waiting children.
3. Config: apply the settled `[ui.sidebar.spaces]` layout from section 2.
4. Keybinding: `[[keys.command]] key = "prefix+alt+n" type = "plugin_action" command = "wt-tracker.next"`. The action reads `workspace_cwd` from `HERDR_PLUGIN_CONTEXT_JSON`, re-reads the latest receipt to confirm the step, and starts a parent agent with `/worktree <next-step> <ticket>` through the muxer-subagents router. The row text and the key use one vocabulary, so the row names what the key will do.
5. Later: add a `[[panes]] placement = "popup"` list for a true click.

## 8. Open questions and unverified items

- UNVERIFIED: what the manifest `contexts` field does in the 0.9.3 client. The enum exists (`src/api/schema/plugins.rs` lines 355-361) and `plugin.action.list` echoes it (`mod.rs` line 786), but no client menu reads it.
- UNVERIFIED: whether `pane.agent_status_changed` reaches plugin hooks for every state change or only on settled states. The hook list includes it; the emit sites were not traced.
- UNVERIFIED: the exact payload of `HERDR_PLUGIN_EVENT_JSON` for `pane.agent_status_changed`. The subscription schema is known; the hook env may wrap it.
- Open: the `/worktree` skill does not write `next_step`. Who adds it, and to which receipt kind (phase-complete is proposed)?
- Open: `manifest.yaml` `state` values drift from the documented transitions (`IN_REVIEW`, `VALIDATED_WITH_GAPS`). Should the skill fix the vocabulary before the plugin reads it?
- Open: `~/.config/herdr/plugins.json` points to a missing path, so no plugin is registered on this machine today. The tempomat plugin is also unregistered. Fix the symlink before linking a new plugin.
- Open: the muxer-subagents router caps children at five per parent. A plugin action that starts a parent agent per click is depth 0, so the cap applies per plugin process, not per Herdr session.
- Open: per-worktree shared-context resolution runs a Bun CLI per worktree per event. Cache the resolved root under `HERDR_PLUGIN_STATE_DIR` keyed by `checkout_path`.
- Open: `ui.sidebar_width` above 26 may not widen the panel, because the name-driven auto-scale can cap it below `ui.sidebar_max_width`. Neither key documents a ceiling. The settled layout does not depend on this, because it takes the free child row instead of columns.
- Closed 2026-10-09: whether the step marker crowds the branch name. It does not. The layout uses the child row that `suppress_git_details` leaves empty, and the token is absent while an agent works, so only waiting worktrees gain a line.

## Sources

Commands, run on 2026-10-09:

- `herdr --version` → `herdr 0.9.3`
- `herdr --help`, `herdr --skill`, `herdr --default-config`
- `herdr api --help`, `herdr api schema`, `herdr api schema --json`, `herdr api snapshot`
- `herdr plugin --help` and each `herdr plugin <sub> --help`
- `herdr worktree --help`, `herdr worktree list`, `herdr worktree create --help`, `herdr worktree open --help`
- `herdr workspace --help`, `herdr workspace list`, `herdr workspace get w14`, `herdr workspace report-metadata --help`
- `herdr workspace report-metadata w7 --source research:wt-tracker --token wt_step=review --ttl-ms 8000`, then `herdr workspace get w7` twice
- `herdr pane --help`, `herdr pane list --workspace w14`, `herdr pane report-metadata --help`
- `herdr agent --help`, `herdr agent list`, `herdr agent start --help`, `herdr agent wait --help`
- `herdr notification --help`, `herdr notification show --help`, `herdr integration --help`, `herdr integration status`
- `herdr plugin list --json`, `herdr plugin action list`
- `herdr status`
- `/home/zenobius/Projects/dotfiles/files/devtools/agent/bundles/agent-core/skills/shared-context/scripts/shared-context/cli.ts` (report), `resolve workflow --id RWR-20172 --json`, run from `/home/zenobius/Projects/dotfiles` and from `/home/zenobius/Projects/reckonone-monorepo.worktrees/fix-RWR-20172-action-menu-on-all-tabs`
- `gh api repos/herdrdev/herdr`, `gh api repos/herdrdev/herdr/git/trees/v0.9.3?recursive=1`

Local files:

- `~/.config/herdr/config.toml`, `~/.config/herdr/plugins.json` (broken symlink), `~/.config/herdr/plugins/` (symlink), `~/.config/herdr/herdr-server.log`
- `~/.herdr/worktrees/` (two empty repo directories)
- `~/.local/share/mise/installs/herdr/latest/` (binary only, no shipped docs)
- `files/shells/herdr/plugins.json`
- `files/shells/herdr/plugins/local/tempomat/herdr-plugin.toml`, `README.md`, `track.ts`, `rules.example.toml`, `package.json`
- `files/devtools/agent/bundles/developer/skills/git/worktree/SKILL.md`
- `files/devtools/agent/bundles/developer/skills/git/worktree/references/receipts.md`
- `files/devtools/agent/bundles/developer/skills/git/worktree/references/playbooks/{start,review,fix,finish,submit,continue}.md`
- `files/devtools/agent/bundles/developer/skills/git/worktree/scripts/router.ts`
- `files/devtools/agent/bundles/agent-core/skills/muxer-subagents/SKILL.md`
- `files/devtools/agent/bundles/agent-core/skills/muxer-subagents/references/muxers/herdr.md`, `references/agents/claude.md`, `references/completion-signals.md`
- `files/devtools/agent/bundles/agent-core/skills/muxer-subagents/scripts/{router,spawn,wait,session-context,types}.ts`
- `files/devtools/agent/bundles/agent-core/skills/shared-context/SKILL.md`, `references/layout.md`, `references/storage.md`
- `docs/adr/0001-append-only-worktree-receipts.md` through `docs/adr/0006-typed-context-store-layout.md`, `docs/adr/index.md`
- `/home/zenobius/Projects/zeno/shared-context/github-com-reckon-limited-reckonone-monorepo--cf409636/workflows/RWR-20172/{manifest.yaml,projections/latest-status.yaml,events/start-0001.yaml,events/implementation-0001.yaml,events/review-0001.yaml}`
- `/home/zenobius/Projects/zeno/shared-context/github-com-reckon-limited-reckonone-monorepo--cf409636/workflows/*/events/*.yaml` (74 files, field census)

URLs:

- https://herdr.dev/llms.txt
- https://herdr.dev/agent-guide.md
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/docs/next/website/src/content/docs/plugins.mdx
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/docs/next/website/src/content/docs/socket-api.mdx
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/docs/next/website/src/content/docs/cli-reference.mdx
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/docs/next/website/src/content/docs/configuration.mdx
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/CHANGELOG.md
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/src/api/schema/events.rs
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/src/api/schema/plugins.rs
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/src/app/api.rs
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/src/app/api/plugins/{manifest,context,runtime,mod}.rs
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/src/client/shell/{sidebar,mouse,context_menu,global_menu,actions}.rs
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/src/ui/sidebar/tokens.rs
- https://raw.githubusercontent.com/herdrdev/herdr/v0.9.3/src/metadata_tokens.rs
