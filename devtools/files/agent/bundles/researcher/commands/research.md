---
description: Delegate structured research with verification methodology - breaks topics into subtopics, requires multiple source verification, produces evidence-based findings with confidence levels
---

# Research Command

## UserRequest

```md
UserRequest: $ARGUMENTS
ResearchTopic: $ARGUMENTS
```

## When to Use

Use when delegating research that requires verified information from multiple authoritative sources. This command enforces structured research methodology to prevent single-source confidence and unsourced claims.

Use existing note or project planning storage if defined; otherwise store research documents in `.memory/<topic>/...` as markdown files. This command is ideal for architecture decision documentation, technology evaluation, best practices investigation, and team training materials.

## Request Structure (REQUIRED)

Before delegating, validate that you have:

1. **ResearchTopic** - Clear, specific question or comparison
   - ✅ "Compare PostgreSQL vs. specialized time-series databases for financial data"
   - ✅ "Investigate async testing best practices in TypeScript 5.0+"
   - ❌ "Research databases" (too vague)

2. **ThingsToAvoid** (optional) - Topics or sources to exclude
   - Example: "Exclude blog posts older than 2 years, avoid paywalled papers"

3. **Storage Path** (optional) - If existing note or project planning storage system is already defined, use that. Otherwise store research documents in `.memory/<topic>/...` as markdown files.

**STOP if ResearchTopic is missing.** Ask user for clarification before proceeding.

## Research Methodology (5 Phases)

Use the **deep-researcher** skill before starting research.

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

If existing note or project planning storage system is already defined, use that. Otherwise store research documents in `.memory/<topic>/...` as markdown files.

Output must be a single markdown file per research unit with this required filename prefix:

```
research-{hash}-{parent_topic}-{child_topic}.md
```

Inside that file, use these sections (not separate files):
- ## Thinking
- ## Research
- ## Verification
- ## Insights
- ## Summary

## Delegation Instructions

1. **Use the deep-researcher skill.**

2. **Validate request structure:**
   - [ ] Topic is specific (not vague like "research X")
   - [ ] ThingsToAvoid stated (or confirmed not needed)
   - [ ] Storage path (optional) acknowledged, or fallback `.memory/<topic>/...` selected
   - If the topic is missing, STOP and ask user.

3. **Break topic into parallel subtopics:**
   - Decompose ResearchTopic into 3-5 independent subtopics
   - Each subtopic should be researchable independently
   - Subtopics should cover different aspects (e.g., performance, security, compatibility, use cases)
   - Plan to merge findings in final synthesis phase

4. for each subagent, discover relevant skills and use them to enhance research methodology.
   - synthesise some adjective-nouns like "performance analysis", "security evaluation", "compatibility testing", "use case investigation"
   - synthesise some noun only lists like "databases", "JavaScript", "cloud computing", "network protocols"
   - then identify skills that match those keywords and use them.

5. **Delegate subtopics to parallel subagents:**
   ```
   # Launch ALL subtopic researches in parallel (single message, multiple task calls)

   task(
     description: "Research [Subtopic 1]",
     subagent_type: "deep-researcher-subagent",
     prompt: "Research subtopic: [Subtopic 1]
              Parent topic: [ResearchTopic]
              Avoid: [ThingsToAvoid]

              CRITICAL: Use any discovered skills before starting research.
              Load any applicable skills to enhance your research methodology.
              Use the required filename prefix: research-{hash}-{parent_topic}-{child_topic}.md

              Produce findings with 3+ independent sources per major claim.
              Document all contradictions and confidence levels.
              Mark all biases with [BiasType] where applicable.
              Provide citations to verify claims. [URLs + access dates] [CRITICAL]
              "
   )

   task(
     description: "Research [Subtopic 2]",
     subagent_type: "deep-researcher-subagent",
     prompt: "Research subtopic: [Subtopic 2]
              Parent topic: [ResearchTopic]
              Avoid: [ThingsToAvoid]

              CRITICAL: Use any discovered skills before starting research.
              Load any applicable skills to enhance your research methodology.
              Use the required filename prefix: research-{hash}-{parent_topic}-{child_topic}.md

              Produce findings with 3+ independent sources per major claim.
              Document all contradictions and confidence levels.
              Mark all biases with [BiasType] where applicable.
              Provide citations to verify claims. [URLs + access dates] [CRITICAL]
              "
   )

   # ... repeat for all subtopics in PARALLEL
   ```

