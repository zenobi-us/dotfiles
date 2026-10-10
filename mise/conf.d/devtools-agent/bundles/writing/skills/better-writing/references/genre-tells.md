# Genre tells

Concrete AI-writing fingerprints by genre, plus the exemptions that stop the general lists from over-editing a genre where a "tell" is actually correct. Apply the bank that matches the text. For dials, audience, and voice calibration, see `voice-and-context.md`.

## Email and business messages

Cut the hollow openers and framing verbs that delay the point:

- "I hope this email finds you well", "Hope all is well", "Trust you are well"
- "I wanted to reach out", "I just wanted to touch base", "Just following up", "Just checking in"
- "Please advise", "As per my last email", "Per my previous message"
- "Circle back", "touch base", "loop you in"

Fix by leading with the reason for the message, the ask, the owner, and the date. Keep enough warmth for the relationship; direct does not mean cold.

## LinkedIn and social

- broetry: one-line paragraphs stacked for drama, each on its own line.
- engagement bait: "Agree?", "Thoughts?", "Who's with me?". See `structures-and-phrases.md`.
- manufactured-insight hooks: "Here's what nobody tells you about", "Unpopular opinion:". See Engagement bait in `structures-and-phrases.md`.
- themed-emoji bookending and emoji bullet markers.
- "As a [role], I..." openers that borrow authority from a job title.
- hashtag stacks, thread markers such as "🧵" or "1/", and exclamation marks on every line. One exclamation mark in a long post is a person; one per sentence is a template.
- ellipses that do not trail off, used as a beat.
- markdown headings and bold labels in a post the platform renders as plain text.

Fix by making one real claim and ending on it. Cut the performance.

## Marketing and SEO

Replace booster verbs and reveal framing with proof, usage, and outcomes:

- booster verbs: "supercharge", "elevate your", "unlock the power / potential / secrets of", "harness the power of", "take it to the next level", "revolutionise the way"
- urgency: "stay ahead of the curve", "future-proof your", "look no further", "now more than ever"
- SEO scaffolding: "Welcome to our comprehensive guide", "The Ultimate Guide to", "Everything You Need to Know About", "Here's a breakdown of everything you need to know", keyword-stuffed headings, padded FAQ sections
- corporate data-speak: "deliver actionable insights", "drive data-driven decisions", "leverage complex datasets"

Fix with one clear promise backed by a concrete feature, number, or example. Do not invent social proof, metrics, awards, or customer names.

## Academic and scientific

Tells:

- excess-vocabulary stacking: "meticulously delving into the intricate", "a growing body of literature", "has garnered significant attention"
- empty imperatives: "it is imperative", "this study sheds light on", "future research should explore"
- vague evidence: "studies have shown", "research suggests" with no named trial, dataset, or author

Fix by naming the specific study, dataset, method, or result.

Exemptions, so the general lists do not damage correct scientific prose:

- Hedging is bidirectional here. A genuine hedge ("these results suggest", "under these conditions") protects accuracy and should be kept, sometimes added. Do not strip it the way you would strip marketing hedging, and do not collapse a stacked hedge such as "suggest that X may" into one: the modal carries the claim's strength, and the genre expects both.
- Passive voice is correct in a methods section. Do not force a human actor where the procedure is the subject.
- A real citation for every claim is the genre norm, not padding.

## Fiction and creative writing

The vocabulary tells here are the strongest in any genre. A 2026 study measured phrases over-represented in LLM fiction against human baselines and found some at more than a thousand times the human rate:

- names: Elara, Elias, Kael, Lyra, Seraphina, Thorne
- verbs and adjectives: shimmered, flickered, unsettlingly, palpable, sends shivers down your spine
- body-metaphor emotion: "heart hammered against her ribs", "a tightening in the chest", "let out a breath she didn't know she was holding", "felt a profound sense of"
- scene furniture: "the air was thick with", "a testament to", "dust motes danced", "the weight of"

Structural tells from a 61,000-story corpus:

- stating the theme: AI stories end with the moral 77% of the time, humans 52%
- emotion through the body instead of through events and their cost (81% vs 38%). Humans more often name the fact and the consequence: "two of the five resigned the same day"
- tidy single-track plots with clean resolution; human stories leave protagonists' choices morally ambiguous
- per-model habits: Claude runs flat event escalation, GPT over-uses dream sequences, Gemini defaults to external character description

Fix by cutting the over-represented phrase for the plain one, ending on the last event rather than its meaning, and letting a feeling show through what a character does or loses. Do not invent events or interiority the draft does not have; mark the gap for the writer.

Exemptions: a writer's deliberate voice, including ornate or mannered prose, is theirs to keep. Flag it, do not strip it.

## Code, pull requests, and documentation

Tells:

- comments that restate the obvious: "// loop over the items", "This function is responsible for"
- diff-anchored prose in docs and PRs: "we added", "now we handle", "this was changed to". Documentation should describe how the system works in the present tense.
- verbose PR descriptions that narrate the diff line by line instead of stating intent and risk
- gitmoji or emoji in commit messages where the project does not use them
- over-defensive caveats and reimplementation of code that already exists

Fix by deleting comments that repeat the code, describing behaviour in the present tense, and keeping identifiers, flags, filenames, version numbers, and exit codes exact.

Exemptions:

- Bullet lists, tables, and headers are correct in reference docs and release notes.
- Markdown is correct where the destination renders it.
- "robust", "scalable", and similar words have precise technical meaning; keep them when used accurately.
