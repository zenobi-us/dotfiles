---
kind: explanation
title: What agent-core is for
---

agent-core holds the skills that every other bundle depends on: plain-language writing rules, SOP authoring, skill authoring, shared context, and subagent spawning through `muxer-subagents`.

It is the only bundle with an extension (`extensions/pi-shared-context`) for OMP and Pi. Its `SessionStart` hooks add the shared-context route table and the `<muxer-session>` tag to each session.