6. **Validate subagent outputs:**
   - [ ] Each subtopic produced research outputs in the existing storage system or `.memory/<topic>/...`
   - [ ] Every claim has confidence level (HIGH/MEDIUM/LOW)
   - [ ] All contradictions documented with explanations
   - [ ] Evidence trails present (URLs + access dates)
   - [ ] Subagents documented which skills they loaded and why

7. **Synthesize parallel findings:**
   - Merge subtopic findings into unified analysis
   - Cross-reference contradictions between subtopics
   - Identify patterns and relationships across research areas
   - Update confidence levels based on synthesis

## Example: Proper Delegation with Parallel Subtopics

```
Topic: "Compare async/await vs. callbacks vs. promises in JavaScript testing"
Storage: (optional; use existing note/project planning storage if defined, otherwise `.memory/<topic>/...`)
ThingsToAvoid: "Exclude blog posts pre-2023, avoid marketing content"

Subtopics (researched in PARALLEL):
1. "Modern testing frameworks support for async patterns (Jest, Vitest, Playwright)"
2. "Performance characteristics and benchmarks of each pattern"
3. "Error handling and debugging capabilities comparison"
4. "Community consensus and best practices from official documentation"
5. "Real-world use cases and when each approach is appropriate"

Each subagent will:
- Discover testing-related, JavaScript, or comparison skills
- Use applicable skills to enhance research methodology
- Produce research outputs as single files using prefix: research-{hash}-{parent_topic}-{child_topic}.md (stored in existing note/project planning storage or `.memory/<topic>/...`)
- Include minimum 3+ independent sources per major claim
- Document all contradictions and confidence levels

Final synthesis will merge all parallel findings into unified analysis.
```

## Parallel Research Architecture

### Key Principles

1. **Subtopic Independence:** Each subtopic must be researchable without blocking others
2. **Concurrent Execution:** Launch ALL subtopic tasks in a single message (use `task` tool multiple times)
3. **Skill Discovery:** Each subagent MUST discover relevant domain skills before researching
4. **Unified Storage:** Use existing note or project planning storage if defined; otherwise store outputs in `.memory/<topic>/...` as single files with prefix `research-{hash}-{parent_topic}-{child_topic}.md`.
5. **Synthesis Phase:** After all parallel tasks complete, merge findings into unified analysis

### Subagent Instructions Template

When delegating to subagents, include this in the prompt:

```
BEFORE RESEARCHING:
1. Discover skills relevant to: [SUBTOPIC_KEYWORDS]
2. Use any discovered skills that enhance research methodology
3. Use existing note/project planning storage if defined; otherwise use `.memory/<topic>/...`
4. Use the required filename prefix: research-{hash}-{parent_topic}-{child_topic}.md
5. Document which skills you used and why

DURING RESEARCH:
- Target 3+ independent authoritative sources per major claim
- Use loaded skills to validate findings and cross-reference sources
- Document contradictions and confidence levels explicitly

OUTPUT:
- Produce research outputs in the existing storage system or `.memory/<topic>/...`
- Include skill discovery results in thinking.md
- Ensure all claims are evidence-traceable
```

## What This Enforces

**Prevents:**
- ❌ Vague research requests ("research X") → Rejected, ask for specifics
- ❌ Single-source confidence → Minimum 3 independent sources per major claim
- ❌ Unsourced claims → Every claim has URL + access date + confidence level
- ❌ Ignored contradictions → Documented with explanation
- ❌ Authority validation → Research for truth, not to validate past decisions

**Ensures:**
- ✅ Structured request (topic/avoids + optional storage) enforces clarity
- ✅ Multiple source verification → HIGH confidence findings
- ✅ Organized output → research files stored in an existing note/project planning system or `.memory/<topic>/...` for re-reading and citation
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
