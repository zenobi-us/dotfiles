---
backend: local-markdown
initiative-root: tracker/initiatives
issue-root: tracker/tickets
---

# Issue tracker: Local Markdown

Canonical initiatives and tickets live under `tracker/` beneath the active Matt
Pocock alignment root.

## Conventions

- One initiative per directory under `tracker/initiatives/<initiative-id>/`.
- Use `spec.md`, `plan.md`, and `index.md` inside an initiative when they apply.
- Store each ticket at `tracker/tickets/<stable-id>.md`.
- Use the stable ticket ID as the filename. Put the sequence and title in
  frontmatter.
- Store ticket metadata in YAML frontmatter. The canonical fields are `id`,
  `title`, `type`, `triage`, `work_status`, `blocked_by`, and `parent` when
  applicable.
- Append comments and conversation history under `## Comments`.
- Do not store review bodies under `tracker/`. Worktree reviews live once under
  `workflows/<ticket-id>/artifacts/reviews/`. Add the verdict and artifact link
  to the ticket comments.
- The local Markdown store is the Git repository that contains `issue-root`.
  Use the `reading-and-writing-tickets` skill for all reads and writes. Use the
  `writing-and-creating-git-commits` skill for each tracker commit.

## Path operations

Use the shared-context CLI for every physical path:

- Tracker root: `shared-context path tracker`
- Initiative: `shared-context path initiative --id <initiative-id>`
- Ticket: `shared-context path ticket --id <ticket-id>`

Do not join `ALIGNMENT_ROOT`, `initiative-root`, or `issue-root` by hand.

## Wayfinding operations

Used by `/wayfinder`. The **map** is an initiative with one child file per ticket.

- **Map**: `tracker/initiatives/<effort>/plan.md`.
- **Child ticket**: `tracker/tickets/<stable-id>.md`.
- **Blocking**: store direct blockers in frontmatter as
  `blocked_by: [ticket-id, ...]`. Do not store a second authoritative reverse edge.
- **Frontier**: query open, unblocked, and unclaimed child tickets through the
  `reading-and-writing-tickets` skill.
- **Claim**: set `work_status: claimed` before any work.
- **Resolve**: append the answer under `## Answer`, set the configured completion
  state, and add a context pointer to the initiative plan.
