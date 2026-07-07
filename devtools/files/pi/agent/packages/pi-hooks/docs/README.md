# pi-hooks documentation

Hook bash, follow-up prompts, and PI UI actions onto tool calls and session events from one `hooks.yaml` file. This directory is the full reference; the top-level README covers install and a 60-second tour.

## Start here

- [`setup.md`](./setup.md): install the extension, choose hook file locations, trust project hooks, and read the canonical environment-variable table
- [`hooks-reference.md`](./hooks-reference.md): exact hook fields, events, conditions, actions, and PI-specific behavior
- [`agent-authoring-guide.md`](./agent-authoring-guide.md): practical rules for people and agents writing `hooks.yaml`
- [`debugging-hooks.md`](./debugging-hooks.md): persistent hook logs, tailing, and debugging workflow
- [`examples/`](./examples/): copy-paste examples for each major capability
- [`maintaining.md`](./maintaining.md): maintainer-only SDK matrix and runtime smoke checklist

## What pi-hooks can do

- Run `bash` before or after tool calls
- Block pre-tool calls from `bash` hooks with exit code `2`
- Ask for user confirmation before a tool runs
- Show UI notifications and status entries when PI exposes UI (`ctx.hasUI`), including RPC UI in Pi 0.79+
- Send follow-up prompts back into the current PI session with `tool:` actions
- React to session lifecycle events: `session.created`, `session.idle`, and `session.deleted`
- React to `file.changed`, which PI synthesizes after recognized file mutations, including `cp`/`git cp`, `mv`/`git mv`, `rm`/`git rm`, `touch`, and `mkdir`
- Filter hooks by file extension or glob patterns, including post-tool mutation hooks with changed paths
- Restrict hooks to `all`, `main`, or `child` sessions
- Queue selected hooks asynchronously so they do not block the agent turn
- Layer one global root hook file and one trusted project root hook file, with gated imports and id-based replacement or disable behavior

## Important PI-specific realities

These are the details that matter most when authoring hooks:

- The documented support range is `@earendil-works/pi-coding-agent 0.79.x`.
- Only one global root config and one project root config are discovered.
- Project-root imports require pi-hooks project-hook trust. Pi's own project/package trust is separate and does not activate project hooks here. Global-root imports require `PI_YAML_HOOKS_ALLOW_GLOBAL_IMPORTS=1`; package imports require `PI_YAML_HOOKS_ALLOW_PACKAGE_IMPORTS=1`; project imports outside the trust anchor require `PI_YAML_HOOKS_ALLOW_PROJECT_IMPORTS_OUTSIDE_TRUST_ANCHOR=1`.
- Later files stay compatible with the same explicit `override:` / `disable:` behavior by `id`.
- Project hook files are ignored until the repo or worktree trust anchor is trusted through `/hooks-trust`, `trusted-projects.json`, or `PI_YAML_HOOKS_TRUST_PROJECT=1`.
- `command:` actions are rejected at load time on PI.
- `tool:` does not imperatively invoke a tool; it sends a follow-up prompt to the current session.
- `confirm:` blocks only on `tool.before.*` hooks.
- `session.deleted` is best-effort and intentionally lossy: PI fires it for shutdown and for session switches like `/new`, `/resume`, and `/fork`; `pi-hooks` forwards PI's `reason` (`quit`, `reload`, `new`, `resume`, or `fork`) on the envelope so hooks can disambiguate.
- `file.changed` is synthesized from recognized mutation tools. On stock PI that means `write`, `edit`, and some `bash` commands such as `cp`, `mv`, `rm`, `touch`, and `mkdir`.
- Type-only consumers can `import type { HookConfig, HookEvent, BashHookContext, SessionDeletedReason } from "pi-hooks/types"`. The subpath ships only types; runtime imports go through `pi-hooks`.

## Recommended reading order

This is the canonical reading order. The top-level README links here.

If you are new to the project:

1. Read [`setup.md`](./setup.md)
2. Skim [`hooks-reference.md`](./hooks-reference.md)
3. Copy from [`examples/`](./examples/)
4. Keep [`agent-authoring-guide.md`](./agent-authoring-guide.md) open while writing new hooks

If you are releasing or widening SDK support, also work through [`maintaining.md`](./maintaining.md).
