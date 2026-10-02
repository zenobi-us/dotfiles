---
name: muxer-subagents
description: Spawn a child agent in a terminal multiplexer pane, tab, or workspace. Detects the active muxer (herdr, hrdx, zellij, tmux) and agent CLI (claude, pi, zot), then resolves the contract that says how to open, launch, wait, read, and close a session.
---

Use this skill whenever a parent agent must start a child agent in its own pane.

This skill owns session mechanics only. It does not create worktrees, resolve tickets, write receipts, or decide what the child agent works on. The caller owns that.

# Rule 1: detect the muxer

MUST resolve the muxer before opening a pane, every time, in this order:

1. Look for a `<muxer-session muxer="..." agent="...">` tag already in context.
2. If the tag is absent or stale, run:
   ```bash
   scripts/router.ts detect-muxer
   ```

The Claude `SessionStart` hook and the OMP `hooks/pre/muxer-session.ts` hook both inject this tag. Both call `scripts/session-context.ts`, so they render the same context.

Either source gives `herdr`, `zellij`, `tmux`, `hrdx`, or `unknown-muxer`. If detection is wrong, pass `--muxer <actual>` to `contracts`.

# Rule 2: detect the agent

Use the same tag-first order. If the tag is absent or stale, run:

```bash
scripts/router.ts detect-agent
```

Either source gives `claude`, `pi`, or `unknown-agent`. zot has no confirmed signal. Pass `--agent zot` when the caller knows better.

# Resolve the contracts

```bash
scripts/router.ts contracts --muxer <resolved-muxer> --agent <resolved-agent>
```

Always pass `--muxer` and `--agent` explicitly. The command prints JSON: `{ muxer, agent, muxerContract, agentContract, needsOperatorInput }`.

1. Read `muxerContract` before you open, wait on, read, or close a pane.
2. Read `agentContract` before you launch an agent.
3. If `needsOperatorInput` is `true`, ask the user. Do not guess a muxer or an agent.

# Fresh session mechanic

A caller that requires an independent agent session MUST get a new pane or tab. Apply these mechanics:

- Keep the existing workspace. Create a new tab in it. Do not create a second workspace for the same directory.
- Address the workspace by its absolute path, never by its name. See the hrdx contract's trap list.
- Launch a new agent process in the returned pane.
- MUST NOT send text to, resume, or reuse an earlier child pane.
- Close the child pane when its phase completes. Leave the workspace open.

# Spawn procedure

1. MUST resolve the muxer and the agent with Rule 1 and Rule 2.
2. MUST read the resolved `muxerContract` and `agentContract`.
3. MUST receive the target directory from the caller. This skill does not create it.
4. MUST open the pane, tab, or workspace with the muxer contract's command.
5. MUST launch the child with the agent contract's launch command.
6. MUST wait for completion through the muxer contract. Do not poll a status command in a loop where the contract offers a wait or an event stream.
7. MUST read the child output through the muxer contract's read command.
8. MUST close the pane through the muxer contract.

# Parallel work

Use one pane for each independent task. Give each child a short name, one clear task, and its own directory.

- MUST NOT give two children the same files to edit.
- MUST NOT merge child output without a review.
- SHOULD keep the parent responsible for synthesis, because a child cannot see its siblings.

# Supported contracts

| Kind | Contracts |
|---|---|
| Muxer | `references/muxers/herdr.md`, `hrdx.md`, `zellij.md`, `tmux.md`, `unknown-muxer.md` |
| Agent | `references/agents/claude.md`, `pi.md`, `zot.md` |

# Troubleshooting

- `references/troubleshooting/muxer-or-agent-undetected.md`

# Session hooks

`scripts/session-context.ts` owns detection and renders the `<muxer-session>` tag. Three callers share it:

| Caller | Path |
|---|---|
| Claude `SessionStart` | `hooks/hooks.json`, through `scripts/router.ts session-context` |
| OMP extension | `hooks/pre/muxer-session.ts`, through `renderSessionContext` |
| This skill's CLI | `scripts/router.ts detect-muxer`, `detect-agent`, `contracts` |
