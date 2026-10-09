# Shared context

Use durable shared context when a task produces a decision or artifact that a later task needs.

1. Instruct the producing agent to use `agent-core:shared-context`.
2. Instruct it to publish the context before returning.
3. Put the published context path in the next task handoff.
4. Do not use chat text as the only handoff.

If a worktree has separate alignment storage, instruct the agent to resolve it with `agent-core:shared-context` before reading or writing alignment files.
