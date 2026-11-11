# Report contract

Each research subagent writes one Markdown file at `<RUN_DIR>/reports/<KEY>.md`. The file has YAML frontmatter and five sections, in this order. `scripts/grooming-report.ts check` enforces this contract.

## Frontmatter

```yaml
---
ticket: ABC-123
title: Order summary shows wrong total
url: https://tracker.example.com/ABC-123
verdict: groomed            # groomed | clarify | cancel | action
story_points: 3             # required when verdict is groomed
action: split               # required when verdict is action; one or two words
comment: One line for the summary.   # required when verdict is cancel or action
proposed_actions:
  - id: estimate
    kind: estimate          # comment | estimate | update | transition | link | create | label
    summary: Story points 3.
    detail: The fix is in one resolver and one test. No unknowns remain.
---
```

- `ticket`, `title`, and `verdict` are always required.
- `url` is optional.
- `proposed_actions` may be empty. Each `id` must be unique in the file.
- An `estimate` action does not choose how the points are applied. The parent asks the user to set them or propose them in a comment. Put the full reason in `detail`.
- A `clarify` report has its question count taken from the **Clarifications required** section. Do not write it in the frontmatter.

## Sections

Write the sections with these exact `##` headings.

1. `## Next action` — one or two sentences that say what should happen next and who should do it.
2. `## Story points` — the number and one to three sentences of reason, or "Not sized" and the reason. The parent can post this text on the ticket as a proposal comment.
3. `## Clarifications required` — a numbered list of questions. Each question names who can answer it. Write "None." when there are none.
4. `## Things to be aware of` — a bulleted list of risks, dependencies, affected components, test gaps, and feature flags.
5. `## Claims` — a table with the columns `Claim`, `Method`, `Result`, and `Evidence`. `Result` is `confirmed`, `refuted`, `unclear`, or `not checked`.

## Writing rules

- Follow the `iso-24495-1` skill: short sentences, active voice, one term for one concept.
- Put the answer first in each section.
- Keep code, paths, identifiers, and quoted errors unchanged, in backticks.
- Cite evidence as `path/to/file.ts:42`, a commit hash, a command with its key output line, or a capture path relative to the run directory, such as `evidence/ABC-123/error.png`.
- Show a screenshot inline with `![What it shows](evidence/<KEY>/<file>.png)`.
