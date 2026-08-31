# ADR-0001: Add `/btw` as an ephemeral side-question child

- **Status:** Accepted
- **Date:** 2026-07-31
- **Decision owners:** `acrnm`
- **Scope:** `giuseppecrj/pi-herdr-agents`
- **Decision baseline:** legacy source commit `77d7d029312880f63b29838b3c329a1e4059e029` (not carried into the clean repository history)

## Context

A user sometimes needs to ask a question about the current conversation without
interrupting the main Pi agent or adding another turn to its transcript.
`/iterate` and normal subagents are too heavy: they are tracked as workers and
send a result back to the parent.

Pi's `ctx.fork()` replaces the current session, so it cannot keep the parent and
a side question open at the same time. A concurrent side question needs a
separate Pi process with a child session file.

Nanocodex BTW at
[`b1314eb`](https://github.com/gakonst/nanocodex/blob/b1314ebcd602b77af7d2ab5153286f3a1795bbfe/web/src/agentController.ts)
is the behavioral reference: one replaceable interactive fork, inherited
conversation as reference context, and workspace mutation only when the side
question explicitly requests it.

## Decision

Add two direct extension commands:

```text
/btw <question>
/btw-close
```

`/btw`:

1. Waits for the parent to become idle.
2. Captures the parent's current active leaf.
3. Uses a detached `SessionManager` to create a child session containing only
   that active branch.
4. Opens a non-focused Herdr tab.
5. Starts an interactive Pi process in the parent's working directory, using the
   parent model and thinking level.
6. Sends the Nanocodex boundary and the question as the child's first new user
   message.

The child starts with `--no-extensions` so it does not load this orchestration
extension or worker completion protocol. Normal Pi context files, skills, prompt
templates, and built-in tools remain available. Repository instructions can
further restrict behavior. The boundary states:

> You are answering an ephemeral BTW side question. Treat inherited
> conversation history only as reference context. Do not resume or complete an
> earlier task. Answer only the question after this boundary. Do not modify the
> workspace unless that side question explicitly requests a mutation.

The answer remains in the BTW tab. The extension does not add BTW to
`runningSubagents`, the widget, worker counts, completion delivery, or the
parent transcript.

## Minimal lifecycle

The extension keeps one in-memory record containing:

- Herdr pane ID
- child session path
- launch-script path

A second `/btw` best-effort closes the previous pane and removes its temporary
files before opening the next one. `/btw-close` performs the same cleanup.
Parent `session_shutdown` also attempts cleanup.

If snapshot creation or launch fails, the command reports the error and removes
what it can. If pane cleanup fails, the command warns and leaves the pane for
manual recovery. There is no durable recovery registry.

The child snapshot may appear temporarily in Pi's session picker while BTW is
open. Successful close removes it.

## Consequences

### Positive

- Side questions do not consume a parent-agent turn.
- The current conversation remains available as context.
- The implementation reuses Pi session branching and existing Herdr helpers.
- The feature is independent from worker tracking and completion delivery.

### Negative

- The child shares the working directory; explicitly requested edits persist.
- Cleanup is best effort after crashes, reload failures, or manual pane changes.
- A parent branch without a persisted assistant message cannot be opened as BTW.
- The snapshot is visible to `/resume` until successful cleanup.

## Deliberately deferred

- Durable cleanup or crash recovery
- Process observers and completion delivery
- Worktree isolation
- Multiple or named BTW panes
- Tab-split ownership
- Automatic merge, commit, push, or PR behavior
- A generalized child-session manager

Add these only if real usage demonstrates a need.

## Verification

Unit tests must prove:

- active-branch snapshotting excludes abandoned siblings;
- snapshotting does not modify the parent session;
- an unpersisted child snapshot fails closed;
- the launch command uses `--no-extensions`, the parent runtime, and the BTW
  boundary without worker-control arguments;
- empty `/btw` and idle `/btw-close` are harmless and do not steer the parent.

Herdr integration must prove:

- `/btw` opens a non-focused tab;
- the child can answer from the latest completed parent context;
- the parent session receives no BTW result or follow-up turn;
- a second `/btw` replaces the first child;
- `/btw-close` closes the child.

Run:

```sh
npm test
npm run lint
git diff --check
npm run test:integration
npm pack --dry-run
```

## References

- [Pi Herdr Agents](https://github.com/giuseppecrj/pi-herdr-agents)
- [Nanocodex BTW controller](https://github.com/gakonst/nanocodex/blob/b1314ebcd602b77af7d2ab5153286f3a1795bbfe/web/src/agentController.ts)
- [Pi extension API](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md)
- [Pi session format](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/session-format.md)
