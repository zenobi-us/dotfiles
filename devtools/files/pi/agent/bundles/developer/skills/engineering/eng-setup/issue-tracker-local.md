# Issue tracker: Local Markdown

Issues for this repo live as markdown files in `.memory/scratch/issues/`.

## Conventions

- Flat issue storage: one file per issue under `.memory/scratch/issues/`
- Filename format: `<NN>-<slug>.md`, numbered from `01`
- PRD is optional. If used, store it at `.memory/scratch/PRD.md`
- Triage state is recorded as a `Status:` line near the top of each issue file (see `triage-labels.md` for the role strings)
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.memory/scratch/issues/` (create the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.