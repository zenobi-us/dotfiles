---
name: devtool
description: |
  <UserRequest> Perform actions using Chrome DevTools Protocol.
agent: chrome-debug-subagent
---

Perform actions using chrome-devtools.

```md
<UserRequest>
$ARGUMENTS
</UserRequest>
```

Unless specified otherwise, always:

- provide the final output in markdown format.
- reuse the currently active browser tab.
- avoid opening new tabs unless absolutely necessary or requested.
- if any instructions include javascript to run, run it verbatim. (if you think it needs modification, ask first)
