# shared-agent-context

Origin-keyed engineering context with per-record storage routes. Alignment,
initiatives, workflows, evidence, and sources can use repository or shared
storage. External tickets stay in their tracker. Each origin uses its
canonicalized git `origin`. The CLI works with pi, OMP, Zot, and Claude Code.

## Why

- Some repos aren't fully under your control, so you either don't want to
  influence other people's agents, or aren't allowed to modify the repo's
  `AGENTS.md`.
- Some repos are part of a larger project or effort, and you want a shared
  `AGENTS.md` that isn't tied to any one repo/clone/worktree.

## Storage location

Configured in `~/.config/shared-agent-context/config.json`:

```json
{ "storage_path": "~/Notes/SharedAgentContext" }
```

Auto-created with that default on first use if missing. Each repo gets its
own subdirectory: `<storage_path>/<slugified-origin>--<hash>/`.

## How it works

On session or agent start, the tool injects a `<shared-agent-context>` XML block
with the alignment root, repository root, origin, and route summary. Skills can
resolve each file-backed record through the CLI. See
[`../matt-pocock/ALIGNMENT-ROOT.md`](../matt-pocock/ALIGNMENT-ROOT.md).

- **pi**: `extensions/pi-shared-context.ts` wires this into
  `before_agent_start` and registers `/eng-context`.
- **OMP**: `hooks/pre/shared-context.ts` resolves context on `session_start` and
  `session_switch`, then extends each `before_agent_start` system prompt.
- **Zot**: `extensions/zot-shared-context.ts` uses Zot's extension protocol,
  including the `before_agent_start` prompt hook, and registers `/eng-context`.
- **Claude Code**: ships as the `shared-agent-context` plugin —
  `hooks/hooks.json` runs `cli.ts inject` on `SessionStart`; the hook wraps
  the generic CLI output in Claude's response shape.

All hosts call the same `lib.ts`/`config.ts` — no duplicated context logic
between tools.

## Running the CLI

Run `scripts/shared-context/cli.ts` directly. Its shebang is
`#!/usr/bin/env -S mise x -- bun --install=fallback`, which starts Bun
through mise and auto-installs `@crustjs/core` and `@crustjs/plugins` when they are
missing. The import specifiers carry their own version ranges for that reason.

Do not call it as `bun run cli.ts`. That skips the shebang, and bun disables
auto-install whenever a `node_modules` directory exists next to the script — even
an empty one, which is what a plugin install leaves behind.

## Usage

`/eng-context` (pi) or `/shared-agent-context:eng-context` (Claude Code)
subcommands:

- `report` (default) — route table, roots, origin, and slug. `mode` is a summary, not a path selector.
- `root` — print the alignment root for scripts.
- `init --store repository|shared [--preset hosted-shared]` — initialize the selected context store without changing established storage.
- `list` — list origin-keyed contexts under the shared base.
- `resolve alignment` — resolve the alignment root.
- `resolve initiative --id <ID>` — resolve one initiative directory.
- `resolve workflow --id <ID>` — resolve one workflow directory.
- `resolve evidence --workflow <ID> --run <ID>` — resolve one evidence directory.
- `resolve source --ticket <ID> --source <name>` — resolve ticket source material.
- `resolve source --library --source <name>` — resolve library source material.
- `resolve ticket --id <ID>` — resolve a local Markdown ticket. External tickets
  must use the tracker skill.
- `resolve <kind> ... --json` — print adapter, store, root, path, stable ref, and publication rule.
- `migrate <kind> --to <store>` — copy only that record kind after conflict checks.
- `migrate --legacy-only` — write a route manifest from the legacy `.storage` preference.
- `doctor` — check Bun, mise, git, and fd prerequisites.
- `index <dir> [--kind <kind> ...] [--force]` — rebuild the managed block of
  `<dir>/index.md` from sibling Markdown frontmatter. `--kind` selects the route
  and accepts the resolver selectors (`--id`, `--workflow`, `--run`, `--ticket`,
  `--source`, `--library`). The CLI rejects targets outside the selected record
  store and targets or inputs that escape through symlinks. Text outside the
  `<!-- shared-context:index start -->` / `<!-- shared-context:index end -->`
  markers is kept. An `index.md` with no markers is refused unless `--force`.

## Route manifest

Project routes use `.context-routes.toml`. Shared manifests and legacy shared
policies keep precedence; a repository-local manifest supplies repository-owned
registration when neither exists. Machine-local `storage_path` remains in
`~/.config/shared-agent-context/config.json`.

```toml
schema = 2

[records.alignment]
adapter = "markdown"
store = "shared"

[records.tickets]
adapter = "github"

[records.initiatives]
adapter = "markdown"
store = "shared"

[records.workflows]
adapter = "files"
store = "shared"

[records.evidence]
adapter = "files"
store = "inherit:workflows"

[records.sources]
adapter = "files"
store = "inherit:alignment"
```

