---
name: muxer-subagents
description: Spawn a child agent in a terminal multiplexer pane, tab, or workspace. Detects the active muxer (herdr, herdr-app, hrdx, zellij, tmux) and agent CLI (claude, omp, pi, zot), then resolves the contract that says how to open, launch, wait, read, and close a session.
---

Use this skill whenever a parent agent must start a child agent in its own pane.

Resolve `SKILL_DIR` to the absolute installed directory containing this file. All `scripts/` paths below are relative to `SKILL_DIR`, not the caller’s working directory. Run scripts by their absolute paths when working elsewhere.

This skill owns session mechanics only. It does not create worktrees, resolve tickets, write receipts, or decide what the child agent works on. The caller owns that.

# Rule 1: detect the muxer

MUST resolve the muxer before opening a pane, every time, in this order:

1. Look for a `<muxer-session muxer="..." agent="...">` tag already in context.
2. If the tag is absent or stale, run:
   ```bash
   scripts/router.ts detect-muxer
   ```

The Claude `SessionStart` hook and the OMP `hooks/pre/muxer-session.ts` hook both inject this tag. Both call `scripts/session-context.ts`, so they render the same context.

Either source gives `herdr-app`, `herdr`, `zellij`, `tmux`, `hrdx`, or `unknown-muxer`. If detection is wrong, pass `--muxer <actual>` to `contracts`.

# Desktop app versus TUI

`herdr-app` is separate from the older `herdr` TUI. `HC_TERMINAL_ID` identifies a herdr-core terminal; it does not prove that the app window is open. Explicit TUI, Zellij, tmux, and hrdx markers take precedence over an inherited core address. Read `references/muxers/herdr-app.md` before using the desktop route. Never use `herdr agent` or `herdr worktree` commands for the desktop app.

# Rule 2: detect the agent

Use the same tag-first order. If the tag is absent or stale, run:

```bash
scripts/router.ts detect-agent
```

The hooks can supply `omp`, `pi`, `zot`, `codex`, `claude`, or `unknown-agent`. `detect-agent` checks `OMPCODE=1`, Pi's `PI_CODING_AGENT=true` or `AI_AGENT=pi`, `AGENT=zot`, `AGENT=codex`, then `CLAUDECODE=1`, in that priority order. An explicit caller identity takes precedence.

# Resolve the contracts

```bash
scripts/router.ts contracts --muxer <resolved-muxer> --agent <resolved-agent>
```

Always pass `--muxer` and `--agent` explicitly. The command prints versioned JSON with `muxer`, `agent`, contract paths, `limits` (`maxSubagentsPerSession`, `maxDepth`, `currentDepth`), and `needsOperatorInput`. `session` reports the explicit role, run identity, parent run identity, operation identity, and context file. `delivery` reports the assigned context and supported transport capabilities. An absent role stays `unspecified`; muxer detection and depth do not establish a role. Native structured-result transport is not implemented.

1. Read `muxerContract` before you open, wait on, read, or close a pane.
2. Read `agentContract` before you launch an agent.
3. If `needsOperatorInput` is `true`, ask the user. Do not guess a muxer or an agent.

# Session limits

The current limits are five concurrently active direct child agents per parent session and a maximum depth of two. The root session is depth zero.

- MUST track the number of direct child agents that this parent has started and not yet completed and closed. Do not exceed five active children.
- MUST NOT start a child when the current `depth` is greater than or equal to `max-depth`.
- MUST set `MUXER_SUBAGENT_DEPTH` to the parent's `depth` plus one in the child agent's environment. This lets the router report the child's depth and enforce the depth check for later spawns.
- MUST NOT spawn if the emitted `depth` is invalid. The root session gets depth zero from the router when no depth is set.

## Router spawn command

Use the router when you need to launch a child agent directly:

```bash
scripts/router.ts spawn --result-schema <domain-schema> [--prompt <text> | --prompt-file <path>] [--cwd <path>] [--muxer <muxer>] [--agent <agent>] [--result-target <absolute-file> --result-ref <approved-reference>] [--operation-id <id>]
```

