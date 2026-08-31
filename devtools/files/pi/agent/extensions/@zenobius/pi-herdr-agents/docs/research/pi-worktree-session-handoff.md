# Pi session handoff into a Herdr worktree

**Date:** 2026-08-13  
**Scope:** Read-only feasibility research for `pi-herdr-agents`. This is evidence, not a shipped contract.

## Result

**A full-context Pi child in a newly created Herdr worktree is already feasible and partly implemented.** A `subagent({ fork: true, worktree: ... })` creates the worktree, writes a child session with the worktree as its `cwd`, copies parent context before the triggering user turn, and launches a separate Pi process in the worktree root pane.

**Replacing the current Pi runtime with that fork is supported by Pi's public extension API, but does not move or restart the existing terminal process.** `ctx.switchSession()` rebuilds Pi's cwd-bound runtime from the fork session header. It cannot change the shell's actual cwd, and Herdr pane movement does not change a running process's cwd. Therefore a single operation cannot truthfully promise both “same Pi process switched” and “shell is in the worktree.”

The smallest safe product is a **new explicit handoff command** which creates a full session fork in the worktree and starts/focuses a new Pi process in the worktree's root pane. It should leave the old parent Pi process idle and its session intact. Treat it as a user-visible session handoff, not a process move. Do not use `subagent_resume` for this purpose.

## Evidence

### Pi session capability

