<div align="center">

# Better Writing

An agent skill for prose that sounds clear, specific, and human.

[![Agent Skill](https://img.shields.io/badge/agent%20skill-better--writing-2563eb?style=for-the-badge)](./SKILL.md)
[![License: MIT](https://img.shields.io/badge/license-MIT-111827?style=for-the-badge)](./LICENSE)
[![skills.sh](https://skills.sh/b/forjd/better-writing)](https://skills.sh/forjd/better-writing)

</div>

## What it is

Better Writing is an agent skill for rewriting, drafting, and reviewing prose. Most de-slop skills delete AI tells and converge everything toward one generic "casual human" register. This one adds what those skip:

1. **The writer's voice.** A user-provided writing sample is the style source of truth, and per-genre dials (directness, warmth, density, polish) replace blanket rules. A board memo and a personal essay get different treatment.
2. **Specificity without invention.** "Make it concrete" prompts tempt models into fabricating numbers, anecdotes, and named experts. The guardrails and pre-flight preservation check forbid that: missing facts become placeholders or questions, never inventions.
3. **Context beats blanket rules.** The same dash, hedge, or formal phrase can be a tell in one genre and correct in another. The audit looks for clusters of tells, with an explicit false-positive list so polished human writing survives the pass.

On top of that, it does the expected job well:

- AI-sounding patterns such as significance inflation, vague attribution, promotional padding, and formulaic conclusions
- slop structures such as throat-clearing, binary contrast, false agency, over-signposting, and manufactured drama
- confidence tiers and a near-conclusive-artefact check, so a single quirk never triggers an edit but leaked tool markup or an unfilled `[Your Name]` placeholder does
- a final pre-flight check before delivery

It also ships with an [evaluation harness](./evals/): fixtures seeded with known tells and known facts, a checker, and a runner that sends each fixture through a real model with the skill loaded.

## Before and after

Real input, real output, no cherry-picked single sentences. These pairs double as test fixtures in [evals/fixtures/](./evals/fixtures/).

### A launch email, de-slopped

Before:

> I hope this email finds you well! We're thrilled to announce the launch of our groundbreaking new analytics dashboard, which goes live on Monday 15 June. This isn't just an update — it's a game-changer designed to transform your workflow. The dashboard replaces the weekly CSV export, and data now refreshes every hour instead of every seven days, empowering you to unlock deeper insights across teams, projects, and date ranges. To get started on this exciting journey, simply navigate to the Reports tab after logging in. Exciting times lie ahead!

After:

> The new analytics dashboard goes live on Monday 15 June. It replaces the weekly CSV export. Data refreshes every hour instead of every seven days, and you can filter by team, project, or date range. Log in and open the Reports tab to try it.

Every fact survived (the date, the CSV export, the hourly refresh, the Reports tab). Everything else went.

### A report paragraph, made specific without inventing anything

Before:

> It is important to note that customer churn has become a significant challenge in today's competitive landscape, rising for the second consecutive quarter. Some internal observers suggest the March pricing change and onboarding drop-off may have contributed, underscoring the need for a proactive retention strategy moving forward. The implications are significant.

After:

> Churn rose for the second quarter in a row [figure needed from the Q1 report]. Two causes have been flagged internally: the March pricing change and onboarding drop-off. Both point to the need for a retention plan.

Note the placeholder. The skill will not invent a churn figure to make the paragraph sound concrete. If the figure exists in the source material, it goes in; if not, the gap is marked honestly.

### A writer's draft, edited without flattening

Writer's draft:

> I have rewritten this parser three times now, which is either dedication or a cry for help. Version three finally handles nested quotes, escaped backslashes, and the cursed Windows-1252 em dash that started this whole saga. I am not proud of the regex. It works.

What a generic humaniser pass produces:

> After several iterations, the parser now robustly handles nested quotes, escaped backslashes, and Windows-1252 em dashes.

What this skill does: nothing. The draft has a voice, the details are specific, and "a cry for help" is a defendable quirk, not a tell. The skill's job here is to recognise that and leave it alone.

## When to use it

Use this skill when an agent needs to improve:

- emails and messages
- essays, posts, and opinion drafts
- reports, proposals, and memos
- documentation and release notes
- marketing copy and product copy
- UI text and microcopy
- any draft that sounds too generic, verbose, evasive, salesy, or AI-written

## Installation

The [skills.sh CLI](https://www.skills.sh/docs/cli) is the easiest way to install the skill.

With `npx`:

```bash
npx skills add forjd/better-writing
```

With `bunx`:

```bash
bunx skills add forjd/better-writing
```

You can also install from the full GitHub URL:

```bash
npx skills add https://github.com/forjd/better-writing
bunx skills add https://github.com/forjd/better-writing
```

For local development, install from this checkout:

```bash
npx skills add /path/to/better-writing
bunx skills add /path/to/better-writing
```

The CLI collects anonymous install telemetry by default. To opt out:

```bash
DISABLE_TELEMETRY=1 npx skills add forjd/better-writing
DISABLE_TELEMETRY=1 bunx skills add forjd/better-writing
```

You can also copy the folder into your agent skills directory if your agent runtime supports local skill discovery.

## Usage

Invoke it explicitly:

```text
Use $better-writing to rewrite this launch email so it sounds direct, warm, and less AI-written.
```

Or ask for the behaviour naturally:

```text
Humanise this draft without making it casual. Keep the legal caveats intact.
```

```text
Review this landing-page copy for generic AI writing and give me a sharper version.
```

```text
Use my writing sample below as the voice reference, then rewrite the article intro.
```

## What is inside

| Path | Purpose |
| --- | --- |
| [SKILL.md](./SKILL.md) | Core skill instructions and metadata. |
| [agents/openai.yaml](./agents/openai.yaml) | UI metadata for compatible agent clients. |
| [references/ai-writing-patterns.md](./references/ai-writing-patterns.md) | AI-writing tells, confidence tiers, near-conclusive artefacts, and false-positive checks. |
| [references/preflight.md](./references/preflight.md) | Final quality checks before delivery. |
| [references/sources.md](./references/sources.md) | Source projects and attribution notes. |
| [references/structures-and-phrases.md](./references/structures-and-phrases.md) | Slop phrase and structure audit. |
| [references/genre-tells.md](./references/genre-tells.md) | Genre-specific phrase banks for email, social, marketing, academic, fiction, and code. |
| [references/voice-and-context.md](./references/voice-and-context.md) | Audience, genre, dials, voice calibration, and genre exemptions. |
| [evals/](./evals/) | Fixture texts, a checker with voice-drift metrics, a model runner with an added-claims judge, and a pairwise comparison against a no-skill baseline. |
| [skills/better-writing/](./skills/better-writing/) | Tap layout for managers that expect `skills/<name>/`; relative symlinks back to the root files. |
| [scripts/validate.py](./scripts/validate.py) | Repo checks run by CI: frontmatter, fixtures, symlinks. |
| [CHANGELOG.md](./CHANGELOG.md) | Dated history of the pattern catalogue. |

`SKILL.md` stays concise so agents can load it quickly. The detailed audit material lives in `references/` and is loaded only when needed. The `evals/` directory is repo tooling; agents do not load it.

## Design principles

- Specific beats impressive.
- Direct beats announced.
- Context beats blanket rules.
- Voice beats cleanliness.
- Evidence beats authority theatre.
- Trust the reader.

## Validation

CI runs two dependency-free checks on every push and pull request:

```bash
python3 scripts/validate.py                      # frontmatter, fixture, and symlink checks
python3 evals/run_evals.py --all evals/examples  # checker self-test
```

Neither exercises a model. The self-test proves the checker agrees with the hand-written known-good outputs, nothing more. To test the skill itself, run the model runner described under Evaluation; it needs credentials, so it is not part of CI.

You can also validate the skill with the checker from Anthropic's [skill-creator](https://github.com/anthropics/skills/tree/main/skills/skill-creator) skill:

```bash
git clone https://github.com/anthropics/skills.git
python3 skills/skills/skill-creator/scripts/quick_validate.py /path/to/better-writing
```

This checks the required skill metadata and naming rules.

## How it differs from its influences

Better Writing started as a synthesis of three skills and one reference page. Each contributed something worth keeping, and each had a gap this skill closes.

| Source | What we kept | What we changed |
| --- | --- | --- |
| [blader/humanizer](https://github.com/blader/humanizer) | The AI-pattern taxonomy and the caution about false positives. | Added genre dials so the fixes are not one-size-fits-all, and an eval harness so the pattern list is testable. |
| [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | The structural audits: throat-clearing, binary contrast, false agency. | Added voice calibration so removing slop does not flatten the writer into a house style. |
| [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Context-first brief reading and explicit quality dials. | Added factual guardrails and a preservation check, so taste decisions never license invented specifics. |
| [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) | The observed-in-the-wild pattern catalogue. | Reorganised for agent use and dated in the [changelog](./CHANGELOG.md) so the list can drift as models do. |

See [references/sources.md](./references/sources.md) for fuller source notes.

## Evaluation

Pattern lists are easy to break: one well-meaning edit and the skill starts flagging human writing or missing a new tell. The [evals/](./evals/) directory holds ten fixture texts seeded with known tells and known facts, a dependency-free checker that verifies a rewrite removed the tells *and* kept the facts, and a runner that produces the rewrites with a real model.

```bash
python3 evals/run_skill.py                                          # run every fixture through claude-opus-5, check, then judge for added claims
python3 evals/run_evals.py evals/fixtures/launch-email my-rewrite.md  # check a rewrite you produced some other way
python3 evals/run_skill.py --no-skill --no-judge --out evals/baseline # the same briefs with no skill loaded
python3 evals/compare_outputs.py evals/baseline evals/outputs         # pairwise judge, both orders, unlabelled
```

The runner needs the Claude Code CLI on PATH with working credentials. Run it before and after any change to `SKILL.md` or the references and compare the two reports. The added-claims judge exists because the substring checker cannot see invention; a rewrite that added "nobody has asked to bring the stand-up back" to the LinkedIn fixture passed every substring check. The baseline and pairwise comparison exist because a pass count cannot show the skill beat the unaided model.

The checker is a smoke test, not a judge. It matches substrings, bounds the length, rejects the damage a search-and-replace leaves behind (doubled spaces, space before punctuation), catches binary-contrast scaffolds, and on keep-my-voice fixtures measures whether contractions, first person, hedges, and word length moved. A rewrite can pass it and still read badly, so read the outputs in `evals/outputs/` as well as the pass counts. Detector scores are deliberately not a check; `evals/README.md` says why. See [evals/README.md](./evals/README.md) for the fixture list and check format.

## A living pattern catalogue

AI tells drift. "Delve" and "tapestry" marked 2023-era output; "it's not just X, it's Y" marks 2025-era output across vendors, while dash dependence now marks Claude and DeepSeek but not GPT-5. The pattern lists in `references/` are treated as a dated catalogue, not a fixed rulebook:

- The vocabulary list is era-stamped and tiered, so the skill leans on cluster density and structure rather than any single word. Distinctive markers, common-but-overused words, and ordinary English that only shows up across a corpus are flagged differently.
- Additions, changes, and retirements are dated in [CHANGELOG.md](./CHANGELOG.md).
- Patterns that fade from current model output get marked as legacy rather than deleted, so the skill still catches older drafts.
- The false-positive guardrails carry the detector-bias evidence (non-native over-flagging measured across 16 detectors in 2026; neurodivergent over-flagging widely reported but not yet measured), and the `plain-human`, `voice-preservation`, and `academic-hedge` evals fail if the skill over-edits clean prose. Detector-evasion is explicitly a non-goal.
- Pull requests adding newly observed tells are welcome. Bring at least one real example and a false-positive note.

## Compatibility

The skill follows the standard agent-skill layout (`SKILL.md` plus lazily loaded `references/`), so it works in any runtime that discovers skills by folder:

- **Claude Code**: tested; install via skills.sh or copy into your skills directory.
- **OpenAI-compatible clients**: [agents/openai.yaml](./agents/openai.yaml) provides display metadata and allows implicit invocation.
- **Other runtimes**: anything that reads `SKILL.md` frontmatter will pick it up; the references are plain Markdown loaded on demand.

The `skills/better-writing/` directory is a tap layout for managers that expect `skills/<name>/`. It is built from relative symlinks back to the root files, which survive `git clone` but not GitHub's Download ZIP or a Windows checkout without symlink support. In those cases install from the repo root, which is the canonical copy.

## Contributing

Keep the skill lean. Put core workflow guidance in [SKILL.md](./SKILL.md), and move detailed pattern lists or examples into [references/](./references/).

Before opening a pull request:

1. Run `python3 scripts/validate.py`. CI runs it on every pull request as well.
2. Run `python3 evals/run_skill.py` before and after the change if you touched the pattern lists or `SKILL.md`, and say in the pull request what changed in the two reports.
3. Date any pattern addition, change, or retirement in [CHANGELOG.md](./CHANGELOG.md).
4. Check that new prose uses British English and sentence-case headings. The repo's own docs follow the catalogue.
5. Avoid adding bulky documentation that the agent does not need.
6. Keep examples factual, concise, and easy to audit.

## Licence

MIT licence. Copyright (c) 2026 Forjd.
