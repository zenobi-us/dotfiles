# Structures and phrases

Use this reference for the stricter "anti-slop" pass. Apply it with judgement. The point is to cut generic scaffolding, not to sand off every trace of style.

## Phrases to cut or replace

### Throat-clearing

Cut openers that announce the point instead of making it:

- "Here's the thing"
- "Here's why"
- "Let me be clear"
- "The truth is"
- "It turns out"
- "Can we talk about"
- "The uncomfortable truth is"
- "I want to explore"
- "Let's dive in"
- "Let's break this down"
- casual-register versions: "one thing that bit me hard, so pay attention to this part:", "okay so here's the bit that matters", "real talk:"

### Stock openers

Cut the canned first lines that set a scene instead of starting the piece. These are among the most-cited AI openers across every source.

- "In today's fast-paced world", "In a world where", "In an era where"
- "In the (ever-)evolving landscape of", "In the realm of", "In the world of"
- "Welcome to our comprehensive guide", "In this article we will explore", "In this post we'll dive into"
- "Have you ever wondered", "Imagine", "Picture this"
- "Buckle up", "Without further ado", "Now more than ever"
- "Let's face it", "Let's be honest", "It's no secret that"

Start with the actual subject, claim, or action instead.

### Mechanical transitions

These connectives appear more often in LLM prose and tend to stack across consecutive sentences. Thin them out; most can be deleted.

- "That being said", "That said", "With that in mind"
- "This begs the question"
- "It goes without saying", "Needless to say"
- "In essence", "Essentially"

Keep a transition only when it marks a real turn in the argument.

### Essay-scaffold closers

Cut the tell-them-what-you-told-them ending unless the genre genuinely needs a summary (a long report, a spec):

- "In conclusion", "To summarise", "In summary"
- "Overall", "Ultimately"
- "At the end of the day"

End on the real point, the next step, or the strongest detail.

### Emphasis crutches

Cut manufactured emphasis:

- "Full stop"
- "Period"
- "Let that sink in"
- "Make no mistake"
- "This matters because"
- "Here's why that matters"

### Business jargon

Prefer plain alternatives when the word is filler. Some entries below (leverage, utilise, streamline, optimise) are Tier 2 in `ai-writing-patterns.md`: swap them when they cluster as jargon, not on sight, and keep them where they carry real meaning.

| Avoid | Prefer |
| --- | --- |
| navigate challenges | handle, address |
| unpack | explain, examine |
| lean into | accept, use, commit to |
| landscape | situation, market, field |
| game-changer | major change, useful change |
| deep dive | analysis, review |
| moving forward | next, from now on |
| circle back | return to |
| on the same page | agreed, aligned |
| leverage | use |
| utilise | use |
| streamline | simplify, speed up |
| optimise | improve, tune |
| actionable | usable, specific |
| move the needle | make a difference |
| low-hanging fruit | easy wins |
| synergy | working together |
| bandwidth | time, capacity |
| take it to the next level | improve |

### Abstract metaphor nouns

A technical-sounding register that reads as precision but usually has a plainer concrete word underneath. Common in engineering writing, product strategy, and AI-assisted technical prose. The rule is the same as the table above: swap the word when it is doing metaphorical work, keep it when it is the literal domain term. A substrate in semiconductor manufacturing, a vector in maths or security, and a primitive in a graphics API are all correct.

| Avoid | Prefer |
| --- | --- |
| substrate | base, foundation, the layer underneath |
| wedge in | add, insert |
| vector | way, method, route |
| locus | place, centre |
| vantage | viewpoint, position |
| nexus | link, meeting point |
| primitive (as a noun) | building block, basic operation |
| harness (as a metaphor) | use, put to work |
| surface (as in "API surface") | the API, what the API exposes |
| bedrock | foundation, what it rests on |
| scaffolding (as a metaphor) | structure, temporary support |
| modality | mode, form, channel |
| paradigm | model, approach, way of working |
| gold-plating | more than the job needs |
| ratchet | the mechanism's real name, or "a limit that only tightens" |
| evacuate (for moving code) | move out, remove |
| endgame | the last phase, the goal |
| north star | the goal, the main measure |
| flywheel | the loop that compounds |
| load-bearing | essential, what the argument rests on |

### Posture adverbs

Remove adverbs that add posture rather than meaning:

- deeply, truly, fundamentally, inherently, inevitably
- interestingly, importantly, crucially, notably
- genuinely, honestly, straightforward, and "to be honest" when they vouch for the sentence rather than describe anything. Anthropic's own system prompt bans these for the same reason: a writer who is honest by default does not need to say so, and the modifier reads as the opposite.

