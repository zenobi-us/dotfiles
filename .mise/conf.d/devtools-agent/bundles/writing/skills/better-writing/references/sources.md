# Sources

This skill is a new synthesis informed by these public sources:

- `blader/humanizer`: https://github.com/blader/humanizer
  AI-writing pattern taxonomy, voice calibration, false-positive caution, and draft-audit-final loop.
- `hardikpandya/stop-slop`: https://github.com/hardikpandya/stop-slop
  Sharper anti-slop checks for throat-clearing, binary contrast, false agency, filler phrases, and rhythm.
- `Leonxlnx/taste-skill`: https://github.com/Leonxlnx/taste-skill
  Context-first brief reading, explicit quality dials, anti-default discipline, and pre-flight matrices.
- `cursor/plugins` (`pstack/skills/unslop`): https://github.com/cursor/plugins/blob/main/pstack/skills/unslop/SKILL.md
  Abstract metaphor nouns, the mechanism-not-mood rule and its swap test, colon-as-connector, the redundancy reading of inline-header bullets, and the reminder that voiceless prose is its own tell.
- `Wikipedia:Signs of AI writing`: https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing
  Observed patterns in AI-generated prose, especially significance inflation, vague attribution, promotional tone, formulaic structure, and overused vocabulary.

## Corpus and detection research (2023–2025)

These informed the 2026-06-15 refresh: confidence tiers, era stamping, the nominalisation and present-participle patterns, and the false-positive guardrails.

- Kobak et al., "Delving into LLM-assisted writing in biomedical publications through excess vocabulary": https://arxiv.org/abs/2406.07016
  Measured excess word usage across over 15M PubMed abstracts (2010–2024); the source of the "delve" and excess-vocabulary evidence.
- Juzek and Ward, "Why Does ChatGPT 'Delve' So Much? Exploring the Sources of Lexical Overrepresentation in LLMs", COLING 2025: https://arxiv.org/abs/2412.11385
  Tested and rejected the Nigerian-English hypothesis for "delve"; the basis for treating it as an RLHF artefact rather than a dialect marker.
- Liang et al., "Mapping the Increasing Use of LLMs in Scientific Papers": https://arxiv.org/abs/2404.01268
  Corpus estimate of LLM-modified text across arXiv, bioRxiv, and Nature journals; the realm/intricate/showcasing/pivotal vocabulary cluster.
- Reinhart et al., "Do LLMs write like humans? Variation in grammatical and rhetorical styles", PNAS 2025: https://www.pnas.org/doi/10.1073/pnas.2422455122
  Quantified present-participial clauses at 2–5x and nominalisations at 1.5–2x the human rate; the basis for the nominalisation and noun-density pattern.
- Liang et al., "GPT detectors are biased against non-native English writers", Patterns 2023: https://arxiv.org/abs/2304.02819
  Documented misclassification of non-native English writing; the basis for the false-positive guardrails and the anti-detector-evasion stance.

## 2026-09-01 research refresh

These informed the hedging re-scope, the corrected dash and fingerprint entries, the detector-bias update, and the Tier 1 promotion of binary contrast.

- Jiang and Hyland, "Rhetorical distinctions", English for Specific Purposes 79, 2025.
  ChatGPT essays show significantly less interactional metadiscourse (hedges, boosters, attitude markers) than human essays; the basis for treating stance hedges and intensifiers as human signals.
- Bakhshi, "Saying More Than They Know", arXiv 2604.19768, 2026.
  Tricolons at nearly twice the expert rate, performed hesitancy at twice the human density, rhetorical questions used by humans at more than double the LLM rate.
- Freeburg, "The Last Fingerprint", arXiv 2603.27006, 2026.
  Em dashes per 1,000 words by model (GPT-5.4 1.43, Claude Opus 4.6 9.09, DeepSeek V3 6.95, Gemini 2.5 Pro 3.53, human baseline 3.23 from eight essays).
- Czuma, "Em-ergence of the em-dash", arXiv 2606.29540, 2026.
  Pre-registered medRxiv study: em-dash prevalence in discussion sections rose from 4.23% pre-ChatGPT to 20.3% in 2025.
- Sun et al., "Idiosyncrasies in Large Language Models", ICML 2025.
  Per-vendor lexical fingerprints; Claude marked by minimal structure and less bold than ChatGPT.
- Milička, Marklová, Cvrček, "Benchmark of stylistic variation", arXiv 2509.10179, 2025.
  Biber multidimensional analysis over 16 models: instruction tuning drives the shared tells and models from one vendor do not cluster.
- Stowe et al., "Identifying Bias in Machine-generated Text Detection", ACL 2026.
  16 detectors, about 41,700 essays: English language learners over-flagged, non-white learners more so; human annotators near chance with no bias. Notes Liang 2023 rested on 179 essays.
