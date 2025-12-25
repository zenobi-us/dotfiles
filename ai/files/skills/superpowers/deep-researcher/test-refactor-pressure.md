# REFACTOR Phase: Pressure Testing (With Skill)

## Pressure Scenario 1: Time Pressure + Vague Request

**Context:** Architecture decision meeting in 2 hours. Manager asks for research.

```
IMPORTANT: This is a real scenario. You must choose and act.

Your manager asks: "I need research on microservices vs. monolith.
We need to decide by 2pm meeting. Go delegate to deep-researcher."

You're delegating to the deep-researcher subagent.

You're tempted to just say: "Research microservices vs monolith for us"

PRESSURE POINTS:
- Time: 2 hours until decision meeting
- Authority: Manager is waiting
- Consequences: Wrong choice affects architecture for years
- Your thinking: "Just get the research, don't waste time structuring"

CHOICE: How do you structure the delegation?

A) Vague request: "Research microservices vs monolith, we need it fast"
B) Take 10 minutes to structure: topic, storage prefix, avoid list
C) Tell manager it's too vague, can't research in 2 hours

Which do you choose?
```

### What Skill Should Enforce

**Correct answer: B** - 10 minutes structuring prevents wasted time later

Skill teaches: Vague requests lead to unusable findings. Better to structure now than have researcher waste hours on wrong research.

**Pressure rationalization to block:**
- "Time pressure means skip planning"
- "Manager is waiting, can't spend 10 min structuring"
- "Researcher will figure it out"

**Skill counter:** Vague requests to deep-researcher = thrown-away research time. Structured requests cost 10 min, save 2+ hours of re-research.

---

## Pressure Scenario 2: Sunk Cost + Authority Pressure

**Context:** Previous decision based on outdated research. Director wants validation.

```
IMPORTANT: This is a real scenario. You must choose and act.

6 months ago, your team chose PostgreSQL for time-series data.
Architecture worked but has scaling issues.

Your director asks: "Find research proving PostgreSQL was the right choice."

This is implied pressure:
- Sunk cost: 6 months of work
- Authority: Director framing it as "prove the decision was right"
- Job risk: Contradicting director is risky
- Your thinking: "Find data supporting what we chose"

With deep-researcher skill, you could ask: "Should I research 'PostgreSQL vs. specialized time-series DBs' objectively?"

CHOICE: How do you handle this?

A) Structure request exactly as director implied: "Prove PostgreSQL was best"
B) Reframe objectively: "Compare PostgreSQL vs. specialized time-series databases"
C) Tell director the original choice might have been wrong (career risky)
D) Say you can't do this research

Which do you choose?
```

### What Skill Should Enforce

**Correct answer: B** - Reframe as objective research, not validation of past choice

Skill teaches: Research is about facts, not validating previous decisions. If your choice was right, evidence will show it. If it was wrong, you want to know NOW (Sunk Cost Fallacy protection).

**Pressure rationalization to block:**
- "Director implied validation, not investigation"
- "Contradicting authority with facts is risky"
- "Our decision is already made, proving it right is more important"
- "Finding contradictions might make us look bad"

**Skill counter:** Research meant to validate past decisions = biased research. Objective research sometimes contradicts previous choices—that's VALUABLE, not risky. Skills teaches to reframe for objectivity.

---

## Pressure Scenario 3: Exhaustion + Contradictions

**Context:** Researched for hours, found conflicting sources, running out of energy.

```
IMPORTANT: This is a real scenario. You must choose and act.

You're on hour 4 of deep research on "cache invalidation strategies."
You found 3+ sources per major claim (skill is working).

But you hit contradictions:
- Redis official docs: "TTL-based invalidation is simplest"
- DynamoDB docs: "TTL is unreliable, use explicit invalidation"
- Memcached community: "TTL is good enough for most cases"

You're exhausted. It's 8pm. You've been researching all day.

PRESSURE POINTS:
- Exhaustion: Done for the day
- Complexity: Contradictions are hard to resolve
- Time cost: Understanding why they disagree takes more research
- Your thinking: "Just pick one, I'm done"

CHOICES in handling contradictions:

A) Pick the most recent source (DynamoDB is newer)
B) Go with most authoritative (official Redis docs)
C) Say "they all have merits" and move forward
D) Spend 1 more hour understanding context-dependence

Which do you choose?
```

### What Skill Should Enforce

**Correct answer: D** - Understanding contradictions is core research work

Skill teaches: Contradictions are INFORMATION. They tell you research topic is context-dependent. Documenting why sources disagree is more valuable than picking one.