An adverb propping up a weak verb usually means the verb is wrong: "runs quickly" becomes "is fast" or the measured number, "significantly improves" becomes the delta. Try the stronger verb before deleting the adverb.

Stance adverbs are not on this list. "really", "just", "actually", "very", "probably", "perhaps", and "I think" are how a person marks how much they mean something, and corpus work finds LLM prose has fewer of them than human prose, not more. Thin them only when they cluster as filler in formal copy. In personal, conversational, or voice-sample writing they stay, and on a keep-my-voice brief every one of them stays.

### Empty importance

Replace or cut sentences that only claim weight:

- "The implications are significant"
- "The stakes are high"
- "The reasons are structural"
- "This is the deeper issue"
- "This is what leadership looks like"

Name the implication, stake, reason, issue, or behaviour.

The numeric form is the invented baseline: "a healthy margin", "well within range", "a realistic target", "strong growth" with no stated comparison. Each one claims a norm the source never gave. Keep the number, cut the adjective, or name what it is compared against.

### Mood instead of mechanism

The sentence names a feeling about the thing rather than what the thing does:

- "the database stays close at hand"
- "SQL you can actually read"
- "types that follow your schema"
- "a workflow that gets out of your way"

Fix by naming the mechanism, a fact, or a number: "`.toSQL()` returns the exact string sent to the database", "renaming a column fails the build". Ask what the sentence tells the reader to do or know, then write that. If it cannot be restated as a concrete instruction, fact, or number, cut it.

Then apply the swap test. If the sentence could sit unchanged in a different company's or project's copy, it says nothing about this one. Make it specific or delete it.

## Structures to avoid

### Binary contrast

These patterns feel pre-baked:

- "Not because X. Because Y."
- "X is not the problem. Y is."
- "The answer is not X. It is Y."
- "It feels like X. It is actually Y."
- "Not just X, but Y."
- "Not only X but Y."
- "This is not about X, it is about Y."
- "X rather than Y" and "rather than X, Y" used as a reflex (common in Grok output).

Fix by stating the point directly. This is a Tier 1 structure when it repeats: see Negative parallelism in `ai-writing-patterns.md`.

A specific escalating variant climbs from a modest claim to a grand abstraction, often carried by an em dash: "Support isn't just a department, it's the heartbeat of the company." Watch for the jump to a lofty noun such as "paradigm", "engine", "revolution", or "heartbeat". Fix by making the plain claim and cutting the inflation.

### Negative listing

Avoid building suspense by listing what something is not.

Fix by naming what it is.

### Dramatic fragmentation

Watch for:

- "X. That's it."
- "X. And Y. And Z."
- "This unlocks something. [Single abstract word]."

Fix with complete sentences unless the fragment is clearly part of the writer's voice.

### Rhetorical setups

Cut prompts that pretend to discover an insight:

- "What if..."
- "Think about it"
- "Here's what I mean"
- "And that's okay"

Make the point. Let the reader react.

### False agency

Inanimate nouns should not perform human decisions.

Watch for:

- "the decision emerged"
- "the data tells us"
- "the market rewards"
- "the conversation moved"
- "the culture shifted"

Fix by naming the person, team, buyer, reader, or process where possible.

### Narrator from a distance

Avoid hovering above the scene:

- "People tend to"
- "Nobody designed this"
- "This happens because"
- "This is why"

Fix by putting the reader, actor, or specific situation in the sentence. Keep the distant narrator when it is a deliberate register in an essay or opinion piece.

### Question-answer habit

Repeated questions followed by immediate answers feel like a script.

Fix by turning the answer into a statement, or keep the question only when it creates real tension. The tell is the scripted pairing, not the question: humans ask rhetorical questions at more than double the LLM rate, so a lone question that the paragraph then explores is a human signal, and it stays.

### Repetitive paragraph endings

If every paragraph ends with a punchline, the rhythm becomes artificial.

Fix by varying paragraph length, ending on details, and letting some paragraphs land quietly. Two tests:

- Aphorism budget: at most one punchy one-liner closing a paragraph in the whole piece. Count them.
- Pull-quote test: if a sentence sounds like it was written to be quoted, rewrite it as a plain statement.

### Stating the moral

The paragraph ends by explaining what it meant, the section ends with its lesson, the story ends with its theme. A 2026 study of 61,000 stories found AI-written ones stated the moral 77% of the time against 52% for humans, and the habit carries into non-fiction as a closing "which is why X matters".

