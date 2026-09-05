---
name: eng-context
description: Reports and manages origin-keyed shared engineering context; use to inspect, initialise, list, or migrate shared context storage; returns the CLI result and keeps repository and shared files aligned.
---

# Engineering Context

Use the bundled CLI for shared engineering context operations:

```bash
bun run "<skillroot>/scripts/shared-context-cli.ts" <subcommand>
```

Replace `<skillroot>` with the root directory of this skill. In Pi or Zot,
prefer `/eng-context <subcommand>` when the host command is available.

`report` is the default and is read-only. `list` is read-only. Show the CLI output verbatim with no added analysis.

## Mutating operations

`init` creates shared context files. `migrate` copies alignment files. Run either operation only when the user explicitly requests that operation. Before running it, state the subcommand and the files or storage it can change. Do not run `init` or `migrate` from an implied request.

## Subcommands

- `report` — report current storage, roots, origin, and slug.
- `files` — list files in the active shared-context root.
- `init` — create shared `AGENTS.md` and activate shared storage.
- `list` — list every origin-keyed shared context.
- `migrate` — copy alignment files to the opposite storage after matching existing files are verified.

Pass the user's arguments after the subcommand. Do not replace the bundled CLI with ad hoc file operations. Stop and report a non-zero exit status.