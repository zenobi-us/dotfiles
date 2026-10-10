# AI-writing patterns

Use this reference to find clusters of AI-generated prose. Do not treat any single pattern as proof. Many human writers use one or two of these naturally.

## How to use this catalogue

One feature is never a verdict. The reliable signal is a cluster of tells plus the absence of genre adaptation. AI prose stays at one pleasant altitude no matter the audience; human prose shifts register, takes sides, and varies its rhythm. Treat uniform tone across a whole piece as the most durable tell of all.

Work in this order:

1. Scan for near-conclusive artefacts. If one is present, the text is almost certainly machine-generated or pasted from a chatbot. See below.
2. Otherwise count clustered tells in context. A passage needs several, not one. Use the confidence tiers when reading the vocabulary list.
3. Apply genre exemptions. Passive voice in a methods section, bullet lists in release notes, hedging in legal text, and markdown in a README are correct, not tells. See `voice-and-context.md` and `genre-tells.md`.
4. Never trigger an edit on a single feature. Detector-evasion is not the goal; clarity and fit are.

Confidence tiers, used throughout this file:

- Tier 1: distinctive markers. Flag when two or more appear in the same passage.
- Tier 2: common but overused. Flag only at higher density, and never replace a word on sight.
- Tier 3: ordinary English whose elevated rate shows up only across a large corpus. Do not flag or "fix" these in a single document.

## Near-conclusive artefacts

These need no corroboration. A single instance is hard evidence that text was machine-generated or pasted unedited from a chatbot. Remove them.

- Leaked tool and citation markup that no human types: `oaicite`, `oai_citation`, `contentReference`, `turn0search0`, `attributableIndex`, `grok_card`, `:::writing`, `【...】` citation brackets, Gemini's `[cite: 1]` and `[span_1](start_span)`, Perplexity's `attached_file` and `ppl-ai-file-upload`, DeepSeek's lenticular brackets and dagger marks, ` ```wikitext ` fences, and links that point at a search-engine results page instead of a source.
- Citations that do not resolve: a DOI or ISBN that is invalid, a DOI that resolves to an unrelated article, a book cited with no page number for a specific claim. A 2026 audit of flagged Wikipedia articles found only 7% cited a fabricated source but over two-thirds failed verification, so check the resolving ones too.
- Humaniser residue. Commercial "humanisers" swap words for dictionary synonyms and damage the text: "counterfeit consciousness" for "artificial intelligence", tortured phrases in place of standard terms, non-standard Unicode look-alike characters, and a sudden drop to elementary register with random typos. A benchmark of 19 such tools found every one degraded the original. Treat the residue as conclusive and restore the plain term.
- Raw markdown dropped into a destination that does not render it: literal `**bold**`, `##` headings, or escaped `\*` asterisks in an email, a plain-text field, or a CMS that expected HTML.
- Tracking parameters left on pasted links, such as `?utm_source=chatgpt.com`.
- Unedited assistant scaffolding: "Let me know if you need any modifications", "Here is the revised version", "I hope this helps", "Would you like me to".
- Unfilled template placeholders the writer forgot to replace: `[Your Name]`, `[Insert X here]`, `[Company]`, `[Date]`. A deliberate editorial gap marker such as `[figure needed from the Q1 report]` is not one of these; keep it until the fact arrives.
- Standalone model disclaimers: "As an AI language model", "As a large language model", "I don't have access to real-time information". These are 2022–2024-era and largely retired by current models, so their absence proves nothing, but their presence is conclusive.

## Content patterns

### Significance inflation

The text overstates importance instead of explaining what happened.

Watch for:

- "serves as", "stands as", "plays a vital / crucial / pivotal / significant role"
- "testament", "pivotal", "crucial", "vital", "cornerstone", "beacon"
- "underscores its importance", "reflects broader trends", "marks a shift"
- "left an indelible mark", "deeply rooted", "a key turning point", "a focal point"
- vague claims about legacy, impact, or a changing landscape

Fix by naming the concrete event, effect, audience, or evidence.

### Notability padding

The text lists media coverage, social presence, awards, or expert status without explaining why it matters.

Fix by using the strongest relevant fact or cutting the padding.

### Superficial present-participle analysis

The text appends "-ing" phrases to simulate depth. This is one of the most durable structural tells, not a vocabulary quirk: corpus studies measure present-participial clauses in LLM prose at roughly two to five times the human rate.