External ticket adapters have no `store`. Local Markdown tickets set
`adapter = "local-markdown"` and a `store`.

When shared `AGENTS.md` exists, the injected block looks like:

```xml
<shared-agent-context
  storage="shared"
  mode="shared"
  root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  alignment-root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  routes="alignment=shared,tickets=github,initiatives=shared,workflows=shared,evidence=workflows-&gt;shared,sources=alignment-&gt;shared"
  shared-root="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678"
  repository-root="/work/repo"
  origin="https://github.com/owner/repo.git"
  slug="github-com-owner-repo--12345678"
  tickets="github"
  initiatives="shared"
  workflows="shared"
  evidence="shared"
  sources="shared"
  source="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678/AGENTS.md">
  <instructions source="/home/q/Notes/SharedAgentContext/github-com-owner-repo--12345678/AGENTS.md">
    ...XML-escaped instructions...
  </instructions>
</shared-agent-context>
```

Without shared `AGENTS.md`, repository behavior remains active (Claude Code
already loads repository `CLAUDE.md`/`AGENTS.md` natively, so the hook is a
no-op in that case rather than re-injecting it).


## Configurable record layout

Storage routes select **which store** holds each record. Layout selects the relative
directory **inside that selected store**. Neither setting changes the other.

Optionally add `docs/agents/context-layout.toml` under the active alignment root:

```toml
schema = 1

[paths]
tracker = "docs/tracker"
sources = "docs/sources"
```

Without this file, the bases remain `tracker` and `sources`. Only `tracker` and
`sources` can be overridden. Paths must be non-empty relative directories without
absolute paths, traversal, or symlink escapes. Invalid configuration fails; it
never silently falls back to default paths.

For a local Markdown tracker, `issue-root` and `initiative-root` in
`docs/agents/issue-tracker.md` frontmatter take precedence for ticket and initiative
collections. Each is relative to its own routed store, not the alignment root.
Absent fields default to `<tracker>/tickets` and `<tracker>/initiatives`. The
tracker collection itself still uses the configured tracker base. Workflows,
evidence, and ADR layouts do not change.

Use these collection selectors instead of rebuilding directory names:

```text
resolve tracker --json
resolve tickets --json
resolve initiatives --json
resolve sources --json
```

Each result has the same adapter, store, root, path, ref, and publication fields
as a singular record. `root` is the selected store; `path` is the exact collection
directory. `path tracker` remains available. Local ticket collections are not
available when an external tracker owns tickets.

`migrate tickets`, `migrate initiatives`, and `migrate sources` copy the configured
collection paths. Alignment migration carries the layout and tracker configuration
with the other alignment records. Initialization carries these two configuration
files into a newly selected shared alignment root without overwriting existing
files. Resolve again after changing routes or configuration.

## Pi/OMP onboarding modal

`/shared-context`, `/shared-context files`, and `Ctrl+Shift+G` open established
context directly when its selected storage roots exist. Repository mode does not
require an origin-keyed shared directory. Mixed mode checks the roots selected
by its routes, including inherited evidence and source routes. External tickets
need no local ticket directory. Missing optional collections remain empty; they
do not trigger setup.

The resolver reports its routing source as `routeSource`. Shared manifests and
legacy shared policies keep precedence. A repository-local `.context-routes.toml`
also establishes routing without creating shared registration. Existing
repository tracker or layout configuration also counts as established context.
`docs/agents/context-layout.toml` selects collection paths, not storage mode.

An unconfigured project shows **Choose context storage** with **Repository**,
**Shared store**, **Apply setup**, and **Cancel** controls. The detected storage
is preselected. Selecting a store changes only the preview. The preview names
the exact destination and missing files before any writes. **Apply setup**
creates missing instructions, context map, and route manifest in the selected
store. Shared setup also copies existing layout and tracker configuration when
present. Existing files remain unchanged. Repository setup creates no shared
directory. Reopening preserves the selected storage.

Use Tab, Shift+Tab, or arrow keys to move focus. Use Enter or Space to select a
store or apply setup. Use PgUp/PgDn to scroll long destination and file details.
Escape or Ctrl+C cancels without writes. Mouse activation remains available in
hosts that enable mouse input. Pending operations reject duplicate activation.
Failures remain visible and permit retry.

Established contexts with unavailable selected roots offer **Check again** and
**Cancel** only. Restore the reported roots, then check again. This action does
not initialize storage or rewrite routing. Malformed configuration, invalid
path types, and filesystem access errors are reported as errors.

The direct initialization commands require an explicit store:

```text
/shared-context init --store repository
/shared-context init --store shared
scripts/shared-context/cli.ts init --store repository
scripts/shared-context/cli.ts init --store shared --preset hosted-shared
```