- Pi sessions are persisted JSONL trees. A child session may declare `parentSession`; the session header also owns `cwd`. Pi documents both fields and the active-branch semantics. [Pi session format](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/session-format.md)
- `SessionManager.createBranchedSession(leafId)` extracts one root-to-leaf branch. `SessionManager.forkFrom(sourcePath, targetCwd, sessionDir?, options?)` creates a full-history fork whose target cwd is explicit. These are public declarations in the installed Pi package: [`session-manager.d.ts`](../../node_modules/@earendil-works/pi-coding-agent/dist/core/session-manager.d.ts), lines 306–341; documented at [Pi session format — SessionManager API](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/session-format.md#sessionmanager-api).
- A command extension can replace the active runtime through `ctx.switchSession(path, { withSession })`; after replacement Pi has torn down the old runtime and rebound extensions, and `withSession` receives the fresh context. The API deliberately says not to reuse captured old session-bound objects. [Pi extensions — session replacement](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md#session-replacement-lifecycle-and-footguns); installed declaration: [`types.d.ts`](../../node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts), lines 247–306.
- Pi's runtime API recreates cwd-bound services on session replacement. `AgentSessionRuntime.switchSession()` has an internal `cwdOverride`, but the extension command API does not expose it; a session header with `cwd: <worktree>` is therefore the supported extension route. [Pi SDK — AgentSessionRuntime](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md#agent-session-runtime); installed declaration: [`agent-session-runtime.d.ts`](../../node_modules/@earendil-works/pi-coding-agent/dist/core/agent-session-runtime.d.ts), lines 43–89.

### Herdr capability and limit

- `herdr worktree create --cwd ... --branch ... --base ... --no-focus` creates a Git worktree checkout and its own normal Herdr workspace/root pane. `herdr workspace focus <id>` focuses that workspace. [Herdr CLI reference](https://herdr.dev/docs/cli-reference/)
- Herdr supports `pane move <pane> --new-workspace` and cross-workspace pane moves. But its CLI reference states that a moved running process retains its launch-time Herdr IDs and the old pane ID remains an alias. It offers no command to change a running process's cwd. Moving the Pi pane is layout-only, not a worktree-shell restart. [Herdr CLI reference — pane move](https://herdr.dev/docs/cli-reference/)
- Herdr reports `foreground_cwd` when it can resolve it, separately from pane/workspace `cwd`; that distinction confirms that workspace association is not authority to rewrite a live process cwd. [Herdr CLI reference — pane inspection](https://herdr.dev/docs/cli-reference/)

### Current extension implementation

- `launchPiSubagent()` owns the current worktree transaction: it resolves the base SHA, writes the ownership manifest before Herdr resource creation, calls `createWorktree`, waits for the returned root pane, and starts Pi there. [`pi-extension/subagents/launch.ts`](../../pi-extension/subagents/launch.ts), `launchPiSubagent`, `prepareLaunchSurface`, `prepareChildSession`, and `buildPiCommand` (lines 174–525).
- For `worktree`, `prepareLaunchSurface()` sets `targetCwd` to `created.path`; `buildPiCommand()` begins with `cd <targetCwd> && pi --session <child>`. Thus the child process and its initial shell command run at the worktree root. [`launch.ts`](../../pi-extension/subagents/launch.ts), lines 257–335 and 415–495.
- `fork: true` selects `sessionMode === "fork"`. `seedSubagentSessionFile()` creates a child session header with `cwd: childCwd` and `parentSession`, then copies entries from the parent file before its last user message. The triggering task is delivered directly, so the current child sees the inherited conversation plus the explicit task. [`launch.ts`](../../pi-extension/subagents/launch.ts), `resolveLaunchRequest` and `prepareTaskArtifacts`; [`session.ts`](../../pi-extension/subagents/session.ts), `seedSubagentSessionFile` and `getForkContentLines`.
- `/iterate` currently asks the parent model to invoke `subagent` with `fork: true, interactive: true`; it does not create a worktree or replace the parent session. [`pi-extension/subagents/index.ts`](../../pi-extension/subagents/index.ts), `/iterate` command at lines 3840–3851.
- `/btw` is the closest session snapshot precedent: it captures the active leaf with `createBtwSessionSnapshot()`, opens a non-focused pane, and launches a second Pi process. It deliberately keeps the parent unchanged and shares its cwd. [`index.ts`](../../pi-extension/subagents/index.ts), `/btw` handler at lines 3732–3834; [`session.ts`](../../pi-extension/subagents/session.ts), `createBtwSessionSnapshot`.
- `subagent_resume` explicitly opens a new ordinary pane and has no worktree lifecycle. This is documented as a current limit. [`docs/worktree-subagents.md`](../worktree-subagents.md#failure-help-and-restart-behavior).

## Current behavior versus requested behavior

| Requested property | Current state | Evidence / gap |
| --- | --- | --- |
| Create managed Git worktree | Shipped | Manifest before `herdr worktree create`; retained workspace. |
| Fork current conversation into it | Mostly shipped for a child spawn | `fork: true` copies parent context before the triggering user turn and records parent linkage. It is not the native full-history `SessionManager.forkFrom()` API. |
| Carry explicit handoff context | Shipped for child task | Fork task is passed directly after inherited context. A named, durable handoff entry is not written. |
| Worktree shell starts at worktree root | Shipped | Launch command uses `cd <worktree> && pi ...` in Herdr's returned root pane. |
| Parent's active Pi session switches to fork | Not shipped | Current worktree launch is a separate child Pi process. |
| Existing parent pane moves/restarts into worktree | Not shipped; move alone is insufficient | Herdr can move panes but cannot change a live process cwd. |

## Smallest safe design

Add one parent-only command, for example `/handoff-worktree <branch> [base]`, rather than changing ordinary `subagent` semantics.

1. Require `ctx.waitForIdle()`, a persisted parent session file, selected model, and a cleanly resolved committed base.
2. Reuse the existing worktree creation/manifest transaction. Keep its no-focus creation and exact-base rules.
3. Create a target-cwd fork from the current active leaf, then append one visible user/custom handoff message to the *child* session containing the explicit task, base SHA, branch, source session path, and worktree path. `SessionManager.forkFrom()` is public and gives the target cwd, but copies the source file's full entry set; do not use it blindly when the source contains abandoned branches. Reuse or extract the active-branch logic in `session.ts` and ensure the child header names the worktree cwd. Bound the handoff size; do not copy secrets or arbitrary environment data.
4. Start a new `pi --session <fork-file>` process in the returned worktree root pane. This reuses the proven `cd <worktree> && pi` launch pattern. Use a normal interactive Pi session, not a watcher-owned autonomous subagent.
5. After a successful launch, call `herdr workspace focus <worktreeWorkspaceId>` (or present the workspace ID for the user to focus). The user is now operating the forked session in the correct checkout.
6. Leave the original Pi process/session untouched and idle. Record both session paths and the workspace in the manifest. Do not auto-close either process, merge, push, or delete the worktree.

This has one intentional limitation: it is a **new-process handoff**, not in-place replacement. It is smaller and safer than coordinating parent process exit, cross-workspace pane movement, shell `cd`, and Pi restart.

## Alternative: in-process context switch

An extension command can create a target-cwd fork and call `await ctx.switchSession(forkFile, { withSession: async next => next.sendUserMessage(handoff) })`. That gives the current Pi runtime the fork session and refreshes cwd-bound Pi resources. It is viable only when the terminal location is allowed to remain the old parent pane.

Do **not** combine it with `herdr pane move` and claim success: the running Pi and its shell retain their existing OS cwd. A correct “same pane, worktree shell” version needs an explicit supervised restart protocol outside the Pi process: persist the fork and launch intent, gracefully exit Pi, then have an external launcher issue `cd <worktree> && pi --session <fork>`. Neither Pi's public extension API nor the cited Herdr CLI provides that lifecycle as one atomic operation.

## Safety risks and required guards

- **Concurrent session writes:** Never run two Pi processes against the same JSONL. Fork to a new file before launch; retain the source session as read-only reference.
- **Conversation fidelity:** The current `fork: true` helper copies raw lines only before the last user entry, so it intentionally omits the triggering user request and may not represent the active tree as precisely as `createBranchedSession()`/`forkFrom()`. Use Pi's public fork API for the handoff command and test branches plus compaction.
- **Uncommitted parent state:** The worktree excludes uncommitted/untracked files. Preserve the existing rule: refuse no worktree creation, pass explicit handoff context, and state the exact committed base. [Worktree guide](../worktree-subagents.md#launch-contract).
- **Partial creation/launch:** Keep the existing ownership manifest-before-resource invariant; if launch fails, retain the worktree and report its path/workspace/session rather than attempting destructive cleanup.
- **Parent watcher semantics:** Do not register the handoff process as an ordinary autonomous subagent or steer its result into the old session. It is user-driven and long-lived.
- **Focus is not ownership:** Focus only after the new Pi launch succeeds. A focus failure must not imply launch failure; report both independently.
- **Restart recovery:** Preserve session/worktree metadata. Existing worktree lifecycle has no automatic full-process restart recovery, so do not claim durable reattachment. [Worktree guide](../worktree-subagents.md#failure-help-and-restart-behavior).

## Verification needed before implementation

1. Unit: native fork has target `cwd`, parent linkage, full active branch, compaction compatibility, and one bounded handoff message; parent JSONL is byte-for-byte unchanged.
2. Unit: manifest exists before Herdr creation; a launch failure retains all recorded identifiers.
3. Integration in Herdr: the returned root pane reports `pwd == worktreePath`; the launched Pi reports the fork session and inherits the expected conversation plus handoff.
4. Integration: focus transfers only after successful launch; parent transcript receives no autonomous result and parent session file remains unchanged.
5. Regression: ordinary `subagent({ worktree })`, `/iterate`, `/btw`, and `subagent_resume` retain their documented behavior.

## Primary sources

- [Pi README — sessions and `--fork`](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/README.md#sessions)
- [Pi session format and SessionManager API](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/session-format.md)
- [Pi extensions — session replacement lifecycle](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md#session-replacement-lifecycle-and-footguns)
- [Pi SDK — AgentSessionRuntime](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md#agentsessionruntime-and-agentsessionruntime)
- [Herdr CLI reference](https://herdr.dev/docs/cli-reference/)
- [Current worktree operating contract](../worktree-subagents.md)
