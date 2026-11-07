---
kind: tutorial
title: Explain a topic with your first agent-core skill
---

1. Run `mise run claude.bootstrap` once, so that Claude Code installs the bundles. For OMP, Pi or Zot, apply the mise links instead.
2. Start the harness in any folder.
3. Type `/agent-core:explain git worktrees` in Claude Code, or `/skill:explain git worktrees` in OMP.
4. The agent researches the topic and writes a single-page HTML explainer with its sources.

The skill is loaded when the reply names the explainer file it wrote.
