# Issue Tracker (Local Miniproject)

Issues and PRDs for this repo live as markdown files in `.memory/scratch/`.

## Storage model

- One feature per directory: `.memory/scratch/<feature-slug>/`
- The PRD is `.memory/scratch/<feature-slug>/PRD.md`
- Implementation issues are `.memory/scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Optional triage notes can live beside each issue as frontmatter or a `## Triage` section

## How skills should use it

When creating a PRD:

1. Derive `<feature-slug>` from the problem statement.
2. Create `.memory/scratch/<feature-slug>/PRD.md` if missing.
3. Write or update the PRD in place.

When creating implementation issues:

1. Ensure `.memory/scratch/<feature-slug>/issues/` exists.
2. Create one markdown file per vertical slice.
3. Prefix files with zero-padded sequence numbers (`01`, `02`, ...).
4. Include blockers by filename/path reference when relevant.

When reading issues:

1. Read the PRD first for context.
2. Read issue files in numeric order.
3. Treat the local files as the source of truth (no external API calls).

## Issue template guidance

Each issue file SHOULD include:

- `# <title>`
- `## Parent` (path to PRD)
- `## What to build`
- `## Acceptance criteria`
- `## Blocked by` (`None - can start immediately` if none)
- `## Triage` (category + state role mapping used by triage skill)
