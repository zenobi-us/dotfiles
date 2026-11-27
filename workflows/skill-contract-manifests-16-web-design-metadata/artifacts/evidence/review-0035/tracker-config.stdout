---
backend: local-markdown
initiative-root: tracker/initiatives
issue-root: tracker/tickets
---

# Issue tracker: Local Markdown

Local Markdown tickets are the source of truth. GitHub Issues are not the ticket store for these skills.

## Paths

Use the shared-context CLI to resolve every physical path. Ticket and initiative roots are relative to their selected stores.

- Tracker collection: `shared-context resolve tracker --json`.
- Ticket collection: `shared-context resolve tickets --json`.
- Initiative collection: `shared-context resolve initiatives --json`.
- Ticket: `shared-context resolve ticket --id <stable-id> --json`.
- Initiative: `shared-context resolve initiative --id <initiative-id> --json`.

Do not construct paths from `ALIGNMENT_ROOT` or frontmatter roots.

## Ticket operations

Use the `reading-and-writing-tickets` skill for initiative and ticket reads, writes, comments, membership, claims, and completion. Use the `commit` skill for tracker commits. Use `mq-query` for local Markdown content. Claims, reviews, and completion operations apply to executable tickets, not initiative specifications.

Store each ticket at its resolved path. Use a stable ID as the filename. Store the title and sequence in frontmatter. Use these metadata fields: `id`, `title`, `type`, `triage`, `work_status`, `blocked_by`, and `parent` when applicable.

New tickets declare `schema: tracker-ticket/v1`; initiative indexes declare `schema: tracker-initiative/v1`. The ticket skill's shared validator owns field rules. Supported unversioned records remain readable; changing them requires an approved migration. Unknown explicit versions block writes. Use the ticket skill's `check` and `migrate plan/apply/check` operations; do not use storage migration or ad hoc schema edits.

Keep `triage` separate from `work_status`. Triage describes readiness. Work status describes implementation progress. Use the role mapping in [Triage labels](triage-labels.md).

Set `work_status: claimed` before implementation. Set `work_status: completed` only after verification, merge, and push succeed. A local implementation or successful test alone does not complete a ticket.

Append comments and conversation history under `## Comments`. Store review bodies under the resolved workflow's `artifacts/reviews/` directory. Add the verdict and review link to ticket comments.

## Initiatives and wayfinding

A spec is an initiative. Use one directory per resolved initiative. Its `index.md` holds `id` and `title` frontmatter, the complete specification, child ticket links under `## Tickets`, and discussion under `## Comments`. An optional `plan.md` holds execution planning, not a second specification. Publish through the ticket skill's initiative operation; do not create new specification tickets or separate `spec.md` files.

For wayfinding, use the initiative's `plan.md` as the map. Store child tickets at their resolved ticket paths. Set `parent` to the initiative ID and keep the initiative's child links consistent. Verify both through tracker discovery after membership changes. Preserve specification text and discussion.

Existing specification tickets and separate specification files remain readable. Moving them or reparenting their children requires explicit migration approval. A new publication convention does not authorize migration.

Store direct blockers in `blocked_by: [ticket-id, ...]`. Do not maintain a second authoritative reverse edge. Query open, unblocked, and unclaimed child tickets through the ticket skill.

For a resolved decision, append the answer under `## Answer` and link it from the initiative plan. Apply the same completion requirements as other tickets.

