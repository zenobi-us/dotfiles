---
backend: local-markdown
issue-root: .scratch
review-root: .scratch/<feature-slug>/reviews
---

# Issue tracker: Local Markdown

Issues and specs (you may know a spec as a PRD) live as markdown files in `.scratch/` beneath the active Matt Pocock alignment root.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01` — never a single combined tickets file
- Ticket metadata is stored in YAML frontmatter. The canonical fields are `id`, `title`, `type`, `triage`, `work_status`, `blocked_by`, and `parent` when applicable. See the `reading-and-writing-tickets` skill for the schema and operations
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- Review artifacts are stored at `.scratch/<feature-slug>/reviews/<NN>-<issue-slug>.md`
- The review artifact records the ticket path, source branch, base branch, commit, validation, findings, verdict, and timestamp
- The local Markdown store is the Git repository that contains `issue-root`. When it is a Git repository, commit all changed Markdown files in the local issue store before starting issue work. Use the `reading-and-writing-tickets` skill for this operation and the `writing-and-creating-git-commits` skill for the commit

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Git operations

Use the `reading-and-writing-tickets` skill for local Markdown reads and writes. It owns the preflight, schema, review path, completion operation, and tracker-specific commit rules. Use the `writing-and-creating-git-commits` skill for every tracker or review commit.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` — the Notes / Decisions-so-far / Fog body.
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with ticket metadata in frontmatter and the question in the body. Use `type: research`, `prototype`, `grilling`, or `task`.
- **Blocking**: store direct blockers in frontmatter as `blocked_by: [ticket-id, ...]`. Do not store a second authoritative reverse edge.
- **Frontier**: use the `reading-and-writing-tickets` skill to query open, unblocked, and unclaimed child tickets.
- **Claim**: use the `reading-and-writing-tickets` skill to set `work_status: claimed` before any work.
- **Resolve**: use the `reading-and-writing-tickets` skill to append the answer under `## Answer` and set the configured completion state. Append a context pointer to the map's Decisions-so-far in `map.md`.
