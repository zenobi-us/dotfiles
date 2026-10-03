# Storage

Read this when the user asks where context lives, or asks for `init`, `list`, or
`migrate`.

Run every command with the working directory inside the repository you are working
on. See Step 0 in `SKILL.md`.

## Commands

| Command | Mutates | Does |
|---|---|---|
| (none) or `report` | no | Print the route table, roots, origin, and slug |
| `list` | no | List origin-keyed contexts under the shared base |
| `files` | no | List files under the alignment root |
| `inject` | no | Emit the hook JSON that injects shared instructions |
| `resolve <kind> ... [--json]` | no | Resolve one file-backed record and its publication rule |
| `path <kind> ...` | no | Print the path for a file-backed record |
| `index <dir> [--kind <kind> ...] [--force]` | writes `index.md` | Rebuild an index under its resolved record store |
| `init [--preset hosted-shared]` | yes | Create shared context and its route manifest |
| `migrate [<kind>] --to <store>` | yes | Copy one record kind and update its route |
| `migrate` | yes | Copy alignment to the other store |
| `migrate --legacy-only` | yes | Replace the legacy `.storage` marker with a route manifest |

Show read-only output verbatim. Do not add analysis.

## Reading the report

`mode` is a summary only. It can be `repository`, `shared`, or `mixed`. It does
not select a path. Resolve each record kind before you read or write it.

`root` is the alignment root. `shared candidate` is the origin-keyed directory
under the configured shared base. The CLI prints it only when alignment uses
repository storage.

`tickets` names either a tracker adapter such as `github`, or a local Markdown
store. External tickets remain in the tracker. `initiatives`, `workflows`,
`evidence`, and `sources` have independent routes. Evidence inherits the workflow
store by default. Sources inherit the alignment store by default.

Use `resolve <kind> ... --json` to get `adapter`, `store`, `root`, `path`, `ref`,
and `publication`. Use the `ref` field for cross-store links. Do not infer a
record path from `root` or the report mode.

## Answering "what files are in it"

- When the requested record resolves to `store: shared`, inspect only its
  resolved path.
- When the requested record resolves to `store: repository`, use the repository
  root and inspect only its resolved path. Do not list the whole repository.
- `files` lists the alignment root only. It does not list all stores in mixed
  mode.

`list` shows origin-keyed shared contexts. It does not prove that the current
repository has no local records. Read `report` first.

## Before you run init or migrate

1. Confirm that the user named the operation. "Set up shared context" names
   `init`. "Save this page" does not.
2. State the subcommand and the record kinds it can change.
3. `migrate <kind> --to <store>` copies only that record kind. It checks
   conflicts before copying and updates the route after the copy.
4. Workflow migration excludes `artifacts/evidence/`. Evidence uses its own
   route and migration.
5. When a parent route changes, the CLI pins inherited child routes to their
   current store. They do not move as a side effect.
6. External tickets have no shared-context file store. Resolve them through the
   ticket skill.
7. `migrate --legacy-only` replaces the old `.storage` marker with a route
   manifest. It does not move records.

`migrate` refuses when a target file differs. Read the conflict list. Do not
delete the target to force the copy.

## Traps

- `inject` prints `null` when no shared `AGENTS.md` exists. That is success.
- `init` preserves an authored `CONTEXT-MAP.md` and an existing route manifest.
- `init --preset hosted-shared` refuses to replace a non-shared route manifest.
  Migrate the record kinds explicitly, then retry.
- `init --preset hosted-shared` keeps the configured external ticket adapter and
  stores the file-backed engineering records in shared context.
- The hosted-shared preset requires an external ticket adapter.
- Existing `.storage` markers remain readable until migration.
- The storage path can be a symlink. Read `references/publishing.md` before you
  decide the store is not a git repository.

## Storage path

`~/.config/shared-agent-context/config.json` holds the machine-local
`storage_path`. The default is `~/Notes/SharedAgentContext`. Each origin has a
directory at `<storage_path>/<slug>/`. Its `.context-routes.toml` file holds
project-level routing policy.