Initialization refuses to change established storage. Use `migrate <kind> --to
<store>` for each record kind instead. The hosted-shared preset requires an
external ticket adapter and established all-shared routes when context already
exists. Reopen the session after command-line initialization to refresh injected
instructions.


## Pi project navigation

`/shared-context` opens the current project tracker with initiatives, then Ungrouped.
Ungrouped is a synthetic collection and stays visible with zero items. It has no initiative planning actions.
Initiative rows show the recorded phase and Items count separately from the title. Missing phases show unavailable; actions never supply a phase.
Press Enter to open an initiative summary and its children. Press Enter on a child to open its existing detail view.
Child rows separate type, stable ID, title, and recorded state. Supporting references and workflow warnings appear below the primary fields.
Titles wrap. Narrow terminals wrap phase and Items on separate lines below the title. Use PgUp/PgDn to read long rows without changing selection. Resizing or row reflow brings the selected record back into view; unchanged layouts retain deliberate paging.
The > marker identifies a focused selection. The ◇ marker identifies an inactive selection; both retain the selection background.
Use Tab and Shift+Tab to focus ancestors, panes, and workspace controls. Press Enter or Space on an ancestor, or click it, to return directly.
Esc returns one level and restores the parent selection and scroll position. In compact terminals, returning from Events with Esc or the ticket ancestor shows the overview at its saved reading position. Live updates retain canonical selection; removal explains the new selection. If a child leaves its initiative while a reader or action menu is open, return to a nearby child or the empty parent before another action. Removing an unrelated initiative does not change the active ticket queue. Removing an inactive remembered child also leaves unrelated queue and home initiative action menus open on their canonical targets.
Press 5 for Ready, 6 for Review, 7 for Blocked, or 8 for All to open the separate ticket queues. Press h to return to initiatives.
Uppercase R refreshes. Lowercase r retains its existing Review action. The a action menu and direct action keys keep their existing safety checks.
Loading, empty collections, unreadable records, and refresh failures have distinct messages. A failed refresh retains readable content and blocks unsafe transitions.
`/shared-context files` opens the independent Files workspace. Files keeps its path-insertion behavior.


Use Tab and Shift+Tab to move between tracker panes, workspace tabs, and the Projects breadcrumb.
Press Enter on Projects, or click Projects, to open the project list.
Type to filter project names and identities. Matching ignores case and accepts substrings or characters in order. Projects shows the filtered/total count and active query. Use Backspace to edit or Ctrl+U to clear. A zero-result list cannot open a project. Use the arrow keys to select a result. Press Enter to open it. Printable keys, including q, 1 and 2, enter search text while the Projects list has focus.
The list includes stored shared-context projects and the current project. Stable identities distinguish equal names and remove duplicate projects.

The header displays Shared or Repo from the selected alignment route. The indicator does not change storage.
Project selection changes only the modal. It does not change the Pi session directory or system instructions.
Each project keeps its tracker navigation, selection, scroll position, and independent Files state.
Project changes stop the old watchers. Return navigation resolves routes before it starts the selected project's watchers and reads.

Outside Projects, press 1 for Tracker or 2 for Files. At the tracker root, Esc opens Projects. At Projects, Esc closes the modal even with an active filter.
Files keeps its existing escape and path-insertion behavior.

Stored projects do not contain checkout locations. Shared initialization and route migration save the credential-free canonical remote in `.context-project.json`. Stored project resolution uses this identity for hosted trackers; it never treats the directory slug as a remote. Older stores without this file can still read local records. Hosted trackers need explicit identity recovery. Run `scripts/shared-context/cli.ts list`, then use exactly one authoritative source:

```text
scripts/shared-context/cli.ts recover-identity SLUG --checkout /verified/checkout
scripts/shared-context/cli.ts recover-identity SLUG --remote https://github.com/OWNER/REPO.git
```

The checkout command reads that checkout’s Git origin. The remote command works without a checkout. Both require an existing store whose slug matches the supplied origin. Recovery writes only missing credential-free identity metadata. It preserves existing metadata, routes, records, and session instructions. Reopen Projects after recovery. If neither the authoritative remote nor a verified checkout is available, hosted tickets remain unavailable; the directory slug cannot recover that identity. No repository scan, initialization, migration, or clone runs.
If the current checkout disappears while the modal is open, its existing shared directory remains reachable through the deduplicated current entry. Returning to a cached workspace refreshes checkout capability, disabled actions, Files roots, and watcher targets before it reads records. Selected-project reads use a verified surviving directory from that project, even if the original repository-only session checkout disappears. The Pi session directory stays unchanged.
For mixed routes, repository-backed records remain unavailable until a checkout is known.
Files can still browse the stored shared directory. Checkout-dependent actions display a disabled reason.
Open the command from that project's checkout to use those actions. The modal does not search other repositories or create a project registry.

Fresh-chat actions use Pi's replacement session context to stage the command. The command stays unsent until you press Enter.