Fix by ending on the last fact or event and trusting the reader.

### Shadowboxing

The text answers an objection nobody raised: "This isn't really about X", "I'm not saying that", "To be clear, I'm not arguing", "Don't get me wrong". If the objection does not appear in the piece or the brief, the defence is padding.

Fix by cutting the defence, or by stating the objection and answering it if it is real.

### Phantom alternatives

The text sets up an option only to reject it: "A tempting approach would be", "One might be tempted to", "It would be easy to assume". The option was never on the table.

Fix by stating the real constraint directly.

### Editorial scar tissue

Sentences that exist because of a previous edit rather than for the reader: a caveat added after a reviewer's comment, a clarification that only makes sense if you saw the earlier draft, a reassurance that answers a deleted sentence. Test: if you can explain which edit caused the sentence to exist, rather than what new information it contributes, cut it.

### Countdown and tail negation

A fixed marketing rhythm that lists negations before a payoff:

- "No setup. No friction. Just results."
- "Not X. Not Y. Just Z."

Fix by naming the benefit plainly. Keep the rhythm only when it is clearly part of the writer's voice, the same caution as Dramatic fragmentation.

### Rhetorical self-answer

A one-line question fragment answered by a fragment, used as a fake transition. Common in LinkedIn and newsletter copy:

- "The result? Double the conversions."
- "The kicker? It was free."
- "The good news? You can start today."

Fix by writing the statement.

### Over-signposting

The text announces its own outline with ordinals and stacks formal connectives across paragraphs:

- "Firstly... Secondly... Finally"
- "Moreover... Furthermore... Additionally... Subsequently" piled up

Fix by letting the structure carry itself and deleting most connectives. Exempt genuinely sequential or instructional genres: steps in a recipe, an install guide, or a procedure can be numbered.

### False balance

Reflexive both-sidesing that never resolves, plus stacked hedges:

- "On one hand X, on the other hand Y... ultimately it is complex and multifaceted."
- "may potentially in some cases"

Fix by taking a position where the genre allows confidence. Note the opposite duty in academic, legal, and medical prose, where a genuine hedge protects accuracy and should be kept or even added.

### List-itis

The model defaults to bullet lists in genres that expect connected prose, fragmenting an argument into eight full-sentence bullets with no connecting reasoning. A related form is the listicle in disguise: "The first reason is cost. The second reason is speed. The third reason is reliability."

Fix by writing the argument as paragraphs with real connective tissue. Exempt technical docs, release notes, reference material, and checklists, where lists are correct.

### Fractal recap

The text previews itself and summarises itself at every level: an intro that lists what is coming, each section opening with its own preview and closing with its own recap, all around one thin idea.

Fix by making the point once and cutting the scaffolding. Keep a single summary only in long documents that earn it.

### Invented compound jargon

The model coins official-sounding terms to manufacture authority:

- "the supervision paradox", "the acceleration trap", "workload creep", "what I call the productivity paradox"

Fix by describing the thing in plain words rather than naming a fake concept.

### Aphorism formula

A fill-in-the-blanks faux-wisdom template:

- "Trust is the currency of teams", "Data is the new oil", "Attention is the currency of the modern age", "X is the language of Y"

Fix by cutting the slogan and stating what is true.

### Meta-commentary joiners

Performative interjections that narrate the writing instead of advancing it:

- "Plot twist", "Spoiler", "Here's the kicker"
- "X is a feature, not a bug", "But that's another post"

Fix by making the point and trusting the reader to register it.

### Engagement bait

Social-post habits that fish for a reaction:

- closers: "Agree?", "Thoughts?", "Who's with me?", "Am I wrong?"
- manufactured-insight hooks: "Here's what nobody tells you about", "Here's the truth", "Here's what nobody's saying"
- stock templates: "Not all X are created equal", "Whether you're a X or a Y", "That's where X comes in"

Fix by making a claim worth reacting to and ending on it.

## Quick rewrite moves

- Delete the first sentence if it only introduces the topic.
- Replace abstract nouns with the object or action.
- Replace three-item lists with the strongest one or two items.
- Replace "can help" with the actual outcome.
- Replace "is designed to" with what it does.
- Replace "users are able to" with "users can".
- Replace "there are" openings with a stronger subject.
- Merge duplicate sentences rather than cycling synonyms.
- Move the actor to the front of the sentence.
- Split any sentence you have to backtrack to parse. One idea per sentence.
- Replace a sentence that names a feeling with the mechanism, a number, or a date.
- End on the concrete next step, not a flourish.
