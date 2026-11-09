---
title: Find the muxer and agent of a session
---

The `muxer-subagents` skill decides how to open child agents from the muxer and agent that run the session.

1. Run `muxer-subagents detect-muxer`. It prints `herdr`, `zellij`, `tmux`, `hrdx` or `unknown-muxer`.
2. Run `muxer-subagents detect-agent`. It prints `omp`, `pi`, `zot`, `codex`, `claude` or `unknown-agent`.

mise links `muxer-subagents` into `~/.local/bin`. Hooks use the same command, so a hook and the skill agree on the agent.
