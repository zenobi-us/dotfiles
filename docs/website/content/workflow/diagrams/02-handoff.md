---
id: handoff
number: "02"
title: Start and review handoffs
shortTitle: Handoffs
kind: Sequence
diagram: handoff
description: Start launches an implementation agent. Review launches a different reviewer session in the same source worktree. A signal is transient; the parent verifies persisted receipts after each completion.
---

The implementation and review use separate agent sessions in the same source worktree. The parent checks receipts after completion signals.