Watch for:

- "highlighting", "underscoring", "reflecting", "showcasing", "contributing to", "fostering"
- trailing clauses tacked to the end of a sentence that restate the main clause instead of adding a fact

Fix by splitting the sentence and saying the actual relationship, or remove the phrase.

### Promotional language

The prose sounds like an advert when the genre needs plain description.

Watch for:

- "boasts", "vibrant", "rich", "profound", "renowned", "groundbreaking", "stunning", "must-visit", "breathtaking"
- "in the heart of", "nestled", "commitment to excellence", "rich cultural heritage"
- abundance metaphors: "a rich tapestry of", "woven into the tapestry", "a treasure trove of", "a myriad of", "a plethora of"
- booster verbs in marketing copy: "supercharge", "unlock", "unleash", "empower", "elevate", "revolutionise", "transform". See `genre-tells.md`.

Fix with observable facts, named features, or measured claims.

### Vague attribution

The text leans on faceless authority.

Watch for:

- "experts argue", "observers note", "industry reports suggest", "some critics say"
- "studies have shown", "research suggests", "it is widely believed" with no named source

Fix by naming the source, narrowing the claim, or removing it.

A 2025-era variant is more dangerous than vagueness: a *real* source cited for a claim it does not actually support. Current models name genuine papers, authors, and URLs but do not verify that the source backs the sentence. When a claim leans on a specific citation, check that the source says what the text says, or flag it.

### Speculation from absence

The text turns a gap in the sources into a claim about the subject: "Information about her early life is not publicly available, suggesting she maintains a low profile." The second clause is invented.

Fix by stating what is documented and stopping: "Her early life is not documented in the available sources."

### Vague connection

The text asserts a relationship without saying what it is: "associated with", "linked to", "in connection with", "has been involved in", "the system has been associated with residential water management applications".

Fix by naming the relationship (built, sold, funded, tested, was sued over) or cutting the sentence.

### Process narration

The text narrates the research instead of reporting it: "after reviewing available sources", "upon examination of the record", "a closer look reveals". A 2026 Wikipedia cleanup candidate. Fix by giving the finding and, where the genre wants it, the citation.

### Formulaic challenges and future sections

The text adds a generic "challenges", "future outlook", or "despite these challenges" section.

Fix by keeping only real constraints, dates, decisions, and next actions.

## Language patterns

### Overused AI vocabulary

Vocabulary tells are time-dependent, so lean on structure and cluster density over any fixed word list. The eras below show how the list drifts; the absence of an older word does not clear a text.

- 2023 (GPT-4), peaked then declined through early 2024: delve, tapestry, testament, intricate, meticulous, pivotal, underscore, realm, showcase.
- mid-2024 (GPT-4o) shift: align with, foster, highlight, enhance, garner, ensure.
- mid-2025 onward, subtler and narrower: emphasising, enhance, highlighting, showcasing. Grok keeps "underscore" and adds causal, empirical, correlate.
- Newer additions seen across skills and corpora in 2026: quietly (as in "quietly powerful"), gate / gated / gating used figuratively, interplay, enduring, valuable, "key" as an adjective.

Read the list through the confidence tiers above:

- Tier 1, distinctive (flag a cluster of two or more): delve, tapestry, testament, intricate, meticulous, pivotal, underscore, realm, showcase, multifaceted, myriad, plethora, commendable, paramount, burgeoning, quintessential, cornerstone, beacon, nuanced.
- Tier 2, common but overused (flag at higher density, never replace on sight): enhance, foster, leverage, utilise, facilitate, streamline, bolster, amplify, cultivate, garner, surpass, exemplify, encompass, align with, ensure, robust, seamless, comprehensive, holistic, scalable.
- Tier 3, ordinary English (an aggregate corpus signal only, never a single-document tell): potential, significant, crucial, key, vital, notable, important, additionally, moreover, furthermore, subsequently.

Fix Tier 1 and Tier 2 clusters by using plainer words or rewriting the sentence around a concrete noun and verb. Leave Tier 3 alone in normal prose. Some Tier 2 words, such as "robust" and "scalable", carry precise technical meaning in code and documentation; keep them when accurate. See `genre-tells.md`.

### Nominalisation and noun density

AI prose buries actions inside abstract nouns, producing dense, noun-heavy sentences with weak verbs. Corpus studies find nominalisations at roughly 1.5 to 2 times the human rate.

