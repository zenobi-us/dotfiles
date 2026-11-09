---
kind: how-to
title: Remove merged branches and worktrees
---

At session start, the `cleanup-merged` hook checks the repository at most once in 24 hours. When it finds branches or worktrees whose work is already in the default branch, the agent asks you in its first reply.

1. Choose **Remove now** to remove them, or **Skip** to keep them for this session.
2. To run the check yourself, type `/developer:cleanup-merged` in Claude Code, or `/skill:cleanup-merged` in OMP.

The skill keeps unmerged, dirty and new work, and worktrees where a process still runs. It never deletes remote branches.