- If you set neither prompt option, the router reads stdin.
- If stdin is empty, pass `--prompt` or `--prompt-file`.
- Do not pass both prompt options.
- The child runs in `--cwd`, or in the current directory by default.
- The router sets `MUXER_SUBAGENT_DEPTH` to the parent depth plus one.
- The router rejects invalid depth and depth at or above the configured maximum.
- If muxer or agent detection is unknown, pass its explicit option.

The command prints a JSON record with `runId`, muxer, agent, target identifier, child depth, `parentRunId` when known, `operationId`, `contextFile`, `deliveryContext`, and `resultTarget`. Save the delivery fields before waiting. Run and resource records survive completion for the next phase.

- `--result-schema` is required for the formal typed handoff. Use the domain operation's existing result schema.
- `--result-target` and `--result-ref` must be supplied together. The target must be absolute and its parent directory must already exist.
- Without a custom target, the router allocates `$XDG_STATE_HOME/result-delivery/runs/<runId>/result.json`, with a file URI reference. The fallback state root is `~/.local/state`. The router resolves its own spool directory to its real path before assigning the context and default target. This supports symlinked home or state directories without relaxing delivery’s no-symlink checks. Caller-assigned target paths and references remain unchanged.
- `--operation-id` defaults to the child run ID.
- Before launch, the router writes an artifact-reference context and passes `RESULT_DELIVERY_CONTEXT`, `MUXER_SUBAGENT_RUN_ID`, and the explicit child role through every muxer path. It also passes `MUXER_SUBAGENT_PARENT_RUN_ID` when the incoming run identity is known. Herdr TUI receives these values through tab `--env` flags. The desktop route passes them as `env` arguments in a new tab.
- The child uses its existing operation CLI or the shared result-delivery library. Do not add a second reporting CLI. Read the `result-delivery` skill for the delivery protocol.
- After completion, read and verify the delivered artifact with the saved context, validate the domain result, then acknowledge its hash. A result artifact or exit code zero does not prove domain success.
- Result artifacts and contexts survive muxer run cleanup and acknowledgement.

- Wait for completion with `scripts/router.ts wait <runId>`.
- If the signal is `blocked`, resume the agent, then pass the signal's sequence with `--after-sequence`.
- Do not treat pane idleness or pane text as proof of completion.
- See `references/completion-signals.md` for signal states and limits.

Herdr's `agent start` does not support `zot`. The router reports this combination as an error before it creates a tab.

# Fresh session mechanic

A caller that requires an independent agent session MUST get a new pane or tab. Apply these mechanics:

- Reuse the workspace for the caller’s target directory, not the orchestrator’s workspace. Create a new tab in it. Do not create a second workspace for the same directory. For a missing herdr-app space, follow the desktop contract’s target-directory creation rule.
- Address the workspace by its absolute path, never by its name. See the hrdx contract's trap list.
- Launch a new agent process in the returned pane.
- MUST NOT send text to, resume, or reuse an earlier child pane.
- Close the child pane when its phase completes. Leave the workspace open.

# Spawn procedure

1. MUST resolve the muxer and the agent with Rule 1 and Rule 2.
2. MUST read the resolved `muxerContract` and `agentContract`.
3. MUST receive the target directory from the caller. This skill does not create it.
4. For a formal handoff, MUST use `scripts/router.ts spawn --result-schema <domain-schema>` to allocate the delivery context before opening the pane. Save its delivery fields.
5. The router opens the pane and launches the child through the resolved contracts. For manual launches, apply the same assigned context and run identity to the child environment.
6. MUST wait for completion through the muxer contract. Do not poll a status command in a loop where the contract offers a wait or an event stream.
7. MUST read the child output through the muxer contract's read command.
8. MUST record owned resources with `scripts/router.ts resources <runId>` before closing the pane. Stop owned services through their normal shutdown commands.
9. MUST close the pane through the muxer contract.
10. MUST run `scripts/router.ts resources <runId>` again. Retain its shutdown observation in the phase handoff.

