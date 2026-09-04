---
name: eng-context
description: Reports and manages origin-keyed shared engineering context; use to inspect, initialise, list, or migrate shared context storage; returns the CLI result and keeps repository and shared files aligned.
---

# Engineering Context

Use the bundled CLI for shared engineering context operations:

```bash
bun run "${CLAUDE_PLUGIN_ROOT}/cli.ts" <subcommand>
```

`report` is the default and is read-only. `list` is read-only. Show the CLI output verbatim with no added analysis.

## Mutating operations

`init` creates shared context files. `migrate` copies alignment files. Run either operation only when the user explicitly requests that operation. Before running it, state the subcommand and the files or storage it can change. Do not run `init` or `migrate` from an implied request.

## Subcommands

- `report` — report current storage, roots, origin, and slug.
- `init` — create shared `AGENTS.md` and activate shared storage.
- `list` — list every origin-keyed shared context.
- `migrate` — copy alignment files to the opposite storage after matching existing files are verified.

Pass the user's arguments after the subcommand. Do not replace the bundled CLI with ad hoc file operations. Stop and report a non-zero exit status.