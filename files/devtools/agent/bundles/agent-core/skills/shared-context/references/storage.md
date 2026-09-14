# Storage

Read this when the user asks where context lives, or asks for `init`, `list`, or
`migrate`.

Run every command with the working directory inside the repository you are working
on. See Step 0 in `SKILL.md`.

## Commands

| Command | Mutates | Does |
|---|---|---|
| (none) or `report` | no | Print storage, root, shared root, shared candidate, origin, slug |
| `list` | no | List contexts that have shared storage |
| `files` | no | List files under the resolved root |
| `inject` | no | Emit the hook JSON that injects context at session start |
| `anchor --source S [--key K] [--dry-run]` | creates a directory unless `--dry-run` | Print the directory an ingested source belongs in |
| `index <dir> [--force]` | writes `index.md` | Rebuild the managed block of `index.md` |
| `init` | yes | Create shared `AGENTS.md` and activate shared storage |
| `migrate` | yes | Copy alignment files to the opposite storage |

Show read-only output verbatim. Do not add analysis.

## Reading the report

`storage: shared` means `root` is a directory managed by this CLI, outside the
repository clone. `storage: repository` means `root` is the repository root and
ordinary repository behavior applies.

`shared root` is mode-dependent and easy to misread. In shared mode it equals
`root`. In repository mode it equals the repository root, which is not shared at
all. The path where shared storage *would* live is printed as `shared candidate`.
Quote `root` when the user asks where context lives. Quote `shared candidate` only
to answer "where would it go", and only in repository mode — shared mode does not
print it.

## Answering "what files are in it"

- `storage: shared` — run `files`.
- `storage: repository` — do **not** run `files`. It lists the whole repository.
  One run produced 3284 paths. List the alignment paths instead:

  ```bash
  for p in AGENTS.md CONTEXT.md CONTEXT-MAP.md docs/agents docs/adr library .scratch; do
    [ -e "$p" ] && find "$p" -maxdepth 2 || :
  done
  ```

  The loop exits 0 whether or not a path is missing. Expand each directory one
  level so the user sees real filenames, not a bare directory name.

`list` shows only contexts that have shared storage. A repository in repository
mode never appears. Do not conclude from `list` alone that the current repository
has no context. Read the `report` first.

## Before you run init or migrate

1. You **MUST** confirm the user named the operation. "Set up shared context" names
   `init`. "Save this page" does not.
2. You **MUST** state the subcommand and the directory it can change.
3. `migrate` copies these paths only: `AGENTS.md`, `docs/agents`, `CONTEXT.md`,
   `CONTEXT-MAP.md`, `docs/adr`, context-scoped `src/**/docs/adr`, `library`, and
   `.scratch` when the tracker backend is `local-markdown`.
4. Work-key directories such as `RWR-16627/` are **not** migrated. They exist only
   in the storage they were written to.
5. `migrate` refuses when a target file exists with different content. Read the
   conflict list. Do not delete the target to force the copy.

## Traps

- `inject` prints `null` when no shared `AGENTS.md` exists. That is success, not
  failure.
- `init` writes a marker file named `.storage` holding the word `shared`. Shared
  storage activates on the next session, not immediately.
- The storage path can be a symlink. Read `references/publishing.md` before you
  decide the store is not a git repository.

## Storage path

`~/.config/shared-agent-context/config.json` holds `storage_path`. The default is
`~/Notes/SharedAgentContext`. Each repository gets `<storage_path>/<slug>/`.
