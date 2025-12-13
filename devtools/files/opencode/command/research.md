---
name: Research
description: Delegate structured research with verification methodology - breaks topics into subtopics, requires multiple source verification, produces evidence-based findings with confidence levels
---

# Research Command

<ResearchTopic>$ARGUMENTS</ResearchTopic>

## When to Use

Use when delegating research that requires verified information from multiple authoritative sources. This command enforces structured research methodology to prevent single-source confidence and unsourced claims.

## Request Structure (REQUIRED)

Before delegating, validate that you have all three:

1. **ResearchTopic** - Clear, specific question or comparison
   - ✅ "Compare PostgreSQL vs. specialized time-series databases for financial data"
   - ✅ "Investigate async testing best practices in TypeScript 5.0+"
   - ❌ "Research databases" (too vague)

2. **StoragePrefix** - Where research output files go (absolute path required)
   - Example: `/research/database-comparison`
   - Example: `~/findings/typescript-testing`

3. **ThingsToAvoid** (optional) - Topics or sources to exclude
   - Example: "Exclude blog posts older than 2 years, avoid paywalled papers"

**STOP if any are missing.** Ask user for clarification before proceeding.

## Research Methodology (5 Phases)

Use the **deep-researcher superpower skill**. Load it first:

```
skill_use(["deep-researcher"])
```

### Phase 1: Topic Scoping (Before Research Starts)
- Break ResearchTopic into specific sub-questions
- Identify primary vs. secondary sources needed
- Define what counts as "evidence" for this topic
- Plan verification strategy before searching

### Phase 2: Source Collection
- Target minimum 3+ independent authoritative sources per major claim
- Collect primary sources (official docs, RFCs, API references)
- Collect secondary sources (analysis, case studies, community discussion)
- Document: URLs, access dates, source type, author/publisher

### Phase 3: Information Collation
- Organize findings by theme or question
- Note where sources agree and disagree
- Identify patterns, outliers, and contradictions

### Phase 4: Verification & Confidence Assessment

For each major claim provide:

| Element | Requirement |
|---------|-------------|
| **Source URL** | Exact location of information |
| **Access Date** | When you retrieved it |
| **Source Type** | Official docs, academic, news, community, blog |
| **Author/Publisher** | Who created this content |
| **Confidence Level** | HIGH (3+ independent agree), MEDIUM (2 sources), LOW (single source) |
| **Contradictions** | Any disagreeing sources and explanation |

### Phase 5: Structured Output

Research produces 5 files in StoragePrefix:

```
<storage-prefix>/
├── <topic>-thinking.md       # Methodology, decisions, assumptions
├── <topic>-research.md       # Raw findings organized by theme
├── <topic>-verification.md   # Source credibility matrix, evidence audit
├── <topic>-insights.md       # Key patterns and strategic implications
└── <topic>-summary.md        # Executive summary with confidence levels
```

## Delegation Instructions

1. **Load the skill:**
   ```
   skill_use(["deep-researcher"])
   ```

2. **Validate request structure:**
   - [ ] Topic is specific (not vague like "research X")
   - [ ] StoragePrefix is provided (absolute path)
   - [ ] ThingsToAvoid stated (or confirmed not needed)
   - If ANY missing, STOP and ask user.

3. **Delegate to deep-researcher subagent:**
   ```
   task(
     description: "Research [ResearchTopic]",
     subagent_type: "deep-researcher-subagent",
     prompt: "Research: [ResearchTopic]
              Storage: [StoragePrefix]
              Avoid: [ThingsToAvoid]
              
              Produce findings with 3+ independent sources per major claim.
              Document all contradictions and confidence levels."
   )
   ```

4. **Validate output:**
   - [ ] 5 research files exist in StoragePrefix
   - [ ] Every claim has confidence level (HIGH/MEDIUM/LOW)
   - [ ] All contradictions documented with explanations
   - [ ] Evidence trails present (URLs + access dates)
   - [ ] No speculation presented as fact

## Example: Proper Delegation

```
Topic: "Compare async/await vs. callbacks vs. promises in JavaScript testing"
StoragePrefix: "/research/async-testing-patterns"
ThingsToAvoid: "Exclude blog posts pre-2023, avoid marketing content"

Research should cover:
- Modern testing frameworks (Jest, Vitest, Playwright)
- Best practices from official documentation
- Community consensus on recommended patterns
- Edge cases and when each approach is appropriate

Minimum 3+ independent sources per major claim.
Document all contradictions and confidence levels.
```

## What This Enforces

**Prevents:**
- ❌ Vague research requests ("research X") → Rejected, ask for specifics
- ❌ Single-source confidence → Minimum 3 independent sources per major claim
- ❌ Unsourced claims → Every claim has URL + access date + confidence level
- ❌ Ignored contradictions → Documented with explanation
- ❌ Authority validation → Research for truth, not to validate past decisions

**Ensures:**
- ✅ Structured request (topic/storage/avoids) enforces clarity
- ✅ Multiple source verification → HIGH confidence findings
- ✅ Organized output → 5 files for re-reading and citation
- ✅ Explicit confidence levels → Transparent about what you know vs. assume
- ✅ Evidence trails → Every claim traceable to source

## Expected Outcomes

Research suitable for:
- Architecture decision documentation
- Technology evaluation and comparison
- Best practices investigation
- Team training materials
- Decision-making with full evidence trails

**Time investment:** 10-20 hours saved vs. manual research


