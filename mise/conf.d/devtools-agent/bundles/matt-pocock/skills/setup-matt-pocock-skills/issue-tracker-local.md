---
backend: local-markdown
initiative-root: tracker/initiatives
issue-root: tracker/tickets
---

# Issue tracker: Local Markdown

The frontmatter uses the default layout. Replace these relative roots when the
project uses configured paths, such as `docs/tracker/initiatives` and
`docs/tracker/tickets`. The ticket and initiative routes select their stores
independently. Use shared-context to resolve their exact paths.

## Conventions

- One initiative per directory returned by `resolve initiative --id <initiative-id>`.
- Use `spec.md`, `plan.md`, and `index.md` inside an initiative when they apply.
- Store each ticket at the path returned by `resolve ticket --id <stable-id>`.
- Use the stable ticket ID as the filename. Put the sequence and title in
  frontmatter.
- Store ticket metadata in YAML frontmatter. The canonical fields are `id`,
  `title`, `type`, `triage`, `work_status`, `blocked_by`, and `parent` when
  applicable.
- Append comments and conversation history under `## Comments`.
- Store review bodies outside the tracker collection. Worktree reviews live once under
  `workflows/<ticket-id>/artifacts/reviews/`. Add the verdict and artifact link
  to the ticket comments.
- The local Markdown store is the Git repository that contains `issue-root`.
  Use the `reading-and-writing-tickets` skill for all reads and writes. Use the
  `writing-and-creating-git-commits` skill for each tracker commit.

## Path operations

Use the shared-context CLI for every physical path:

- Tracker collection: `shared-context resolve tracker --json`
- Ticket collection: `shared-context resolve tickets --json`
- Initiative collection: `shared-context resolve initiatives --json`
- Initiative: `shared-context path initiative --id <initiative-id>`
- Ticket: `shared-context path ticket --id <ticket-id>`

Do not join `ALIGNMENT_ROOT`, `initiative-root`, or `issue-root` by hand.

## Wayfinding operations

Used by `/wayfinder`. The **map** is an initiative with one child file per ticket.

- **Map**: `plan.md` inside the resolved initiative directory.
- **Child ticket**: the file returned by `resolve ticket --id <stable-id>`.
- **Blocking**: store direct blockers in frontmatter as
  `blocked_by: [ticket-id, ...]`. Do not store a second authoritative reverse edge.
- **Frontier**: query open, unblocked, and unclaimed child tickets through the
  `reading-and-writing-tickets` skill.
- **Claim**: set `work_status: claimed` before any work.
- **Resolve**: append the answer under `## Answer`, set the configured completion
  state, and add a context pointer to the initiative plan.
