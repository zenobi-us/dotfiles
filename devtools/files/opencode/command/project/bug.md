# Report and Investigate Bug

Record a bug through interactive discussion, ask clarifying questions, and document findings in a structured artifact. This command helps capture the full context around unexpected behavior.

**Task:** Report bug: $ARGUMENTS
**Storage Backend**: basicmemory

> [!CRITICAL]
> Before doing anything, run these skills:
> - skills_projectmanagement_storage_basicmemory
> - skills_projectmanagement_info_planning_artifacts
>
> Bugs are documented as [Task] artifacts with special bug designation.
> Use the storage backend to store and retrieve bug reports.

## Step 1: Validate Project Context

**Establish the project:**

1. Use `skills_projectmanagement_storage_basicmemory` to get the current [ProjectId]
2. If no [ProjectId] exists, return error:
   ```
   ❗ Error: No active project
   
   Set project context first:
   /project:init "project-name"
   
   Then retry bug report.
   ```
3. Print identified [ProjectId]:
   ```
   📋 Project ID: {ProjectId}
   ```

## Step 2: Open Bug Discussion

**Start the conversation:**

```
🐛 BUG REPORT

Let me help you document this bug. I'll ask clarifying questions
to understand what went wrong and why.

Bug Summary: {user's $ARGUMENTS}

Ready? Let's start...
```

## Step 3: Conduct Interactive Q&A

**Follow this question sequence, adapting based on responses:**

### Phase 1: Understanding the Problem (What)

**Question 1: Current Behavior**
```
What is the unexpected behavior you're seeing?
(Describe exactly what happens, step by step)
```

**Follow-up based on answer:**
- "When exactly did you first notice this?"
- "Does this happen every time or intermittently?"
- "Can you reproduce it reliably?"

**Question 2: Expected Behavior**
```
What should happen instead?
(What's the correct behavior?)
```

**Follow-up:**
- "Why is that the expected behavior?"
- "Where is that documented?"

**Question 3: Impact**
```
What's the severity of this bug?
- 🔴 Critical: System broken, no workaround
- 🟠 High: Major feature broken, difficult workaround
- 🟡 Medium: Feature partially broken, workaround exists
- 🟢 Low: Minor issue, cosmetic, or edge case
```

**Follow-up:**
- "How many users are affected?"
- "What's the business impact?"

### Phase 2: Reproduction Context (Where/When)

**Question 4: Environment**
```
Where does this occur?
- Frontend? Backend? Database? Infrastructure?
- Which component or module?
- Which page/endpoint/function?
```

**Follow-up:**
- "Does it happen in all environments (dev/staging/prod)?"
- "Which browser/OS/version?"

**Question 5: Reproducibility**
```
Steps to reproduce (if you can):
1. [First action]
2. [Second action]
3. [What happens]

Is this reproducible?
- Yes, consistently
- Yes, sometimes (intermittent)
- No, can't reproduce
```

**Follow-up:**
- "What was different last time it worked?"
- "When did this first start happening?"

### Phase 3: Root Cause Investigation (Why)

**Question 6: Hypothesis**
```
Do you have any idea what might be causing this?
(Your initial hypothesis, don't overthink it)
```

**Follow-up:**
- "What changed recently in that area?"
- "Did you change anything before this started?"
- "Are there any error messages or logs?"

**Question 7: Error Information**
```
Error details (if any):
- Error message shown to user?
- Console errors?
- Server logs?
- Stack trace?
```

**Follow-up:**
- "Can you share the full error message?"
- "What does the error tell you?"

**Question 8: Related Issues**
```
Has this happened before?
- Similar issues in the past?
- Related features?
- Known limitations?
```

**Follow-up:**
- "How was it fixed before?"
- "Is this a regression?"

### Phase 4: Context and Details (Additional)

**Question 9: Related Artifacts**
```
Is this bug related to any planning artifacts?
- Epic: [if part of a feature]
- Story: [if tied to user story]
- Task: [if from implementation work]
- Decision: [if from architectural choice]
```

**Follow-up:**
- "Did this come from a recent feature?"
- "Which developer might have introduced this?"

**Question 10: Anything Else**
```
Anything else I should know about this bug?
- Workarounds you've found?
- Other users affected?
- Time-sensitive (deadline)?
- Security implications?
```

**Follow-up:**
- "Is this blocking other work?"
- "Can it wait or is it urgent?"

## Step 4: Synthesize Bug Report

**After gathering all information, synthesize:**

```
Let me summarize what I understand:

📌 BUG SUMMARY
Title: {synthesized title}
Severity: {Critical/High/Medium/Low}
Status: Reported (needs investigation)

🔴 WHAT'S BROKEN
Actual Behavior: {what's happening}
Expected Behavior: {what should happen}
Impact: {business/user impact}

📍 WHERE IT HAPPENS
Component: {which part of system}
Environment: {dev/staging/prod}
Frequency: {always/intermittent}

🔍 HOW TO REPRODUCE
Steps:
1. {step 1}
2. {step 2}
3. {observation}

Status: {reproducible/intermittent/can't reproduce}

❓ CLUES
- Errors: {error messages}
- Hypothesis: {what might be wrong}
- Related: {similar issues or recent changes}
- Context: {epic/story/decision affected}

⚠️ IMPACT DETAILS
- Users affected: {count/scope}
- Blocking work: {yes/no}
- Time-sensitive: {yes/no}
- Workaround: {exists or not}

Does this capture it correctly? Anything to add or change?
```