Watch for:

- "the implementation of", "the utilisation of", "the optimisation of", "the facilitation of"
- "provides an improvement in" instead of "improves"
- strings of abstract nouns joined by "of": "the enhancement of the efficiency of the process"

Fix by turning the noun back into a verb: "the implementation of X" becomes "we built X" or "implementing X". Name who did what.

### Copula avoidance

The prose dodges simple "is", "are", or "has" constructions.

Watch for:

- "serves as", "stands as", "marks", "represents", "features", "boasts"
- "refers to" used to define a subject the sentence could simply state

Fix by using the simpler verb when it is accurate.

### Negative parallelism

The text uses a predictable contrast structure: "not only X but Y", "this is not about X, it is about Y". Treat a repeated instance as Tier 1: reporting in 2026 put the construction at about three times the human rate, rising in corporate filings and public statements year on year, and it survives prompts that tell the model to stop. The full list, the escalating variant, and the fix are under Binary contrast in `structures-and-phrases.md`.

### Rule of three

The prose keeps packing ideas into threes. LLM argumentative prose runs tricolons at close to twice the rate of expert human writers.

Fix by using the exact number the thought needs. Two is often enough. One strong example often beats a trio. A single tricolon is a normal rhetorical device, not a tell; the signal is the habit repeating across a piece.

### Synonym cycling and close-repetition avoidance

The same thing gets renamed for variety: "the protagonist", "the central figure", "the hero". The underlying habit is avoiding a word close to its last use. Lexical dispersion is the strongest single predictor in a 2025 study of six diversity measures, and the habit is stronger in newer ChatGPT versions than older ones, so it is not fading.

Fix by choosing the clearest term and repeating it when repetition helps. A human writer says "the parser" four times in a paragraph.

### Sentence length

2025-era instruction-tuned models write sentences 15 to 30% longer than human authors of comparable text, around 22 to 29 tokens against a human 22, and pack them with nominal modifiers, participial phrases, and coordinated nouns. 2023-era models ran short and choppy. Neither is a single-sentence tell; the signal is a whole piece that sits at one length with no short sentence anywhere. See the uniform-cadence check in `preflight.md`.

### Mannered prose

The sentence substitutes metaphor and flourish for direct statement: "the codebase groans under its own weight", "a symphony of microservices", "we set sail for a new architecture". The fix is to say what you mean. When a literal phrase is available, use it. This is the one-line instruction Anthropic recommends for its own models, and it works on drafts too.

### False ranges

The text uses "from X to Y" where the endpoints are not a real range.

Fix by naming the covered topics directly.

### Passive voice and subjectless fragments

The sentence hides who acted or drops the subject.

Scan for "is", "are", "was", "were", or "been" followed by a past participle, then ask who did it: "queries are validated" becomes "the compiler validates queries"; "the file is parsed by the loader" becomes "the loader parses the file".

Fix by naming the actor when it matters. Keep passive voice when the actor is unknown, irrelevant, legally sensitive, or where the genre expects it, such as a scientific methods section.

## Formatting and style patterns

### Dash dependence

AI prose can lean on em dashes and en dashes for rhythm and faux sophistication. Treat this carefully: the em dash is the most-publicised tell and the least reliable. Many strong human writers use it heavily, and some writers now self-censor real punctuation to dodge suspicion. A single em dash, or em dashes in literary and editorial long-form, is not a tell.

The rate depends on which model wrote the text, not on "AI"; the per-model figures are under Model fingerprints below, for diagnosis only. None of this is an instruction about the writer's dashes: a dash the writer put there stays unless the brief asks for the strict pass.

In normal rewrites, treat heavy dash use as one tell among others and thin it out only when it clusters with other patterns and clearly substitutes for sentence structure. In strict "humanise" or de-AI passes, removing em and en dashes is a register choice the user has asked for, not proof of AI origin. End the sentence or use a comma. Do not swap the dash for a colon or parentheses; see Colon as connector. Either way, keep en dashes in numeric and date ranges such as "2019–2024" or "pages 10–12"; that is standard typography. Stripping dashes to beat a detector is not a quality goal.

### Colon as connector

A colon is correct before a list, an example, or a definition. It becomes a tell when it works as a mid-sentence hinge that adds nothing: "If you're coming from traditional automation: instead of registering event handlers, you describe conditions." The colon stands in for a connection the sentence never makes.

