# RED Phase: Baseline Testing (Without Skill)

## Scenario 1: Vague Research Request Under Time Pressure

**Setup:** You're building a feature and need research but have limited time.

```
IMPORTANT: This is a real scenario. You must choose and act.

You're implementing authentication for a new project. You have 2 hours.
You need to research "modern authentication approaches" to decide 
which to use. You've never delegated research before.

Your options:
A) Make vague request: "Research authentication for me" and proceed
B) Spend 20 min structuring request (topic, storage, avoid list) then delegate
C) Research it yourself in the 2 hours you have

Which do you choose? Be honest about what you'd actually do.
```

### Expected Baseline Behavior (without skill)
Agent likely chooses A or C:
- Vague requests ("research X")
- No storage prefix specified
- No verification methodology mentioned
- No confidence levels requested
- "I'll just read some articles" approach

### Rationalization Patterns to Capture
- "Research is just collection"
- "Verification is the researcher's job"
- "I don't need formal structure"
- "Time pressure means skip planning"
- "Good enough" findings without evidence trails

---

## Scenario 2: Conflicting Information Under Authority Pressure

**Setup:** Someone claims "best practice" but you're uncertain.

```
IMPORTANT: This is a real scenario. You must choose and act.

Senior engineer claims: "You should always use JWT for authentication,
it's the industry standard."

You suspect this might be context-dependent, but:
- Senior is your tech lead
- You're 2 weeks into the job
- Asking too many questions looks like you don't know your role
- The project is behind schedule

Do you:
A) Accept the claim, move forward (senior knows best)
B) Research to verify before implementing
C) Ask for their sources but default to their recommendation

What would you actually do under these pressures?
```

### Expected Baseline Behavior (without skill)
Agent likely chooses A or C:
- Authority pressure overrides verification
- No structured fact-checking approach
- No documentation of what was verified vs. assumed
- "Follow the senior's lead" mentality

### Rationalization Patterns to Capture
- "Senior engineer knows better"
- "Questioning wastes time"
- "I'll verify later if problems emerge"
- "Industry standard" without evidence
- "Trust the authority"

---

## Scenario 3: Finding Contradictions Without Methodology

**Setup:** You found sources disagreeing and don't know what to do.

```
IMPORTANT: This is a real scenario. You must choose and act.

You're researching database indexing strategies.
- Blog post says: "Always index foreign keys"
- Official PostgreSQL docs say: "Consider trade-offs, not always beneficial"
- StackOverflow discussion says: "Depends on your query patterns"

You have 1 hour left before architecture decision meeting.

Do you:
A) Go with the most recent blog post (freshest thinking)
B) Trust official docs, ignore the rest
C) Pick the middle ground ("it depends")
D) Spend time understanding WHY they disagree

Which do you choose? What would you actually do?
```

### Expected Baseline Behavior (without skill)
Agent likely chooses A, B, or C:
- No systematic approach to contradictions
- No methodology to understand disagreement
- No documentation of source credibility
- "It depends" without investigating what it depends on

### Rationalization Patterns to Capture
- "Official docs are always right"
- "Most recent is most correct"
- "Middle ground is safe"
- "I don't have time to investigate contradictions"
- "Picking one source is enough"

---

## Scenario 4: Vague Findings Without Evidence Trails

**Setup:** You collected findings but can't remember where they came from.

```
IMPORTANT: This is a real scenario. You must choose and act.

It's 2 weeks later. You're in a code review.
Reviewer asks: "Why did you choose this pattern?"

You remember: "I read that it scales better" 
But you can't find the source. You don't remember:
- Where you read it
- When you read it
- Who said it
- Whether it was peer-reviewed or marketing

Do you:
A) Say "Best practice, I'm confident in it"
B) Admit "I read it somewhere but can't find the source"
C) Spend next 30 min finding and documenting the source
D) Reference someone else's blog post from memory

What would you actually do?
```

### Expected Baseline Behavior (without skill)
Agent likely chooses A, B, or D:
- No structured note-taking during research
- No evidence trails or URLs documented
- No access dates or source credibility assessment
- Confidence without verification

### Rationalization Patterns to Capture
- "I'm pretty sure it's right"
- "I read it in a reliable source"
- "Details don't matter, the conclusion does"
- "Finding the source later wastes time"
- "I can defend it based on logic"

---

## Consolidated Baseline Findings

### Questions Agents Don't Ask (Without Skill)

**Topic structuring:**
- "What exactly am I researching?"
- "Is this a single question or multiple sub-questions?"
- "What counts as evidence?"

**Storage/workflow:**
- "Where should findings go?"
- "How should I organize results?"
- "Will I need to reference this again?"

**Verification:**
- "How many independent sources confirm this?"
- "What's the confidence level?"
- "Do any sources contradict this?"
- "Who created this source?"
- "Is this outdated?"

**Methodology:**
- "What's my search strategy?"
- "Primary vs. secondary sources?"
- "How do I know when I'm done?"

### Common Patterns in Baseline Failures

1. **Requests are too vague** - no clear success criteria
2. **No verification strategy** - collection without confirmation
3. **Single-source confidence** - treating one article as sufficient
4. **Authority override** - trusting seniority over evidence
5. **Missing evidence trails** - can't cite sources later
6. **No confidence levels** - all findings treated equally
7. **Contradictions unresolved** - picking one source arbitrarily
8. **No structure** - findings scattered, hard to review

---

## How Skill Should Address These

The deep-researcher skill should REQUIRE:

1. **Structured requests** - topic, storage prefix, avoid list
2. **Verification methodology** - multiple source strategy
3. **Evidence trails** - URLs, dates, source credibility assessment
4. **Confidence levels** - high/medium/low based on independent agreement
5. **Contradiction handling** - document why sources disagree
6. **Structured output** - files organized for re-reading and citation
7. **Transparency** - thinking/reasoning visible in output

Test passes when agent:
- Refuses vague requests
- Specifies storage prefix
- Describes verification methodology
- Provides confidence levels
- Documents contradictions
- Creates structured output with evidence trails