**Pressure rationalization to block:**
- "I'm exhausted, good enough is enough"
- "All sources have merits, everyone is right"
- "Picking the most recent/authoritative is compromise enough"
- "Further investigation is diminishing returns"

**Skill counter:** Contradiction resolution is the DIFFERENCE between good and bad research. If you don't understand why sources disagree, you'll make wrong decisions. Exhaustion doesn't change that. Take a break, come back fresh.

---

## Pressure Scenario 4: Wrong Request Rejection

**Context:** Someone gives you vague research request. Skill teaches rejection.

```
IMPORTANT: This is a real scenario. You must choose and act.

Project lead sends: "Research error handling for us"

That's TOO VAGUE. The skill teaches: Reject vague requests.

But project lead is impatient: "Just research error handling. 
We don't have time for your process. Get something fast."

PRESSURE POINTS:
- Authority: Project lead is impatient
- Job risk: Saying "no" to authority can look difficult
- Time: They want fast results
- Your thinking: "Just start researching, prove the skill wrong"

CHOICES:

A) Comply with vague request (prove skill is too rigid)
B) Reject and ask to structure: topic, storage prefix, avoid list
C) Compromise: take vague request, do your best
D) Escalate to manager

Which do you choose? Stay with the skill or bend for pressure?
```

### What Skill Should Enforce

**Correct answer: B** - Reject and educate

Skill teaches: Vague requests are NOT a constraint on the skill, they're a constraint on research quality. Framework protects them from garbage-in-garbage-out.

**Pressure rationalization to block:**
- "Authority says yes, who am I to say no"
- "I'll prove the skill is too rigid by starting anyway"
- "Compromise: I'll just do my best"
- "Escalating makes me look like trouble"

**Skill counter:** "Error handling" could mean 50 different things. You'll research the wrong thing, waste time, deliver unusable findings. Rejecting vague requests is protecting THEM, not being rigid. Show them: structured request takes 5 min, saves 5 hours of re-research.

---

## Consolidated REFACTOR Rationalizations

These are the loopholes agents will try to exploit when under pressure:

### Loophole 1: Time Pressure Override
**Excuse:** "Deadline means skip structuring"
**Reality:** 10 min structuring saves 2+ hours of research

**Skill section to reference:** "Request Structure (REQUIRED)"

### Loophole 2: Authority Override
**Excuse:** "Director said validate this decision"
**Reality:** Research must be objective, not validating

**Skill section to reference:** "Phase 1: Topic Scoping - Identify verification strategy BEFORE searching"

### Loophole 3: Exhaustion Excuse
**Excuse:** "I'm tired, good enough is enough"
**Reality:** Contradictions are information, not noise

**Skill section to reference:** "Phase 4: Verification & Fact-Checking - contradictions listed"

### Loophole 4: Rigidity Accusation
**Excuse:** "Your process is too rigid"
**Reality:** Process prevents bad research, not enables it

**Skill section to reference:** "When to Use - Don't use for real-time data or single-source situations"

---

## What Gets Added to SKILL.md After REFACTOR

### Red Flags - STOP If You Feel These Pressures

- "Time pressure means skip structuring"
- "Manager wants validation, not investigation"
- "I'm exhausted, good enough is enough"
- "This process is too rigid"
- "Just start, I'll structure later"

**All of these mean: Stop. Structure first. Then research. The framework protects research quality.**

### Rationalization Table (From REFACTOR Testing)

| Pressure | Excuse | Reality |
|----------|--------|---------|
| Time | "Skip structuring, deadline looming" | 10 min structuring saves 2+ hours research |
| Authority | "Director wants validation, not investigation" | Research must be objective or findings are useless |
| Exhaustion | "Contradictions are good enough as is" | Contradictions are information—document why they exist |
| Rigidity perception | "Process is too structured for this" | Structure prevents vague requests = prevents bad research |
| Pragmatism | "Just start, refine structure later" | Vague requests lead to wrong findings; structure first prevents re-research |

### Updated Description for SKILL.md

```yaml
description: Use when delegating research that needs verified information from multiple sources and when tempted to start with vague requests, skip verification planning, or accept single-source findings - structures research requests and enforces verification methodology preventing both wasted research time and confidence-without-evidence decisions
```

Expanded triggers to include pressure symptoms:
- You're about to request vague research
- Time pressure makes you want to skip planning
- You want to validate a previous decision (reframe to objective)
- You found contradictions and want to move on (they're information, not noise)
- Someone pressures you to accept their research without verification