# Parallel work

Use one pane for each independent task. Give each child a short name, one clear task, and its own directory.

- MUST NOT give two children the same files to edit.
- MUST NOT merge child output without a review.
- SHOULD keep the parent responsible for synthesis, because a child cannot see its siblings.

# Supported contracts

| Kind | Contracts |
|---|---|
| Muxer | `references/muxers/herdr-app.md`, `references/muxers/herdr.md`, `hrdx.md`, `zellij.md`, `tmux.md`, `unknown-muxer.md` |
| Agent | `references/agents/claude.md`, `omp.md`, `pi.md`, `zot.md` |
| Completion | `references/completion-signals.md` |

# Troubleshooting

- `references/troubleshooting/muxer-or-agent-undetected.md`

# Session hooks

`scripts/session-context.ts` owns detection, depth, and rendering of the `<muxer-session>` tag. `scripts/types.ts` owns the shared muxer and agent names, types, and guards. Three callers share the session context:

| Caller | Path |
|---|---|
| Claude `SessionStart` | `hooks/hooks.json`, through `scripts/router.ts session-context` |
| OMP extension | `hooks/pre/muxer-session.ts`, through `renderSessionContext` |
| This skill's CLI | `scripts/router.ts detect-muxer`, `detect-agent`, `contracts`, `spawn`, `wait` |



# Module implementation

When changing muxer or agent behaviour, use the interfaces in `scripts/modules/types.ts`. Each `muxer-*.ts` file exports one `muxer` object. Each `agent-*.ts` file exports one `agent` object. Keep helpers private unless multiple muxers use them.

Register modules explicitly in `scripts/modules/index.ts`. Detection order is authoritative there; preserve precedence when adding a module. Agent modules own detection and command arguments. Muxer modules own detection, compatibility, launch, native waiting and prompt lifetime. Check compatibility before allocating a run or opening a terminal.

Keep delivery context and run allocation in `spawn.ts`, shared completion handling in `wait.ts`, and lifecycle records in `signals.ts`. Use `shell-launch.ts` for shared shell quoting and process signals. A completed lifecycle signal does not establish domain-result success.


# Owned resources at phase handoff

The run manifest records the target, target directory, operation identity, and parent run identity when known. Process records use the assigned run identity, PID, boot identity, and process start ticks. The router registers shell launchers before agent execution. It discovers tagged processes and their live descendants at launch, wait, and explicit resource observations. These records survive terminal completion.

- MUST preserve `MUXER_SUBAGENT_RUN_ID` in launched service environments. Run `resources <runId>` while each service is live to register its ownership before handoff. If a service clears that environment, observe it while its owned ancestor is still live.
- MUST record non-process resources, such as external service handles, in the domain handoff. Stop and verify them through their owning tools. This process observer does not confirm their shutdown.
- MUST stop and verify owned services before the next phase. `resources` never sends signals. Its `shutdown` value is `pending` for live owned processes, `confirmed` for observed identities that have stopped, or `unconfirmed` when evidence is insufficient. Its exit status is zero only for confirmed process shutdown. An empty registry is unconfirmed.
- MUST preserve user and unrelated resources. A matching working directory is not proof of ownership. Normal owned child closure is permitted. Signals outside that closure require explicit approval for the named process identities and a fresh identity check. Never use broad process-name or process-group kills.
- MUST keep domain acceptance and cleanup status separate. Published acceptance can remain valid while cleanup is pending. Pane closure, a completion signal, or a delivered result does not prove service shutdown. Unknown ownership or unconfirmed shutdown blocks cleanup, not publication of existing acceptance.
- MUST retain lifecycle records and shutdown observations for recovery. A launch failure can occur after pane creation. The error supplies the retained run identity when launch was attempted. Inspect that run before retrying.
