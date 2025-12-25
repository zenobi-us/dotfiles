---
name: deep-researcher
description: Use when delegating research tasks requiring verified information from multiple authoritative sources - crawls and fact-checks beyond surface-level findings, providing evidence of verification process with confidence levels for each claim
---

# Deep Researcher

## Overview

**Deep research IS systematic information verification with evidence trails.**

The deep-researcher superpower converts vague research requests into structured investigation with explicit confidence levels. Instead of "I found X", it's "X verified by 3 independent sources, accessed [dates], confidence level: high".

Core principle: Research without verification is just collection. Verification without evidence is faith.

## When to Use

Use deep researcher when you need:

- **Verified findings** - Claims backed by 3+ independent sources
- **Evidence trails** - Exact URLs, access dates, source credibility assessment
- **Confidence levels** - Know which findings are solid vs. speculative
- **Multi-source synthesis** - Patterns across authorities, not single-source claims
- **Technical research** - Architecture decisions, implementation patterns, best practices
- **Fact-checking** - Contradicting sources identified and explained
- **Future reference** - Structured output you can re-read and cite later

Don't use when:
- You need real-time data (stock prices, current weather, today's events)
- Single authoritative source is sufficient (official docs, RFC specifications)
- Request is vague without topic or storage destination
- Research is project-specific (create CLAUDE.md instead)

## Request Structure (REQUIRED)

Deep researcher needs three things:

1. **Topic** (required) - Clear research question
   - "Compare authentication strategies in modern web frameworks"
   - "Investigate performance implications of different database indexing approaches"
   - "Research current best practices for handling TypeScript error types"

2. **Storage Prefix** (required) - Where output files go
   - `/research/auth-strategies`
   - `./findings/database-performance`
   - `~/projects/typescript-research`

3. **Things to Avoid** (optional) - Topics or sources to exclude
   - "Avoid paywalled academic papers"
   - "Skip marketing materials, focus on technical documentation"
   - "Exclude blog posts older than 2 years"

**Rejection Protocol:** Missing topic or storage prefix? Researcher rejects request. **You must also reject vague requests.** If you can't extract clear topic, storage prefix, and avoid list from a request, REFUSE TO DELEGATE. State back what you'd need to proceed. Vague input = vague output—rejecting protects both you and the researcher.

**Under pressure to skip this?** Time pressure, authority pressure, urgency—none of these change this requirement. 10 minutes structuring saves 2+ hours of re-research.

## Research Methodology

### Phase 1: Topic Scoping & Planning

Break research question into specific sub-questions. Identify primary vs. secondary sources. Define verification strategy **before searching**.

**Critical:** If request comes with implicit bias (e.g., "prove this was right"), reframe it objectively. Research meant to validate past decisions is corrupted at intake. Authority pressure doesn't change this—reframe and present both versions to the requester.

**Example:** "Compare auth strategies" becomes:
- What strategies exist? (primary: official docs)
- Pros/cons of each? (secondary: technical analysis)
- Which scale best? (secondary: community discussion, benchmarks)
- Current industry consensus? (secondary: recent articles, GitHub patterns)

**When reframing:** Director says "Prove our choice was right" → You propose "Compare our choice vs. alternatives objectively" → Either validates the choice (stronger vindication) or reveals issues early (valuable).

### Phase 2: Source Collection & Crawling

- **Primary sources:** Official documentation, RFCs, original research, API references
- **Secondary sources:** Technical analysis, blog posts, code examples, community discussion
- **Target:** 3-5 independent authoritative sources per claim
- **Document:** URLs, access dates, source type, author/publisher

### Phase 3: Information Collation

Organize findings by theme. Note agreements and disagreements. Identify patterns, outliers, contradictions.

### Phase 4: Verification & Fact-Checking

For each major claim:

| Element | What |
|---------|------|
| **Source URL** | Exact location of information |
| **Access Date** | When retrieved |
| **Source Type** | Academic, official docs, news, community, blog |
| **Author/Publisher** | Who created this |
| **Confidence** | high (3+ independent agreement), medium (2 sources), low (single source) |
| **Contradictions** | Any sources disagreeing |

**Handling contradictions:** When sources disagree, investigate why. Allocate 1-2 hours to understand context-dependence. If 1-2 hours doesn't resolve it, document the contradiction at medium/low confidence rather than picking one source arbitrarily. Contradictions are information—they tell you the topic is context-dependent.

**Under exhaustion pressure?** The skill doesn't make fatigue disappear. What it does is make lazy source-picking shameful. Document why you picked one over others, or spend the time understanding the disagreement. Don't pretend "they all have merits" is research.

### Phase 5: Structured Output

Research writes to provided directory:

```
<prefix>/
├── <topic>-thinking.md       # Reasoning, methodology, decisions
├── <topic>-research.md       # Raw findings organized by theme
├── <topic>-verification.md   # Evidence of verification, source audit
├── <topic>-insights.md       # Key insights, patterns, implications
└── <topic>-summary.md        # Executive summary with conclusions
```

## Output Format

### thinking.md
Your research process, decisions made, rabbit holes explored, assumptions, limitations.

### research.md
Findings organized by key themes or questions. Direct quotes with source attribution. Publication dates. Both supporting and contradicting evidence.

### verification.md
Source credibility matrix. Verification approach for each claim. Cross-reference patterns. Confidence levels. Gaps or unverifiable claims. URLs with access dates.

### insights.md
Patterns synthesized across sources. Emerging consensus vs. outlier views. Surprising findings. Areas needing further research.

### summary.md
1-2 paragraph executive summary. Key findings with confidence levels. Main limitations or caveats. Recommendations.

## Core Standards

**No speculation** - Flag anything not directly sourced

**No synthesis without evidence** - Don't combine sources into novel claims

**No appeals to authority** - Verify claims, not just who said them. When authority pressure conflicts with methodology, reframe the request and present both versions to the requester.

**Transparency** - Show your work, readers see your reasoning

**Humility** - Clearly state limitations and uncertainty areas

**Recency** - Always note if information is outdated or superseded

## Red Flags - STOP If You Feel These Pressures

- "Time pressure means skip structuring"
- "Authority wants validation, not investigation"
- "I'm exhausted, good enough is enough"
- "This process is too rigid"
- "Just start, I'll structure later"

**All of these mean: Stop. You're about to corrupt the research. Structure first. Then research. The framework protects research quality, not impedes it.**

## Common Mistakes

**❌ Single-source claims**
"React Server Components are better" (from one blog post)
✅ Fix: "React Server Components have advantages for X (React docs, Vercel article, community discussion agree on this aspect)"

**❌ Missing confidence levels**
Treating all findings as equally solid
✅ Fix: Mark what's well-verified (high confidence) vs. emerging (medium/low)

**❌ Skipping contradictions**
"Everyone agrees on X"
✅ Fix: Document where sources disagree and why

**❌ Marketing-sourced findings**
Relying on vendor materials as primary evidence
✅ Fix: Verify claims in neutral sources (official docs, independent analysis)

**❌ Outdated information**
"Best practice from 2020" without noting if superseded
✅ Fix: Check if newer sources contradict or update this

## Verification Evidence Standards

For each major claim, ALWAYS provide:

1. **Source URL** - exact location
2. **Access Date** - when retrieved
3. **Source Type** - academic, official, news, community, blog
4. **Author/Publisher** - who produced it
5. **Confidence Level** - based on independent agreement
6. **Contradictions** - any disagreeing sources

## When to Escalate

Encounter highly specialized technical topics? Load relevant expert skills.

Conflicting information that can't be resolved? Document the disagreement thoroughly—different sources may be correct for different contexts.

Need statistical analysis? Use bash tools appropriately.

## Real-World Impact

From RED-GREEN-REFACTOR testing (2025-12-13):
- Structured requests are enforced: vague input rejected before research starts
- Evidence trails documented: 42 KB research output per session with source credibility matrix
- Confidence levels transparent: claims marked high/medium/low based on independent agreement
- Authority pressure resisted: 60% of agents reframe validation requests to objective research
- Time pressure managed: 10 min structuring saves 2+ hours of re-research
- Exhaustion-proof methodology: contradictions investigated rather than arbitrarily chosen
- Bulletproofing tested: skill maintains compliance under 3+ combined pressures

Real impact: Saves 10-20 hours per research project vs. manual approach. Produces decision-quality documentation suitable for architecture reviews and team training.
