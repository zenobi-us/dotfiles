# Voice and context

Use this reference when the request is not just "fix grammar". It helps choose the right kind of good.

## Brief read

Before rewriting, identify:

- Genre: email, essay, report, documentation, UI copy, marketing copy, social post, speech, proposal, reference text.
- Audience: peer, customer, executive, regulator, hiring manager, friend, broad public, specialist reader.
- Relationship: warm, distant, corrective, collaborative, persuasive, instructional, apologetic.
- Stakes: low-risk note, public-facing copy, legal or compliance-sensitive text, high-trust technical guidance.
- Outcome: inform, persuade, reassure, ask, decline, explain, sell, document, announce, apologise.
- Constraints: length, dialect, house style, forbidden claims, citations, exact wording, formatting.

Then form a one-line read:

`Reading this as: [genre] for [audience], with a [tone] voice, optimising for [outcome].`

Do not show this line unless planning helps the user.

## Dials

Set these mentally before rewriting. Adjust them from the brief rather than using one house style.

| Dial | Low | High |
| --- | --- | --- |
| Directness | gentle, indirect, relationship-preserving | concise, plain, no ceremony |
| Warmth | cool, formal, restrained | personal, generous, conversational |
| Personality | invisible editor | distinctive point of view |
| Density | spacious, accessible | compressed, expert-facing |
| Evidence | common-sense, experiential | sourced, quantified, caveated |
| Polish | rough human texture | publication-ready finish |

The dials have measurable markers. Register studies (Biber) separate involved prose (first and second person, contractions, present tense, private verbs such as "think" and "feel", emphatics) from informational prose (nouns, longer words, more distinct words, attributive adjectives). Personal letters sit on the involved side, professional letters near the middle, academic and official prose on the informational side. Use the markers to check a rewrite landed where the brief asked:

| Medium | Markers to expect |
| --- | --- |
| Chat and messages | contractions, second person, questions, fragments allowed, no headings |
| Email | contractions, first person, one ask, short paragraphs |
| Memo and report | more nouns per sentence, fewer contractions, decisions before reasons |
| Documentation | present tense, no first person unless the house style has it, identifiers exact |
| Essay and opinion | first person, hedges as voice, at most one emphasised sentence per paragraph |

Second person is a human marker the models under-use: a 2026 story corpus found humans address the reader in 28% of texts against 7% for AI. Where the genre allows it, keep it.

## Genre defaults

This section sets the dials for each genre. A tell in one genre is correct in another, so before applying the general lists check the exemptions listed per genre in `genre-tells.md`, which also holds the concrete phrase banks.

### Emails

- Lead with the action or decision.
- Keep goodwill, but cut servility.
- Use concrete asks, owners, dates, and next steps.
- Preserve relationship context. Direct does not mean blunt.

### Chat and short messages

- Writing solidifies and chat dissolves, so a chat message carries one thing: a question, an answer, a decision, or a link.
- Contractions, second person, and fragments are the register. Headings, bold labels, and bullet lists are not, unless the platform is used that way.
- If the words can be read two ways, they will be read the worse way. Say the thing, not the softened version.

### Documentation and technical writing

- Prefer present-tense descriptions of how the system works. The tells, including diff-anchored wording, are in `genre-tells.md`.
- Keep identifiers exact.
- Use active voice where it clarifies ownership, but do not force a human actor where the system is the true actor.

### Product and marketing copy

- Replace hype with proof, usage, contrast, and concrete outcomes.
- Avoid "elevate", "seamless", "unlock", "next-gen", and vague "transform your workflow" language.
- Do not invent social proof, customer names, usage metrics, awards, or benchmarks.
- Use one clear promise rather than a pile of benefits.
- See `genre-tells.md` for the fuller bank of booster verbs and SEO scaffolding.

### Essays, posts, and opinion

- Let the writer have a position, uncertainty, or tension.
- Keep strange details and lived examples.
- Vary rhythm. A few short sentences are useful; a whole page of staccato lines feels manufactured.
- Avoid tidy moral conclusions unless the piece has earned them.

### Reference, legal, medical, financial, and policy text

- Keep the voice plain and neutral.
- Preserve caveats that protect accuracy.
- Do not add personality for its own sake.
- Verify unstable facts if the answer depends on current law, prices, policy, availability, or research.

## Voice calibration

Imitation from a sample has limits, and the procedure below is built around them. In a 2025 study, five sample texts beat none, but adding more changed little, and the models matched email and news while failing on blogs and forums: they copy the surface and default to their own habits underneath. The features that identify a writer are word choice and sentence construction, not tone adjectives. So the method is to measure the sample, edit as little as the brief allows, and measure again.

### Before editing

1. Ask for one or two samples of 300 words or more that the writer produced without AI help. More than that changes little. Do not accept "write like [named author]" as a sample.
2. Check the sample against the tell lists first. Human writing is drifting toward LLM style, and a sample that scores high on the catalogue may itself be AI-assisted. Ask before treating it as the source of truth.
3. Record a profile. Rough counts are enough:
   - median sentence length, and the share of sentences under 8 words and over 30
   - how sentences open: the share starting with a pronoun, a noun, a conjunction ("And", "But"), an adverb, or a verb
   - contractions per 100 words
   - first-person and second-person pronouns per 100 words
   - hedges per 100 words ("I think", "probably", "sort of", "maybe")
   - punctuation inventory per 100 sentences: parentheses, colons, dashes, questions, exclamation marks
   - median paragraph length in sentences
   - five words or phrases used three or more times that are not on any slop list
   - things the writer never does: no exclamation marks, no semicolons, no questions, no bold