## Step 5: Confirm and Refine

**Get user confirmation:**

```
Before I record this bug, is there anything:
- To clarify?
- To add?
- To change?
- To remove?

Confirm to proceed: yes/no
```

**If user wants to modify:**
- "Which part should we fix?"
- Accept new information and re-synthesize
- Confirm again

## Step 6: Create Bug Task Artifact

**Once confirmed, delegate to subskill:**

> **Delegate to subskill:**
> Create a [Task] artifact for bug: "{title}"
> 
> **Bug-specific [Task] artifact:**
> 1. Use `skills_projectmanagement_info_planning_artifacts` for [Task] structure
> 2. Create artifact with bug-specific frontmatter:
>    ```yaml
>    title: "BUG: {title}"
>    projectId: {ProjectId}
>    bugType: true
>    severity: {Critical|High|Medium|Low}
>    status: Reported
>    storyPoints: {TBD initially}
>    priority: {Auto-calculate from severity}
>    createdDate: {today}
>    reproducible: {true|false|intermittent}
>    environment: {dev|staging|prod}
>    affectedUsers: {count}
>    blockingWork: {true|false}
>    ```
> 3. Populate [Task] artifact with:
>    - Bug Title (with "BUG:" prefix)
>    - Description: Actual vs Expected Behavior
>    - Reproduction Steps (if available)
>    - Error Information (messages, logs, stack traces)
>    - Hypothesis on Root Cause
>    - Impact Assessment
>    - Related Artifacts (if any)
>    - Workarounds (if any)
> 4. Add suggested next steps:
>    - Investigation task needed? (estimate effort)
>    - Which developer should investigate?
>    - Timeline: Urgent vs Can wait
> 5. Use storage backend to save
> 6. Return [Task] artifact ID (e.g., `5.X.1-task-bug-title`)

## Step 7: Display Recorded Bug

**Confirm bug was recorded:**

```
✅ BUG RECORDED

📋 Task ID: {artifact-id}
🐛 Title: BUG: {title}
🔴 Severity: {Critical|High|Medium|Low}
📊 Status: Reported

Next Steps:
```

**Provide context-specific suggestions:**

```
Based on this bug's severity:

IF CRITICAL:
- Immediate investigation required
- Consider: /project:do:task {artifact-id}
- Or: Create investigation task with /project:plan:tasks

IF HIGH:
- Schedule investigation soon
- Assign to developer: /project:do:task {artifact-id}
- Priority: Add to sprint

IF MEDIUM/LOW:
- Log for future investigation
- Add to backlog
- Review during sprint planning

💡 INVESTIGATION TIPS:
- Error messages? Search codebase for that error
- Regression? Check recent commits
- Environment-specific? Test in other environments
- Related artifact? Check: {artifact-links}

VIEW BUG DETAILS:
/project:view {artifact-id}

INVESTIGATE BUG:
/project:do:task {artifact-id}
```

## Step 8: Handle Follow-up Questions

**If user asks during the Q&A:**

```
Question about X?

Let me explain: [clarification]

Back to the bug report - continuing from where we were...
```

**If bug turns into feature request:**
```
Interesting! This might be a feature request rather than a bug.

Do you want to:
1. Record this as a feature request instead?
2. Keep it as a bug (unexpected behavior)?
3. Create both a bug AND a feature request?

What would you prefer?
```

**If bug is already known:**
```
This sounds familiar. Do you know if:
- This was reported before? (Task ID?)
- This was fixed? When?
- This is a regression?

Should I record it as a duplicate or separate bug?
```

## Step 9: Link to Investigation

**After bug is recorded, offer next steps:**

```
What would you like to do next?

Option 1: Start Investigation
/project:do:task {artifact-id}
→ Begin work immediately on this bug

Option 2: Create Investigation Task
/project:plan:tasks {artifact-id}
→ Break bug into investigation + fix tasks

Option 3: View Bug Details
/project:view {artifact-id}
→ See full recorded bug information

Option 4: Report Another Bug
/project:bug "another issue..."
→ Record another bug

Option 5: Nothing Now
→ Bug is recorded and can be reviewed later
```

## Implementation Notes

**Use interactive Q&A pattern:**
- Ask genuine questions (not rhetorical)
- Listen to answers before moving to next question
- Follow up based on responses to deepen understanding
- Let user guide depth of investigation
- Confirm understanding before moving forward

**Document thoroughly:**
- Capture exact user words where possible
- Include error messages verbatim
- Note what's reproducible vs intermittent
- Record severity assessment
- Document workarounds if they exist

**Validate information:**
- Confirm steps are reproducible
- Check if similar bugs exist
- Assess actual vs perceived severity
- Determine if this is regression

**Severity Guidelines:**
- **Critical**: System down, data loss risk, major feature completely broken
- **High**: Major functionality broken, impacts many users
- **Medium**: Partial feature breakage, workaround exists
- **Low**: Minor cosmetic issue, edge case, UX annoyance

**Bug Task Frontmatter:**
- Add `bugType: true` to mark as bug
- Set severity from discussion
- Set `reproducible` status
- Record affected environment
- Note if blocking other work
- Set priority based on severity + impact

This command transforms bug reports into well-documented, actionable [Task] artifacts that feed directly into the investigation and fix process.