Fix by writing the sentence without the comparison framing, or by using a full stop. Flag the habit across a piece, not the single instance, the same caution as Dash dependence.

### Mechanical bold and inline headers

Watch for bullet lists where every item starts with a bold label and the text after it only restates the label: "**Performance:** Performance improved across the board."

The tell is the redundancy, not the punctuation. A bold lead-in that names the item and is followed by genuinely new detail is a normal documentation convention, whether it ends in a colon or a full stop: "**Schema in TypeScript.** Tables live in one file." Keep those.

Fix the redundant kind by writing normal sentences, simpler bullets, or a table when comparison matters. The related tell is the whole list running on the same template when only two of its items need a label.

### Title-case headings

Use sentence case unless the style guide says otherwise.

### Heading restated by its first sentence

A heading followed by a sentence that only repeats it: "## Installation" then "This section covers how to install the tool." Delete the sentence and start with the first instruction.

### Summary-shaped and paired headings

Headings that do the section's work for it ("Why the reception was mixed" where "Reception" is the heading) and reflexive "X and Y" headings ("Awards and recognition", "Challenges and opportunities"). Use the plain noun and let the section say what it says.

### Document skeleton tells

Horizontal rules between every section, skipped heading levels, a heading that contains only sub-headings, and a small table for two or three facts that are not tabular. Fix by writing the structure the content needs, not the one the model's template produces.

### Hyphenated pairs after the noun

AI prose hyphenates compound modifiers everywhere. Keep the hyphen before a noun when grammar needs it ("a high-quality report") and drop it after the noun ("the report is high quality"). One stray hyphen is nothing; a piece where every pair is hyphenated in both positions is a habit.

### Decorative emoji

Remove decorative emoji in professional, technical, reference, and de-AI rewrites. Keep them only when the medium and voice clearly call for them. Section-heading emoji and emoji used as bullet markers are a strong chatbot tell.

### Curly quotes

Curly quotes alone are not an AI tell. Convert to straight quotes only when the output format, code context, or user preference requires it.

## Communication artefacts

Remove pasted chatbot behaviour:

- "Of course", "Certainly", "Sure", "Absolutely"
- "Great question", "I'd be happy to", "Happy to help"
- "I hope this helps"
- "Let me know if you want", "Feel free to reach out"
- "Here is an overview", "Let me break this down for you", "Let me walk you through it"
- "As of my last update"
- "Based on available information" when used to pad a gap

### Sycophancy

A 2025-era artefact of assistant-tuned models: content-free praise before the substance.

Watch for:

- "You're absolutely right", "That's a brilliant question", "What a thoughtful observation"

This is a tell mainly in assistant-voiced output and in finished documents where a conversational acknowledgement makes no sense. Enthusiastic humans say these things too, so flag them when they precede the real content as filler, not when they carry genuine warmth in a message.

## Filler, performed hedging, and fake depth

Watch for:

- "due to the fact that", "at this point in time"
- "it is important to note", "worth noting", "when it comes to"
- "could potentially possibly be argued", "may potentially in some cases"
- "at its core", "the real question is", "the heart of the matter"
- "the future looks bright", "exciting times lie ahead"

Fix by cutting the phrase or writing the concrete claim.

Hedging is two different things, and only one is a tell. Performed hesitancy ("it is important to note", stacked modals that hedge nothing in particular) runs at about twice the human rate in LLM argument. Stance hedges and boosters ("I think", "probably", "perhaps", "very", "tends to") are the opposite: corpus work on ChatGPT essays finds a significantly lower rate of hedges, boosters, and attitude markers than in human writing, which is what makes the prose impersonal. Strip the first kind. Keep the second, and never strip it on a keep-my-voice brief.

Wordy constructions such as "in order to" and "as a result of" belong with the second kind. Humans write them; ChatGPT and Grammarly remove them. Cut them for concision when the brief asks for tight prose. Cutting them is not a de-AI fix, and on a keep-my-voice brief they stay.

## Model fingerprints (diagnostic only)

For review and diagnosis tasks, not for verdicts. These date fast and a wrong attribution is worse than none, so never act on them alone. Two cautions from the corpus work: instruction tuning, not the vendor, drives most of the shared tells, and successive models from one vendor often do not cluster together, so a fingerprint carries a model version and a date or it is worthless.

