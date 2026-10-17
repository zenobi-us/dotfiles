# Playbook: tasks

Print the dependency tree for a tracker ticket, epic, spec, or initiative. This playbook reads tracker data only. It does not create worktrees or change tickets.

## Resolve project context

1. Load `agent-core:shared-context` for the repository being worked on. Run its CLI from that repository. Use the reported alignment `root` as `ALIGNMENT_ROOT`, and retain its `mode`, route table, and `repository-root`. Do not derive these values.
2. Read `<ALIGNMENT_ROOT>/docs/agents/issue-tracker.md` and identify the configured backend. Load `references/issue-tracker.md` and the `reading-and-writing-tickets` skill. Apply that skill's routing procedure and use its matching task and store references.
3. Confirm the shared-context ticket route agrees with the configured backend. Stop and report a mismatch or missing tracker operation.

## Build the dependency tree

Use `scripts/dep-tree-cli.ts` from the loaded `reading-and-writing-tickets` skill. For Markdown, pass the explicit `repository-root` reported by shared-context. For external trackers, use the configured tracker selector. Do not pass the alignment or tracker root as a repository root.

- `local-markdown`: use `markdown <repository-root> --ticket <ID>` when the request names a ticket, or `markdown <repository-root> --initiative <ID>` for an initiative. Load `agent-core:mq-query`, its matching task procedure, the required upstream reference, and the configured Markdown store procedure before running the CLI. The CLI uses `mq` to read the initiative index and ticket frontmatter.
- `github`: use `github <OWNER/REPO> --ticket <ID>` for a ticket or `github <OWNER/REPO> --spec <ID>` for a spec/map. Get the repository from `docs/agents/issue-tracker.md`, not from a guess.
- `jira`: use `jira --ticket <KEY>` for a ticket or `jira --epic <KEY>` for an epic. Load the `twg` router and `twg-jira` skill required by the Jira store procedure.

If the user supplies no ticket ID, offer valid roots before asking for a choice:

- For `local-markdown`, run the initiative-list query below and show each initiative ID. Then ask which initiative to graph. Do not query all tickets or choose a root implicitly. If no initiatives exist, ask for a ticket ID and report that the tracker has no initiative indexes.
- For `github` or `jira`, do not list every spec or epic unless the tracker config defines a bounded, supported listing operation. Ask for a spec/map or epic ID instead; never invent a query or select a root implicitly.

### List local Markdown initiatives

After loading `agent-core:mq-query`, its matching task procedure, required upstream reference, and the configured Markdown store procedure, run `shared-context resolve initiatives --json`. Set `INITIATIVES_ROOT` to its returned `path`. Run this query against that exact collection:

```bash
mq --allow-http-import --allow-read="$INITIATIVES_ROOT" --args root "$INITIATIVES_ROOT" -I null -F json '
  import "github.com/harehare/okf.mq" |
  map(
    walk_files(root, "*/index.md"),
    fn(file): { path: file };
  )
'
```

Extract the initiative ID from each returned path matching `<ID>/index.md` relative to the resolved collection. Display the IDs as the available initiatives. Do not use filesystem commands or derive an alternate tracker path. An empty result means no initiative index files were found.

Run the graph command and return its rendered tree. Report errors and coverage limits as given; do not treat missing blocker records as an empty result. The CLI follows direct blocker relationships from the selected initiative/epic/spec roots.
