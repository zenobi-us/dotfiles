# Ticket-owned setup CLI

The ticket skill owns this CLI and its assets. The user-facing setup skill delegates execution through [Setup playbook](../tasks/setup.md).

## Commands

```text
setup.ts plan TARGET --answers FILE [--templates DIR] [--shared-context FILE] [--json]
setup.ts init TARGET --answers FILE [--templates DIR] [--shared-context FILE] [--dry-run] [--json]
setup.ts check TARGET [--shared-context FILE] [--json]
```

Resolve the installed `reading-and-writing-tickets` directory as `TICKET_SKILL_ROOT`. Invoke `$TICKET_SKILL_ROOT/scripts/setup.ts` by absolute path from the target repository. `TARGET` must be a Git repository with an origin remote.

`plan` and `init --dry-run` do not change the target. `init` recomputes the plan, stops before writes when a conflict exists, applies file replacements atomically, and checks the result. `check` reads the saved state and verifies managed content and current tracker resolution. No command prompts, changes storage routes, imports issues, commits, or pushes.

## Answers

```yaml
schema: 1
tracker_backend: local-markdown
domain_mode: single
triage_enabled: true
```

Use `instruction_file: AGENTS.md` or `instruction_file: CLAUDE.md` only when neither instruction file exists. Existing repository instructions take precedence; shared alignment uses `AGENTS.md`.

Use `domain_mode: multi` with `domains: [billing, ordering]` for multiple contexts. Domain IDs use lowercase letters, numbers, and dashes. Setup records navigation, not domain definitions.

Override triage values with a `triage_labels` mapping keyed by `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. Values must be distinct non-empty strings.

Unknown answer keys and backend/route mismatches are errors. The shared-context resolver owns storage and collection paths. Preserve existing `docs/agents/context-layout.toml` and local tracker frontmatter roots. Configure or migrate routes separately before setup when the tracker adapter must change.

The shared-context CLI does not resolve file-backed tracker paths for external adapters. Setup reads the reported adapter first and resolves collections only for Local Markdown.

When new shared instructions would hide a repository-local route manifest, the plan includes an identical manifest in the shared alignment store. This preserves existing routes; it does not select new stores. The copy appears in the exact plan and setup state. Existing shared manifests remain authoritative.

## Templates and state

`--templates` defaults to this skill's `assets/` directory, independent of the working directory. It must contain `copier.yml` and a tree with the staging groups below. Copier 9.15.1 renders the tree through `uvx --from copier==9.15.1 copier copy --defaults --skip-tasks`. Executable template features remain untrusted.

| Staging group | Destination |
|---|---|
| `alignment` | Resolved alignment root |
| `fragments/agent-skills.md` | Setup-owned subsections of the selected instruction file |
| `tracker` | Resolved local tracker collection; omitted for external backends |
| `adr/index.md` | Resolved ADR index |
| `workflows` | Resolved workflow area, when it exists |
| `initiatives/index.md` | Each existing initiative's resolved index |

The CLI supplies normalized answers, store-relative collection roots, origin, and lists of existing records. Cross-store navigation uses the resolver's stable references as text, rather than fragile relative links between stores. Templates contain all generated document prose. File ordering and output are stable; no timestamps enter generated state.

`docs/agents/setup-state.json` records effective answers, template hash, Copier version, and managed-content hashes. It is the only persistent setup state. Do not copy Copier staging answers into the target.

## Authored content

Setup owns complete generated configuration files and marked regions in instruction files and indexes:

```html
<!-- matt-pocock:setup start -->
<!-- matt-pocock:setup end -->
```

On first adoption, setup replaces only the Issue tracker, Triage labels, and Domain docs subsections inside `## Agent skills`. It preserves unrelated subsections and instructions. If the section does not exist, setup adds it.

An existing configuration file must match the rendered bytes to be adopted without state. An authored index without markers is a conflict. After approval, place markers around only the index region that setup may replace, or preserve the authored file elsewhere. Setup preserves text outside a managed region and rejects edits inside it. It rejects malformed markers, template symlinks, and destination symlink escapes.

## Output

Human output shows routes and file actions. Plans show exact before/after content. `--json` writes one structured result to stdout, including `command`, `target`, `alignmentRoot`, `routes`, `changes`, and `errors`. Each change has `path`, `action`, `before`, and `after`; a conflict also has `reason`. Diagnostics go to stderr. Error-only results contain `error` and `code`.

| Code | Meaning |
|---|---|
| 0 | Successful operation |
| 1 | Runtime or filesystem failure |
| 2 | Invalid arguments, answers, or backend/route mismatch |
| 3 | Existing-content conflict |
| 4 | Failed configuration check |

Use `--help` for discovery and `--version` for the wrapper version. No shell completion installation is required for this three-command skill-local CLI.




