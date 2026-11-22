---
name: writing-great-skills
description: Compatibility alias that routes skill authoring to writing-skills and other agent instructions to writing-for-agents.
user-invocable: true
---

# Writing great skills

For creating, editing or testing skills, load `writing-skills` and follow its router and completion gate. It owns skill-authoring policy, including artifact contracts.

For other agent instructions, load `writing-for-agents`. This compatibility alias defines no separate authoring or contract policy.