4. Decide the unity choices once from the sample and the brief: person, tense, and stance (certain, ambivalent, sceptical). Hold them for the whole piece.

### While editing

- Hedges, first-person markers, and idiosyncratic word choices from the sample survive unless one fails a clarity test you can quote. An unusual word that appears twice in the sample is the writer's, not a tell.
- Match the sample's punctuation and openers rather than replacing them with generic "good writing". Preserve recurring quirks when they feel intentional and do not hurt clarity.
- In informal genres (blog, forum, chat, personal email) edit less. The safer strategy is subtraction, because imitation fails there.

### After editing

Recompute the profile on the rewrite. Any figure that moved by more than a third is a voice break: either justify it from the brief or put the original back. Contractions, first person, and hedges falling while word length rises is the documented direction of drift, and it happens even under a "keep my voice" instruction, so check those four first.

On outputs over about 600 words, or across several turns of editing, re-read the first paragraph and the last together. Drift toward formal, hedged, contraction-free prose is the failure to look for.

## Sentence craft

The checks that make a rewrite read as written rather than assembled. Each is a test, not a mood.

- Characters as subjects, actions as verbs. Who did what. See the specificity ladder below.
- Old before new. A sentence opens with what the reader already has from the previous sentence and ends on what is new. Test the last three words: they should carry the thing the reader did not yet know.
- Cohesion. Read the grammatical subjects of a paragraph's sentences in order. They should name a small set of recurring topics. If every sentence has a fresh subject, the paragraph is not about anything.
- Proportion. At most one emphasised sentence per paragraph: a figure of speech, an intensifier, a tricolon, or a short punchline. AI prose deploys the same level of special effects to every sentence regardless of importance. The last sentence is not automatically the emphasised one.
- Connectors only where order fails. If the paragraphs already hold their order, "however", "therefore", and "in addition" are scaffolding. AI-assisted prose converges hardest on connective structure, so removing a connector is usually safe and adding one rarely is.
- The talk test with a named reader. For any sentence the swap test flags, ask whether this writer would say it aloud to the audience in the brief. If not, write what they would say. For a draft from scratch, write the two-sentence spoken version first and build the draft from it.
- Curse of knowledge. List every term, acronym, and internal name the text does not define. For each, decide whether the brief's audience knows it. Define or cut the ones they do not.
- A stock phrase marks where the writer stopped thinking. The fix is to find the thought that was skipped, not to swap in a synonym.

## Flatness is also a tell

Removing tells is half the job. Prose sanded down to a uniform finish reads as machine-made too: every sentence the same length, no position, no reaction, nothing only this writer would say.

The fix is to surface what the source and brief already contain, never to manufacture it.

- If the writer has a position, let the prose take it instead of listing balanced pros and cons.
- If the writer is ambivalent, keep the ambivalence. "Impressive, and slightly unnerving" is more honest than "impressive".
- Keep first person where the genre allows it. It is not unprofessional in most writing.
- Vary sentence length. Let a short sentence land after a long one.
- Keep the specific observation over the general one: not "this is concerning" but the thing that is concerning.
- Leave a defendable rough edge rather than polishing the piece flat.

Never invent an opinion, an anecdote, a feeling, or a quirk the writer did not have. Where the source holds no position, state what is true plainly rather than performing conviction. See the friction-free-tone check in `preflight.md`.

The failure this section causes when read too eagerly is a rewrite that adds material to sound alive: a next step the source never proposed, a line about what has or has not happened since, a joke in the writer's manner, a sensory detail. Each of these is a fabricated claim, and a joke in the writer's manner is a fabricated quote. The test for any sentence in the rewrite is whether the source states or directly implies it. If not, cut it, mark the gap, or ask.

Faking texture is the same failure from the other side. Do not add typos, slang, self-interruptions, or contractions the source lacks. Commercial humanisers do this and their output reads as damaged, not human.

## Specificity ladder

When a sentence feels vague, climb this ladder until it becomes useful:

1. Name the actor.
2. Name the object or system.
3. Name the action.
4. Add a number, date, place, example, source, or consequence.
5. Apply the swap test: if the sentence could sit unchanged in another company's or project's copy, it says nothing about this one.
6. Cut the sentence if it still only says "this is important".

## Fact safety

Concrete prose can tempt an agent to fabricate. Do not do that.

- If a fact is missing, ask for it, mark the gap with a clear placeholder such as `[figure needed from the Q1 report]`, or write around it honestly. Never fill the gap with an invented specific.
- Mark uncertain claims as uncertain without using filler.
- Do not turn "some people say" into named experts unless the source is available.
- Do not add invented anecdotes to make a piece sound human.
- When the swap test flags a sentence that could sit in any article, the fix is a question to the writer or a gap marker such as `[what did you measure or observe here?]`, never a detail supplied by the editor.
- Do not invent a baseline. "Healthy", "strong", "well within range", and "realistic" are claims about a comparison; keep them only when the source names what they are compared against.
- Editing is not fact-checking. A fact in the source that looks wrong gets a note, not a silent correction.
