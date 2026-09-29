---
name: worktree
description: Route a worktree subcommand (start, submit, fix, finish, review, continue) to its playbook, after detecting the active muxer and agent.
disable-model-invocation: true
user-invocable: true
---

Route `UserRequest` to the correct worktree workflow. This skill dispatches only — it does not resolve tickets, run validation, or launch agents itself. All of that lives in the playbook it points to.

# Rule 0: resolve the project issue tracker

For every local Markdown file used by a worktree workflow, use
`agent-core:mq-query` to locate, read, filter, select, list, summarise, or
validate its content. Load the matching mq-query task reference and required
upstream reference first. Do not use `grep`, `find`, `rg`, `fd`, `ls`, shell
globs, or an ad hoc Markdown parser for that work.

Before loading tracker configuration or reading or changing a ticket, apply the **Mandatory ticket-resolution preamble** in `files/devtools/agent/bundles/matt-pocock/skills/reading-and-writing-tickets/SKILL.md`. Run the shared-context CLI from the repository being worked on, set `ALIGNMENT_ROOT` to the CLI-reported `root`, and read `docs/agents/issue-tracker.md` from that root. Pass the CLI-reported `root`, `storage`, and repository root to the ticket skill. Do not derive `ALIGNMENT_ROOT` or a tracker path from the repository path, ticket ID, origin slug, configuration, or environment. That skill owns ticket selectors, backend resolution, schema, paths, reads, claims, review artifacts, comments, completion, and tracker commits. This skill owns only the Worktrunk workflow.

Every commit made by a worktree playbook MUST use the `writing-and-creating-git-commits` skill. Every commit title MUST contain the resolved issue reference. This applies to source commits, review-artifact commits, tracker-state commits, and the final merge commit.

# Rule 1: detect the muxer

MUST resolve the muxer before routing or running a playbook, every time, in this order:

1. Look for a `<worktree-session muxer="..." agent="...">` tag already in context. The developer bundle's `SessionStart` hook (`hooks/hooks.json` → `scripts/router.ts session-context`) injects this once per session, so the muxer is normally already known — no script call needed.
2. If that tag is absent (an older session, the hook did not fire, or the muxer changed mid-session — for example the operator attached a new terminal), fall back to:
   ```bash
   scripts/router.ts detect-muxer
   ```

Either source gives one of `herdr`, `zellij`, `tmux`, `hrdx`, `unknown-muxer` — see `references/muxers/hrdx.md` for the `HRDX=1` signal hrdx sets. If detection is wrong, pass `--muxer <actual>` to `route` instead of trusting either source.

# Rule 2: detect the agent

Use the same tag-first order as Rule 1, using the `<worktree-session>` tag's `agent` attribute first and falling back only when absent or stale:

```bash
scripts/router.ts detect-agent
```

Either source gives one of `claude`, `pi`, `unknown-agent`. zot has no confirmed signal — see `references/agents/zot.md` — and always reports as `unknown-agent`. Pass `--agent zot` to `route` when the caller knows better.

# Route

Resolve the issue tracker before following a playbook that reads or updates a ticket. The playbook receives the resolved `ticket` and `tracker path` as working context.

```bash
scripts/router.ts route "$ARGUMENTS" --muxer <resolved-muxer> --agent <resolved-agent>
```

Always pass `--muxer` and `--agent` explicitly, sourced from Rules 1 and 2 above — this keeps `route` a pure lookup with no env probing of its own. It resolves the subcommand and prints JSON: `{ match, subcommand, remainder, muxer, agent, playbook, muxerContract, agentContract }` on success, or `{ match: false, request }` with a non-zero exit on no match.

## On match

1. Read `playbook` (`references/playbooks/<subcommand>.md`). It is the full Ticket resolution, Preconditions, Process, and Output for that subcommand — follow it as written.
2. Where the playbook says to open a pane, launch an agent, or release one, read `muxerContract` (and, when launching, `agentContract`) and follow that contract's commands.
3. If `muxer` is `unknown-muxer` or `agent` is `unknown-agent` and no override was given, ask the user before proceeding. Do not guess.

## On no match (NLP fallthrough)

`UserRequest` did not start with one of `start | submit | fix | finish | review | continue`. Do not reject it outright. Read the six files under `references/playbooks/` and pick the one whose stated goal best matches the free-text request. State which one you picked and why before proceeding. If two are equally plausible, ask.

# Worktrunk owns worktrees

Every playbook, every muxer contract, and every agent contract in this skill MUST use Worktrunk (`wt`) for creating, switching, removing, and merging worktrees. None of them may call `git worktree` directly. This is unconditional — it does not depend on which muxer or agent was detected.

# Troubleshooting

Known failure modes live in `references/troubleshooting/`:

- `wt-hook-approval-needed.md` — a `wt` command needs hook approval in a non-interactive session.
- `fixer-agent-blocked.md` — the `fix` playbook's fixer agent stalls or fails validation.
- `missing-review-verdict.md` — `submit`/`finish` blocked because no persisted review verdict exists.
- `muxer-or-agent-undetected.md` — detection returns `unknown-muxer`/`unknown-agent` when it should not.

UserRequest: $ARGUMENTS
