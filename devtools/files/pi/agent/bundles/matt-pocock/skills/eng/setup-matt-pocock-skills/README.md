Quickstart:

```bash
npx skills add mattpocock/skills --skill=setup-matt-pocock-skills
```

```bash
npx skills update setup-matt-pocock-skills
```

[Source](https://github.com/mattpocock/skills/tree/main/skills/engineering/setup-matt-pocock-skills)

## What it does

`setup-matt-pocock-skills` configures how the engineering skills behave for one Git origin — where alignment files live, where issues live, what triage labels are called, and where domain docs sit.

It writes config, it does not hard-code behaviour. The engineering chain assumes three files under `docs/agents/` exist beneath the active alignment root. That root can be the repository or `~/.pi/shared-context/<origin-slug>/`, supplied by the bundled extension.

## When to reach for it

You invoke this by typing `/setup-matt-pocock-skills` — the agent won't reach for it on its own.

Reach for it **once per Git origin, before the first use of any other engineering skill**. Re-run it only to change storage or tracker policy. Day-to-day tweaks are edits to `docs/agents/*.md` beneath the selected alignment root.

## The four decisions

Setup collects four related choices:

- **Alignment storage** — repository-local or origin-keyed shared context outside the repository.
- **Issue tracker** — GitHub, GitLab, local Markdown beneath the alignment root, or another documented workflow.
- **Triage labels** — tracker strings behind the five canonical workflow roles.
- **Domain docs** — single-context or multi-context layout beneath the alignment root.

The output is three files — `docs/agents/issue-tracker.md`, `docs/agents/triage-labels.md`, `docs/agents/domain.md` — plus an `## Agent skills` block. Setup can store them in the repository or beneath the origin-keyed directory injected by the Matt Pocock shared-context extension. Those files are the shared substrate the rest of the toolkit stands on.

## It's working if

- Three files land under `<alignment-root>/docs/agents/`.
- Repository mode updates repository `CLAUDE.md` or `AGENTS.md`; shared mode updates shared `AGENTS.md` and leaves repository instructions untouched.
- `/matt-context` reports the expected origin, slug, root, and storage.
- `triage` and `to-issues` act on the configured tracker without guessing.

## Where it fits

`setup-matt-pocock-skills` is a **run-once setup** — the foundation the whole engineering set stands on, not a step you repeat. Its neighbours are the skills that read what it writes: [triage](https://aihero.dev/skills-triage), because it applies the label vocabulary configured here, and [to-prd](https://aihero.dev/skills-to-prd) / [to-issues](https://aihero.dev/skills-to-issues), because they publish into the issue tracker configured here. Run it first; everything downstream assumes it has. When you're unsure which skill or flow fits, [ask-matt](https://aihero.dev/skills-ask-matt) routes you.
