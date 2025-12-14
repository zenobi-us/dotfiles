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

3. **Break topic into parallel subtopics:**
   - Decompose ResearchTopic into 3-5 independent subtopics
   - Each subtopic should be researchable independently
   - Subtopics should cover different aspects (e.g., performance, security, compatibility, use cases)
   - Plan to merge findings in final synthesis phase

4. for each subagent, search for relevant skills using skill_find and load them to enhance research methodology.
   - synthesise some adjective-nouns like "performance analysis", "security evaluation", "compatibility testing", "use case investigation"
   - synthesise some noun only lists like "databases", "JavaScript", "cloud computing", "network protocols"
   - then search for skills with skill_find using those keywords as a comma-separated list. skill_find(["keyword1", "keyword2", "phrase1" ...])

5. **Delegate subtopics to parallel subagents:**
   ```
   # Launch ALL subtopic researches in parallel (single message, multiple task calls)
   
   task(
     description: "Research [Subtopic 1]",
     subagent_type: "deep-researcher-subagent",
     prompt: "Research subtopic: [Subtopic 1]
              Parent topic: [ResearchTopic]
              Storage: [StoragePrefix]/subtopic-1
              Avoid: [ThingsToAvoid]
              
              CRITICAL: skill_use([DiscoveredSkillFor1, ...]) before starting research.
              Load any applicable skills to enhance your research methodology.
              
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
              Storage: [StoragePrefix]/subtopic-2
              Avoid: [ThingsToAvoid]
              
              CRITICAL: skill_use([DiscoveredSkillFor2, ...]) before starting research.
              Load any applicable skills to enhance your research methodology.
              
              Produce findings with 3+ independent sources per major claim.
              Document all contradictions and confidence levels.
              Mark all biases with [BiasType] where applicable.
              Provide citations to verify claims. [URLs + access dates] [CRITICAL]
              "
   )
   
   # ... repeat for all subtopics in PARALLEL
   ```

6. **Validate subagent outputs:**
   - [ ] Each subtopic produced 5 research files in its subdirectory
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
StoragePrefix: "/research/async-testing-patterns"
ThingsToAvoid: "Exclude blog posts pre-2023, avoid marketing content"

Subtopics (researched in PARALLEL):
1. "Modern testing frameworks support for async patterns (Jest, Vitest, Playwright)"
2. "Performance characteristics and benchmarks of each pattern"
3. "Error handling and debugging capabilities comparison"
4. "Community consensus and best practices from official documentation"
5. "Real-world use cases and when each approach is appropriate"

Each subagent will:
- Use skill_find to discover testing-related, JavaScript, or comparison skills
- Load applicable skills to enhance research methodology
- Produce 5 research files in subtopic-specific directory
- Include minimum 3+ independent sources per major claim
- Document all contradictions and confidence levels

Final synthesis will merge all parallel findings into unified analysis.
```

## Parallel Research Architecture

### Key Principles

1. **Subtopic Independence:** Each subtopic must be researchable without blocking others
2. **Concurrent Execution:** Launch ALL subtopic tasks in a single message (use `task` tool multiple times)
3. **Skill Discovery:** Each subagent MUST run `skill_find` to discover relevant domain skills before researching
4. **Unified Storage:** Subtopic results stored in `[StoragePrefix]/subtopic-N/` directories
5. **Synthesis Phase:** After all parallel tasks complete, merge findings into unified analysis

### Subagent Instructions Template

When delegating to subagents, include this in the prompt:

```
BEFORE RESEARCHING:
1. Run skill_find to discover skills relevant to: [SUBTOPIC_KEYWORDS]
2. Load any discovered skills that enhance research methodology
3. Document which skills you loaded and why

DURING RESEARCH:
- Target 3+ independent authoritative sources per major claim
- Use loaded skills to validate findings and cross-reference sources
- Document contradictions and confidence levels explicitly

OUTPUT:
- Produce 5 research files in assigned subdirectory
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