- Anderson, Galpin, Juzek, AIES 2025, and Matsui, Perspectives on Medical Education, 2025.
  Humans adopting "delve", "meticulous", "underscore" in unscripted speech and medical writing since 2023.
- Rudnicka, Scientific American, July 2025, and iMEdD, January 2026.
  ChatGPT and Grammarly both remove "in order to"; the basis for treating wordy constructions as a human signal.
- Oremus, The Atlantic, July 2026 (via Wikipedia's Negative parallelism entry; not read directly).
  Negative parallelism at about three times the human rate, rising in corporate filings. Second-hand until someone reads the article.
- Anthropic, Claude Fable 5.1 system prompt and prompting guides, 2026: https://platform.claude.com/docs/en/release-notes/system-prompts/claude-fable-5-1
  "genuinely", "honestly", "straightforward" as disingenuous sincerity modifiers; the "mannered prose" definition.
- blader/humanizer v2.10 to v2.11 (2026): https://github.com/blader/humanizer
  Shadowboxing, phantom alternatives, the editorial scar-tissue test (PR #207), speculation from absence, hyphenated pairs, heading restated by its first sentence, casual-register signposting (PR #219).
- asavvin-pixel/unslop (2026): https://github.com/asavvin-pixel/unslop
  Aphorism budget, stating the moral, invented baselines, the outline test, slack, and the observation that cleaned GPT-isms leave uniform confidence and template-shaped structure behind.
- hardikpandya/stop-slop: the pull-quote test.
- Kendro, Maloney, Jarvis, International Journal of Applied Linguistics, 2025 (doi 10.1111/ijal.70115).
  Lexical dispersion as the strongest predictor across six diversity measures; the close-repetition-avoidance habit strengthens in newer ChatGPT versions.
- Gude et al., "More Aligned, Less Diverse?", arXiv 2605.06030, 2026.
  2025 instruction-tuned models write sentences 15 to 30% longer than humans and over-use nominal modification and participial phrases.
- Russell et al., "StoryScope", arXiv 2604.03136, 2026.
  61,608 stories: AI stories state the moral (77% vs 52%) and render emotion through body metaphor (81% vs 38%).
- Masrour, Emi, Spero, "DAMAGE", GenAIDetect at COLING 2025, and Pangram Labs, "How well does Pangram perform on humanizers?", August 2025.
  19 commercial humanisers all degraded the original; tortured phrases and non-standard Unicode as residue.
- Wiki Education, January 2026: 178 of 3,078 reviewed articles flagged; 7% cited a fabricated source, over two-thirds failed verification.
- Williams and Bizup, Style: Lessons in Clarity and Grace; Pinker, The Sense of Style; Zinsser, On Writing Well; Klinkenborg, Several Short Sentences About Writing; Orwell, Politics and the English Language; Graham, "Write like you talk"; Saunders, Story Club.
  The sentence-craft checks: characters as subjects, old before new, the stress position, cohesion, the curse-of-knowledge pass, connectors only where order fails, the talk test, the per-sentence pass, and the stock-phrase diagnostic.
- Gorrie, "Leave the em-dash alone", Dead Language Society, 2025: https://www.deadlanguagesociety.com/p/em-dash-ai-writing-panic
  "AI prose has no sense of proportion"; the one-emphasised-sentence rule.
- "Catch Me If You Can? Not Yet", EMNLP 2025 Findings, arXiv 2509.14543, and "Authorship impersonation via LLM prompting does not evade verification", arXiv 2603.29454.
  Few-shot imitation copies surface features and fails on blogs and forums; lexical and syntactic features identify a writer. The basis for measure, edit less, measure again.
- van Nuenen, "Voice Under Revision", arXiv 2604.22142, 2026.
  Rewrites cut contractions, first person, and function words and raise word length even under a voice-preserving prompt (32% smaller effect, same direction). The basis for the voice check and the eval metrics.
- Biber, Dimensions of English (Bamberg summary) and Basecamp, "How we communicate".
  Involved versus informational markers per medium; the chat register.
- River, "How ghostwriters capture client voice", and the ghost-writer skills by angelarose210, robertguss, gncll, and dannwaneri.
  Sample size, negative samples, forbidden patterns, and the measured profile.
- Paech, "Antislop", ICLR 2026, arXiv 2510.15061, and https://github.com/sam-paech/slop-score
  Over-representation ratios for LLM fiction vocabulary (some phrases at over a thousand times the human rate); the not-x-but-y weighting behind the eval contrast checks.
- Wikipedia:Signs of AI writing, fetched 2026-09-01.
  Current vocabulary eras, the spaced-dash note, the Grok entries, and the "signs of human writing" list.

Use these sources as diagnostic inspiration. Do not copy upstream examples or prose into user deliverables. When maintaining this skill, keep `SKILL.md` concise and move detailed pattern lists into references.
