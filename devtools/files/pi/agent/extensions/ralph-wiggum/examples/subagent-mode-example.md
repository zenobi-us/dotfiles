# Subagent Mode - Complete Example

This example demonstrates using Ralph Wiggum in subagent mode to build a feature with multiple independent tasks.

## Scenario

You need to build a complete authentication system with several independent components.

## Step 1: Create the Task File

Create `.ralph/auth-system.md`:

```markdown
# Authentication System Implementation

Build a complete authentication system for the web application.

## Goals
- Secure user authentication
- Password management
- Session handling
- Email verification

## Checklist
- [ ] Create user registration endpoint
- [ ] Implement login with JWT
- [ ] Add password hashing with bcrypt
- [ ] Create password reset flow
- [ ] Add email verification system
- [ ] Implement session management
- [ ] Add rate limiting to auth endpoints
- [ ] Create authentication middleware
- [ ] Write integration tests
- [ ] Update API documentation

## Notes
- Use JWT with 24h expiration
- Passwords must be hashed with bcrypt (10 rounds)
- Email verification required before login
- Rate limit: 5 attempts per 15 minutes
```

## Step 2: Start the Loop

```bash
/ralph start auth-system --use-subagents --subagent-agent default
```

Or via tool:

```typescript
ralph_start({
  name: "auth-system",
  taskContent: `# Authentication System Implementation

Build a complete authentication system for the web application.

## Goals
- Secure user authentication
- Password management
- Session handling
- Email verification

## Checklist
- [ ] Create user registration endpoint
- [ ] Implement login with JWT
- [ ] Add password hashing with bcrypt
- [ ] Create password reset flow
- [ ] Add email verification system
- [ ] Implement session management
- [ ] Add rate limiting to auth endpoints
- [ ] Create authentication middleware
- [ ] Write integration tests
- [ ] Update API documentation

## Notes
- Use JWT with 24h expiration
- Passwords must be hashed with bcrypt (10 rounds)
- Email verification required before login
- Rate limit: 5 attempts per 15 minutes`,
  useSubagents: true,
  subagentAgent: "default"
})
```

## Step 3: Execution Flow

### Iteration 1: Create User Registration

**Ralph presents:**
```
🔄 RALPH LOOP (Subagent Mode): auth-system | Task 1/10

## Progress
Completed: 0/10 tasks

## Current Task
Task 1/10: **Create user registration endpoint**

## Instructions
1. Use the `subagent` tool to delegate this task to agent: **default**
2. After subagent completes, verify the task was marked complete
3. Call `ralph_done` to proceed to next task

### Subagent Task Template:
{
  "agent": "default",
  "task": "Context: Ralph loop 'auth-system'...",
  "agentScope": "user"
}
```

**You (main agent) execute:**
```typescript
subagent({
  agent: "default",
  task: "Context: Ralph loop 'auth-system'\n\nTask: Create user registration endpoint\n\nImplement a secure user registration endpoint with validation.",
  agentScope: "user"
})
```

**Subagent completes the task**, creates:
- `src/routes/auth/register.ts`
- `src/validators/user.ts`
- `src/services/auth.service.ts`
- Updates `.ralph/auth-system.md` with `- [x] Create user registration endpoint`

**You call:**
```typescript
ralph_done()
```

### Iteration 2: Implement Login with JWT

**Ralph presents:**
```
🔄 RALPH LOOP (Subagent Mode): auth-system | Task 2/10

## Progress
Completed: 1/10 tasks
  ✓ Task 1: Create user registration endpoint

## Current Task
Task 2/10: **Implement login with JWT**
...
```

**Process repeats** for each task...

### Iteration 10: Update API Documentation

**Ralph presents:**
```
🔄 RALPH LOOP (Subagent Mode): auth-system | Task 10/10

## Progress
Completed: 9/10 tasks
  ✓ Task 8: Create authentication middleware
  ✓ Task 9: Write integration tests
  ✓ Task 10: Update API documentation

## Current Task
Task 10/10: **Update API documentation**
...
```

**After final task completes:**
```
✅ RALPH LOOP COMPLETE: auth-system | All 10 tasks completed via subagents
```

## Step 4: Review Results

Each subagent execution created isolated, focused changes:
- Clean commits per task
- Comprehensive implementation per feature
- Tests written alongside code
- Documentation updated

## Benefits Demonstrated

### 1. **Isolation**
Each subagent started fresh:
- No context pollution from previous tasks
- Fresh perspective on each feature
- No accumulated technical debt

### 2. **Specialization**
Different subagents could be used:
```bash
# Use specialized agents
- Tasks 1-6: default (implementation)
- Task 7: security-engineer (rate limiting)
- Task 8: security-engineer (auth middleware)
- Task 9: test-automator (integration tests)
- Task 10: technical-writer (documentation)
```

### 3. **Parallel Potential**
Tasks are independent, could be parallelized:
- Registration (1) and Login (2) could run simultaneously
- Password features (3, 4) could run in parallel
- Tests (9) and docs (10) could run together

### 4. **Quality**
Each task gets full attention:
- Dedicated context window
- Comprehensive implementation
- Proper testing and documentation

## Advanced: Using Specialized Subagents

```bash
# Start with a routing strategy
/ralph start auth-system --use-subagents
```

Then configure different agents per task type in the task file:

```markdown
## Checklist
- [ ] Create user registration endpoint [agent:backend-developer]
- [ ] Implement login with JWT [agent:backend-developer]
- [ ] Add rate limiting to auth endpoints [agent:security-engineer]
- [ ] Create authentication middleware [agent:security-engineer]
- [ ] Write integration tests [agent:test-automator]
- [ ] Update API documentation [agent:technical-writer]
```

Parse and route in your implementation:
```typescript
const taskMatch = task.match(/^(.+?)\s*\[agent:(\w+)\]$/);
const taskText = taskMatch ? taskMatch[1] : task;
const agent = taskMatch ? taskMatch[2] : state.subagentAgent;
```

## Monitoring Progress

While the loop runs, you can:

```bash
# Check status
/ralph status

# View the task file
cat .ralph/auth-system.md

# See what's been completed
grep "\[x\]" .ralph/auth-system.md
```

## Error Handling

If a subagent fails:
1. Loop pauses
2. You can inspect the error
3. Fix the issue
4. Resume with `/ralph resume auth-system`

## Cleanup

When complete:
```bash
# Archive the completed loop
/ralph archive auth-system

# Or clean up completely
/ralph clean --all
```

## Key Takeaways

1. **One task, one subagent, one focused execution**
2. **Manual delegation ensures visibility and control**
3. **Task isolation prevents context pollution**
4. **Perfect for large features with independent components**
5. **Extensible to specialized subagents for different task types**