- ChatGPT, GPT-4 to 4o era (2023 to 2024): tricolons, additive em dashes, bold inside enumerations, "such as", "certainly", "below is", "overall", academic register that shuns slang. GPT-5.x (late 2025 onward): em dashes below the human rate, softer register, a "Good question" or "Great start" opener that OpenAI added back on purpose.
- Claude, 3.5 to Opus 4.6 (2024 to early 2026): minimal structure and less bold than ChatGPT, "here", "according to", "based on", em dashes at roughly triple the human rate, long hedged multi-clause sentences, "you're absolutely right".
- Gemini, 2.5 era: verbose, corporate-flat, plain conversational vocabulary, more italics, list and header heavy, "[cite: 1]" leakage.
- Grok, 2025 to 2026: superficially scientific vocabulary ("causal", "empirical", "correlate"), "X rather than Y" framing, and "underscore" long after other models dropped it.
- DeepSeek: lenticular brackets and dagger marks leaking from its citation format.

Em dashes per 1,000 words, measured in early 2026 (Freeburg) with no formatting instruction: GPT-5.4 at 1.4, below a human essay baseline of 3.2; Claude Opus 4.6 at 9.1 and DeepSeek V3 at 7.0, roughly triple it; Gemini 2.5 Pro at 3.5; Llama at zero. OpenAI cut the habit, Claude and DeepSeek did not. Two secondary signals: machine em dashes are usually surrounded by spaces, and in scientific discussion sections a corpus study found em-dash prevalence rising from 4% of papers before ChatGPT to 20% in 2025. Neither is a single-document verdict, and neither is a reason to touch a dash in a writer's draft.

## False positives

Do not over-edit these without a cluster of other tells:

- polished grammar, formal vocabulary, dry prose
- one transition word, one dash, one curly quote
- a single instance of a focal word such as "delve" or "intricate"
- a single tricolon or one "not X but Y" antithesis
- one warm "happy to help" in a genuine message
- a common salutation or sign-off
- clean formatting from a CMS or document editor

Why single features are unreliable, and why detector-evasion is a non-goal:

- Detectors vary enormously and the bias is documented. A 2023 Stanford study found more than half of non-native English essays misclassified as AI across seven detectors, on a sample of 179 essays. A 2026 ACL study of 16 detectors on about 41,700 essays confirmed the direction: essays by English language learners are more likely to be classified as machine-generated, and non-white learners more so than white ones. Human raters in the same study were no better than chance and showed no such bias. At the other end, commercial vendors report near-zero false-positive rates for their current products, figures that are vendor-relayed and unverified here. OpenAI retired its own classifier in 2023 after it correctly flagged only 26% of AI text. Light paraphrasing still defeats most detectors.
- Plain, predictable, low-variation prose is the normal style of fluent non-native and formal writers. Flagging it penalises people, not machines. The same is widely reported for neurodivergent writers, and at least one university finding has been annulled on that basis, but as of 2026 no peer-reviewed study quantifies that false-positive rate.
- "delve" is an RLHF artefact, not, as sometimes claimed, a marker of Nigerian English; corpus work found it does not originate there. It is common in fluent Nigerian, Indian, and other non-native business English. One or two focal words mean nothing; only a dense cluster in a short passage is a signal. Humans are also adopting these words: recordings of unscripted speech show "delve", "meticulous", and "underscore" rising since 2023, some more than doubling, so the 2023 list keeps losing power as a tell.
- The em dash is the least reliable single tell. See Dash dependence.

Never strip a feature on a single signal. The job is to make the writing fit its purpose, not to make it pass a detector.

## Human signals to preserve

Preserve:

- specific, unusual details
- mixed feelings and unresolved tension
- dated or subculture-specific references
- first-person choices that fit the genre
- genuine asides and self-corrections
- varied sentence length
- plain repeated terms that improve clarity. Newer models avoid repeating a word near its last use, so a writer who says "the parser" four times in a paragraph is showing a human habit, not a flaw
- stance hedges and intensifiers: "I think", "probably", "very", "perhaps", "tends to"
- rhetorical questions. Humans use them at more than double the LLM rate; the tell is the scripted question-and-answer habit, not the question
- wordy constructions such as "in order to" and "as a result of"
- superlatives and definitive statements the writer is willing to stand behind
- simple "is" and "has" sentences and plain verbs ("wrote", not "authored")
- a single em dash, a lone "delve", or one tricolon used naturally
