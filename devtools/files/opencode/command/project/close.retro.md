# Interactive Retrospective Discussion

You are conducting an interactive retrospective discussion to capture lessons learned and insights. Follow this systematic approach to facilitate a question-and-answer flow that discovers and documents valuable project insights.

**Input:** $ARGUMENTS (epic name or project name)
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> All [Planning Artifacts] are managed through the skills listed above.
> Follow their guidance for creation, updates, and linking.
> Do not try to use alternative methods.

## Step 1: Validate and Clarify Input

**Check the input argument ($ARGUMENTS):**

1. **No input provided**
   ```
   ❌ Error: No scope specified
   
   Please specify what retrospective you want to conduct:
   
   /project:closing:retrospective "epic-name"     → Conduct epic retrospective
   /project:closing:retrospective "project-name"  → Conduct project retrospective
   
   Examples:
   /project:closing:retrospective "user-authentication"
   /project:closing:retrospective "my-project"
   
   STOP - Wait for user input before proceeding
   ```

2. **Input is vague or ambiguous** (too generic, doesn't match artifacts)
   
   Examples of vague input:
   - "project" or "epic" (generic, not specific)
   - "work" (too vague)
   - "something about auth" (ambiguous)
   
   ```
   ❌ Error: Scope is too vague
   
   Please provide a specific epic or project name. Be precise:
   
   VAGUE:        "the authentication stuff"
   CLEAR:        "user-authentication" or "auth-epic"
   
   VAGUE:        "this project"
   CLEAR:        "dotfiles" or "my-saas-app"
   
   STOP - Wait for clear input before proceeding
   ```

3. **Input mentions both epic AND project scope**
   
   Example: "retrospective for search epic in my project"
   
   ```
   ❌ Error: Ambiguous scope (both epic and project mentioned)
   
   Retrospectives should focus on ONE scope level:
   - Epic retrospective: Focuses on one epic's work
   - Project retrospective: Focuses on entire project
   
   Which do you want to discuss?
   
   /project:closing:retrospective "search"              ← Epic scope
   /project:closing:retrospective "my-project"         ← Project scope
   
   STOP - Wait for scoped input before proceeding
   ```

4. **Input is clear and epic-focused**
   
   ```
   ✅ Confirmed: Epic retrospective for "{epic-name}"
   
   Proceeding with interactive retrospective discussion...
   Continue to Step 2: Start Q&A Facilitation
   ```

5. **Input is clear and project-focused**
   
   ```
   ✅ Confirmed: Project retrospective for "{project-name}"
   
   Proceeding with interactive retrospective discussion...
   Continue to Step 2: Start Q&A Facilitation
   ```

## Step 2: Verify Artifact Existence and Determine Mode

**For Epic Retrospectives:**

1. Check if [Epic] artifact exists in storage
2. Check if retrospective artifact already exists (1.9.1, 1.9.2, etc.)
3. Determine mode:
   - **CREATE**: First retrospective for this epic
   - **UPDATE**: Existing retrospective found, append new insights

**For Project Retrospectives:**

1. Check if retrospective artifact already exists (0.9.1, etc.)
2. Determine mode:
   - **CREATE**: First retrospective for this project
   - **UPDATE**: Existing retrospective found, append new insights

**Document the mode:**
- "Creating new retrospective for {name}"
- "Updating existing retrospective for {name}"

## Step 3: Open the Discussion

**Start with context-setting:**

```
Let's conduct a retrospective for {scope}: {name}

I'll ask you a series of questions to understand what happened, 
what worked well, what didn't, and what you learned.

Feel free to elaborate. This is your opportunity to capture 
important lessons and insights.

Ready? Let's begin.
```

## Step 4: Facilitate Interactive Q&A Flow

**Follow this question sequence, adapted based on responses:**

### Phase 1: Discovery (Understanding What Happened)

**Initial Questions:**
1. "What was the primary goal or objective of this {epic/project}?"
2. "How long did it take from start to finish?" (timeline)
3. "What was the biggest challenge you faced?"

**Follow-up Pattern:**
- User answers challenge question
- You ask: "Tell me more about that. What made it difficult?"
- Listen to answer
- You ask: "How did you handle it?"
- Listen to answer
- Continue deepening until you understand the challenge fully

### Phase 2: Successes (What Went Well)

**Questions:**
1. "What part of this {epic/project} went exceptionally well?"
2. "What were you most proud of completing?"
3. "Which decisions or approaches worked great?"

**Follow-up Pattern:**
- User mentions a success
- You ask: "What made that work so well?"
- Listen to answer
- You ask: "Can we apply this pattern to other work?"
- Continue until success is fully understood

### Phase 3: Surprises and Learnings

**Questions:**
1. "What surprised you most during this work?"
2. "What did you learn that you didn't expect?"
3. "What would you do differently if you did this again?"

**Follow-up Pattern:**
- User shares learning
- You ask: "Why do you think that happened?"
- Listen to answer
- You ask: "How will this change your approach next time?"

### Phase 4: Blockers and Pain Points

**Questions:**
1. "What blocked your progress or slowed you down?"
2. "Where did you feel friction in the process?"
3. "What would have made this easier?"

**Follow-up Pattern:**
- User describes blocker
- You ask: "How much time did this cost?"
- Listen to answer
- You ask: "Can we prevent this next time?"

### Phase 5: Team and Collaboration

**Questions:**
1. "How was the collaboration on this work?"
2. "Were there any communication gaps?"
3. "What team strengths showed up?"

**Follow-up Pattern:**
- User comments on collaboration
- You ask: "What could we improve?"
- Listen to answer
- You ask: "Do you have recommendations?"

### Phase 6: Looking Forward

**Questions:**
1. "What should we start doing next time?"
2. "What should we stop doing?"
3. "What technical debt was created?"
4. "What are the top 3 improvements for next iteration?"

**Follow-up Pattern:**
- User suggests improvement
- You ask: "How would that help?"
- Listen to answer
- You ask: "When should we prioritize this?"

## Step 5: Capture Responses During Q&A

**As the user answers, document:**

1. **Their exact quotes** (when meaningful)
2. **Key insights** (what matters most)
3. **Action items** (what to do differently)
4. **Technical decisions** (what worked/didn't)
5. **Team dynamics** (collaboration observations)
6. **Timeline impacts** (how events affected schedule)

**Format captured data:**
```
CHALLENGE: Performance optimization
INSIGHT: "We didn't profile early enough"
IMPACT: Added 3 days to timeline
LEARNING: Profile performance before implementation
NEXT TIME: Add performance profiling task to story planning
```

## Step 6: Synthesize and Confirm Understanding

**After gathering insights, synthesize:**

```
Let me summarize what I'm hearing:

SUCCESSES:
- {success 1}
- {success 2}
- {success 3}

CHALLENGES:
- {challenge 1} → Learning: {learning}
- {challenge 2} → Learning: {learning}

ACTION ITEMS:
- {action 1}
- {action 2}
- {action 3}

Does this capture it accurately? Anything I missed?
```

**User confirms or adds more details**

## Step 7: Ask if Discussion is Complete

**Check if retrospective is thorough:**

```
Before I record this retrospective, do you want to add anything else?

- Other challenges or successes not mentioned?
- Additional learnings or decisions?
- Other team members' perspectives?
- Anything else that matters for next time?
```

**User adds more OR confirms complete**

## Step 8: Delegate Artifact Creation/Update to Subskill

**Once discussion is complete, delegate to subskill:**

For **CREATE** (new retrospective):
> **Delegate to subskill:**
> Create a [Retrospective] artifact for the epic/project: "{name}"
> 
> 1. Use `skills_projectmanagement_info_planning_artifacts` to understand structure
> 2. Create artifact in storage backend with:
>    - Type: Retrospective
>    - Scope: Epic (1.9.x) or Project (0.9.x)
>    - Title: "{name}"
> 3. Populate artifact with:
>    - Discussion summary and context
>    - Successes and what went well
>    - Challenges and blockers faced
>    - Key learnings and discoveries
>    - Action items and improvements
>    - Team observations
>    - Recommendations for next work
> 4. For Epic: Link to parent [Epic] artifact
> 5. Return artifact identifier (e.g., 1.9.1-retrospective-{epic-name})

For **UPDATE** (appending to existing):
> **Delegate to subskill:**
> Update existing [Retrospective] artifact for: "{name}"
>
> 1. Fetch existing retrospective artifact from storage
> 2. Append new discussion insights to:
>    - Additional successes discovered
>    - New challenges identified
>    - Updated learnings and perspectives
>    - Additional action items
> 3. Maintain version/update history
> 4. Return updated artifact identifier

## Step 9: Present Retrospective Record

**After artifact is created/updated, present summary:**

```
✅ Retrospective recorded for {scope}: {name}

ARTIFACT: {artifact-id}
MODE: {Created | Updated}
SCOPE: {Epic | Project}

KEY OUTCOMES:
- Successes documented: {count}
- Challenges identified: {count}
- Action items recorded: {count}
- Learnings captured: {count}

NEXT STEPS:
- Review artifact: [[{artifact-id}]]
- Share with team: {recommendations}
- Track action items: {who, when}
```

## Step 10: Offer to Continue

**Ask if user wants to continue retrospective work:**

```
This retrospective is recorded. Do you want to:

1. Conduct retrospective for another epic/project?
   /project:closing:retrospective "other-epic-name"

2. Review this retrospective?
   View artifact: [[{artifact-id}]]

3. Update this retrospective later?
   Run command again with same name to append new insights

What's next?
```

## Key Design Principles

**Facilitation Pattern:**
- ✅ Ask genuine questions (not rhetorical)
- ✅ Listen to answers fully before next question
- ✅ Follow up with clarifying questions
- ✅ Go deeper when insights matter
- ✅ Confirm understanding before moving on

**Interaction Style:**
- ✅ Conversational, not directive
- ✅ User-led (their experience matters)
- ✅ Genuine curiosity about their perspective
- ✅ Respect for their time and insights
- ✅ Clear, plain language

**Reusability:**
- ✅ Can run multiple times per epic
- ✅ Each run adds to existing retrospective
- ✅ Updates create version history
- ✅ Iterative discovery enabled
- ✅ Longitudinal insights preserved

**Scoping:**
- ✅ Epic-level: 1.9.1, 1.9.2, etc. per epic
- ✅ Project-level: 0.9.1 for entire project
- ✅ Clear input validation
- ✅ No ambiguity about scope
- ✅ Supports focused discussions

## Success Criteria

This retrospective command succeeds when:

1. **Input Validation**
   - ✅ No input → Request input
   - ✅ Vague input → Request clarity
   - ✅ Ambiguous scope → Request epic or project
   - ✅ Clear epic → Begin epic retrospective
   - ✅ Clear project → Begin project retrospective

2. **Interactive Flow**
   - ✅ Questions are genuinely asked
   - ✅ User responses are listened to
   - ✅ Follow-up questions deepen understanding
   - ✅ Conversation feels natural
   - ✅ User feels heard and understood

3. **Artifact Management**
   - ✅ Create new retrospectives
   - ✅ Update existing retrospectives
   - ✅ Proper scoping (epic or project)
   - ✅ Version history maintained
   - ✅ Links to parent artifacts

4. **Reusability**
   - ✅ Can run same command multiple times
   - ✅ Each run captures new insights
   - ✅ Retrospective grows over time
   - ✅ No data loss on updates
   - ✅ Supports iterative discovery

This interactive retrospective approach transforms project closing from a chore into a genuine learning conversation.
