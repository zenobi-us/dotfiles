# Issue tracker: `.memory/` via `miniproject`

Issues, planning, and execution tracking for this repo live in `.memory/` and are managed with the `miniproject` skill.

## Source of truth

- Memory directory: `.memory/`
- Tracker model: Markdown artifacts (`idea-*`, `epic-*`, `story-*`, `task-*`, `research-*`, `learning-*`)
- Operational index files: `.memory/todo.md`, `.memory/summary.md`, `.memory/roadmap.md`, `.memory/team.md`

## Required workflow

1. Resolve memory dir first:
   - `./bundles/business/skills/projectmanagement/miniproject/scripts/miniproject.sh memory-dir`
2. If needed, initialise files via `miniproject INITIALISE` behavior.
3. Treat `.memory/todo.md` as live task queue, use `miniproject.sh` to keep it up to date.

## When a skill says “publish to issue tracker”

Create or update the relevant `.memory/*.md` artifact instead of creating a GitHub issue.

## When a skill says “fetch ticket/issue”

Read the referenced `.memory/*.md` artifact and related links from `.memory/todo.md` / `.memory/roadmap.md`.

## Notes

- Do not use `.scratch/` for issue tracking in this repo.
- Use markdown links for all planning artifact references.
