# Changelog

The pattern lists in `references/` are a living catalogue, not a fixed rulebook. AI writing tells drift as models change, so additions, changes, and retirements are dated here. When a tell fades from current model output, mark it as legacy in the reference rather than deleting it, so the skill still catches older drafts.

## 2026-09-01, research refresh

Eight commits from a survey of the 2026 humaniser and anti-slop skills, the 2025 to 2026 corpus and detector research, writing-craft sources, and vendor prompting guidance. Sources are listed in `references/sources.md`. The trigger was reading the skill's own eval outputs: two rewrites had invented content and one had contracted a writer's "I have" on a keep-my-voice brief, and the checker saw none of it.

### Added

- `SKILL.md` step 4: subtract and surface, never add, with the classes named (next steps, claims about what has happened since, jokes in the writer's manner, sensory detail, typos, slang, contractions). Guardrails against invented baselines and silent fact-correction. Rewrite rules restated as targets with an example each. In-place file editing keeps code, front matter, tables, links, and quotes byte for byte.
- `references/voice-and-context.md`: voice calibration as a before, during, after procedure with a measured profile and a preserve list; a sentence-craft section (old before new, stress position, cohesion, proportion, connectors only where order fails, talk test, curse of knowledge); register markers per medium; a chat register.
- `references/preflight.md`: outline test, proportion count, uniform-confidence check, a voice check for keep-my-voice briefs, a per-sentence pass, restraint in the taste check. The reshuffle test now fixes order instead of adding connectives.
- `references/ai-writing-patterns.md`: speculation from absence, vague connection, process narration, sentence length, mannered prose, heading restated by its first sentence, summary-shaped and paired headings, document skeleton tells, hyphenated pairs; new leak artefacts (Gemini, Perplexity, DeepSeek, wikitext), non-resolving citations, and humaniser residue as near-conclusive classes.
- `references/structures-and-phrases.md`: casual-register signposting, invented baselines, "X rather than Y", aphorism budget, pull-quote test, stating the moral, shadowboxing, phantom alternatives, editorial scar tissue.
- `references/genre-tells.md`: social-post tells (role openers, hashtag stacks, thread markers, exclamation and ellipsis habits) and a fiction section from the Antislop and StoryScope data.
- `evals/run_skill.py`: an added-claims judge (one listed claim fails the fixture; validated against all ten known-good examples and the three real inventions) and a `--no-skill` baseline. `evals/compare_outputs.py`: pairwise comparison in both orders, unlabelled. `evals/run_evals.py`: binary-contrast checks on every rewrite and voice-drift metrics (contractions, first person, hedges, word length) for keep-my-voice fixtures. `evals/README.md` explains why detector scores are not a check.

### Changed

- Hedging is split. Performed hesitancy stays a tell; stance hedges, boosters, and intensifiers ("I think", "really", "perhaps", "very") are human signals and are no longer stripped. "in order to" and other wordy constructions move to the human-signal list. "genuinely", "honestly", and "straightforward" join the posture adverbs.
- Dash dependence carries per-model rates: GPT-5.4 below the human baseline, Claude Opus 4.6 and DeepSeek at triple it. Spaced dashes and the scientific-corpus rise are noted. The README's drift note matches.
- Model fingerprints are dated and corrected. Claude is marked by minimal structure, not headers everywhere. Grok and DeepSeek lines added.
- Detector-bias evidence updated to the ACL 2026 study; Liang 2023's 179-essay sample is caveated; the neurodivergent claim is marked reported, not measured.
- Binary contrast is Tier 1 when repeated. Rule of three and the question-answer habit carry their measured rates; a lone rhetorical question is a human signal.
- The launch-email and quarterly-report known-good outputs lose one sentence each that the added-claims judge correctly flagged as an addition.

### Retired

- Nothing retired. The 2023 vocabulary list stays legacy; it is losing power faster as humans adopt the words.

## 2026-09-01

### Added

- `evals/run_skill.py`: runs every fixture through a real model with `SKILL.md` and the references loaded, then checks the rewrites. Before this the harness only checked hand-written outputs, so CI stayed green no matter what the pattern lists said. The README now says so.
- Three well-formedness checks in `evals/run_evals.py` (doubled spaces, space before punctuation, empty clause between punctuation marks). A rewrite that only deleted the banned substrings from `launch-email` passed every check before this.
- Three fixtures: `marketing-copy` (booster verbs and invented-proof bans), `academic-hedge` (a genre exemption that must keep the passive and the hedges), and `linkedin-post` (hook, rhetorical self-answer, aphorism, engagement bait, broetry).

### Changed

- The strict-pass dash policy in `SKILL.md` and `references/ai-writing-patterns.md` no longer offers a colon or parentheses as the replacement, since the catalogue flags the mid-sentence colon. The README and `launch-email` example now end the sentence instead.
- Every heading in the repo is sentence case, matching the catalogue's own rule.
- Negative parallelism in `references/ai-writing-patterns.md` is now a pointer to Binary contrast in `references/structures-and-phrases.md`, which holds the full list. The genre exemptions live only in `references/genre-tells.md`; `references/voice-and-context.md` points there. The "keep in sync" notes are gone with the duplicates.
- The taste check in `references/preflight.md` is yes/no per dimension, with the failing sentence quoted, instead of a 1 to 10 score with a 38 out of 50 threshold.
- The `SKILL.md` description is a third shorter with the same trigger words.
- CI pins Python 3.12 with `actions/setup-python`. `.gitignore` drops the Node entries and ignores `evals/outputs/`.

## 2026-08-19

Additions drawn from `cursor/plugins` (`pstack/skills/unslop`), recorded in `references/sources.md`. Its em-dash, curly-quote, and untiered-wordlist rules were deliberately not adopted; the existing dash policy and confidence tiers stay as they are.

### Added

- "Abstract Metaphor Nouns" in `references/structures-and-phrases.md`: a second jargon table for the technical-sounding register (substrate, wedge, vector, nexus, primitive, north star, flywheel, load-bearing), with the exemption that the literal domain term is correct.
- "Mood Instead of Mechanism" in `references/structures-and-phrases.md`, including the swap test: a sentence that could sit unchanged in another project's copy says nothing about this one. The test also appears in the Specificity Ladder in `references/voice-and-context.md` and in the anti-slop check in `references/preflight.md`.
- "Colon as Connector" in `references/ai-writing-patterns.md`: the mid-sentence colon used as a hinge, flagged as a habit rather than a single instance.
- "Flatness Is Also a Tell" in `references/voice-and-context.md`, plus a matching principle in `SKILL.md`. Removing tells is half the job; the guidance surfaces the position, rhythm, and detail already in the source and still forbids inventing them.
- A backtrack test in `references/preflight.md` and a matching quick rewrite move: split any sentence the reader has to re-read.

### Changed

- The inline-header rule in `references/ai-writing-patterns.md` now identifies redundancy as the tell, not punctuation. "**Performance:** Performance improved" is the pattern; a bold lead-in followed by genuinely new detail is a normal documentation convention and is no longer flagged for ending in a full stop.
- The passive-voice pattern now carries a mechanical detector ("is/are/was/were/been" plus a past participle) and worked examples.
- The adverb list now diagnoses the verb: an adverb propping up a weak verb usually means the verb is wrong.

## 2026-07-02

### Added

- CI (`.github/workflows/ci.yml`): every push and pull request runs `scripts/validate.py` (frontmatter, fixture, and symlink checks) plus the checker self-test against `evals/examples/`.
- `agents/openai.yaml` is now linked into the `skills/better-writing/` tap, and the README documents the tap's symlink caveat for Windows checkouts and ZIP downloads.

### Changed

- The placeholder rule is now consistent across files. A template placeholder the writer forgot to fill (`[Your Name]`) stays a near-conclusive artefact; a deliberate gap marker for a missing fact (`[figure needed from the Q1 report]`) is explicitly allowed in `references/ai-writing-patterns.md`, `references/preflight.md`, and `references/voice-and-context.md`, matching the behaviour the `quarterly-report` fixture rewards.
- `references/genre-tells.md` now points manufactured-insight hooks at Engagement Bait in `references/structures-and-phrases.md`, the section that lists them, instead of Emphasis Crutches.
- The `release-notes` fixture no longer bans the em dash. Its brief asks for a plain technical register, not a strict de-AI pass, and the dash policy only strips dashes when that pass is requested.
- `evals/run_evals.py` reports a missing rewrite in `--all` mode as FAIL rather than SKIP, and treats an explicit zero length ratio as set.

## 2026-06-15

Catalogue refresh informed by 2024–2026 corpus research (Kobak, Liang, Zhao excess-vocabulary studies; the CMU/Reinhart grammar study; the current Wikipedia "Signs of AI writing" catalogue; detector false-positive research).

### Added

- A decision procedure and three confidence tiers in `references/ai-writing-patterns.md`, so "look for clusters, not isolated quirks" is now quantitative.
- A "Near-Conclusive Artefacts" section: leaked tool markup (`oaicite`, `contentReference`, and similar), raw markdown in plain-text destinations, tracking parameters, unedited chatbot scaffolding, and unfilled placeholders. These are hard evidence and need no corroboration.
- A "Nominalisation and Noun Density" pattern, a "Sycophancy" entry (2025-era), and diagnostic-only model fingerprints.
- New stock openers, mechanical transitions, and essay-scaffold closers in `references/structures-and-phrases.md`, plus structures: isn't-just escalation, countdown/tail negation, rhetorical self-answer, over-signposting, false balance, list-itis, fractal recap, invented compound jargon, aphorism formula, meta-commentary joiners, and engagement bait. Each carries a genre exemption.
- A new reference, `references/genre-tells.md`: concrete phrase banks and exemptions for email, social, marketing/SEO, academic, and code/PR/docs.
- Structure checks in `references/preflight.md`: uniform-cadence, paragraph-reshuffle, and friction-free-tone, the last worded to surface existing tone rather than invent it.
- Three eval fixtures: `chatbot-artefacts`, `over-signposting`, and `plain-human` (a false-positive regression that fails if a lone `delve` or em dash is over-edited).

### Changed

- The overused-vocabulary list is now era-stamped and tiered. Spoken-English-only and ordinary-English words that over-flag were removed or demoted to the corpus-only tier.
- The False Positives section now carries the detector equity data (Stanford 61% non-native false-positive rate; retired OpenAI classifier; the Constitution flagged as AI) and states plainly that detector-evasion is a non-goal.
- The em-dash guidance across `SKILL.md`, `references/ai-writing-patterns.md`, and `references/preflight.md` is reframed: the em dash is the least reliable single tell, removal in a strict pass is a register choice, not detector-evasion.

### Marked legacy

- The 2023 GPT-4 vocabulary set (delve, tapestry, testament, intricate, meticulous, pivotal, underscore, realm, showcase) peaked in 2023–early 2024 and is declining as models adapt. It is kept for older drafts, but its absence does not clear a text.
- The standalone model disclaimers ("As an AI language model", "As of my last update") are 2022–2024-era and largely retired; conclusive when present, but their absence proves nothing.

## 2026-06-10

### Added

- Evaluation harness in `evals/`: four fixtures (`launch-email`, `quarterly-report`, `release-notes`, `voice-preservation`), a dependency-free checker, and known-good outputs.
- Before-and-after examples, source comparison table, compatibility notes, and pattern-drift policy in the README.

### Catalogue baseline

All patterns in `references/ai-writing-patterns.md` and `references/structures-and-phrases.md` as of this date form the initial catalogue, synthesised from blader/humanizer, hardikpandya/stop-slop, Leonxlnx/taste-skill, and Wikipedia's "Signs of AI writing". See `references/sources.md` for attribution.

## 2026 (pre-changelog)

- Initial release: `SKILL.md`, references, and OpenAI-compatible agent metadata.
- Dash policy aligned across files; range en dashes exempted from strict de-AI passes.
