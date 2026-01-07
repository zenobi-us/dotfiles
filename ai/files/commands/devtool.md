---
name: devtool
description: |
  <UserRequest> Perform actions using Chrome DevTools Protocol.
---

Perform actions using chrome-devtools.

## User Request

```md
<UserRequest>
  $ARGUMENTS
</UserRequest>
```

## Steps to Execute

1. Load the `devtools_chrome_debug` skill if not already loaded:

   - `skill_use('devtools_chrome_debug')`

2. Use the `devtools_chrome_debug` skill to perform the requested actions in the currently active browser tab.
3. If the request requires opening a new tab, ensure to confirm with the user before proceeding.

## Guidelines

Unless specified otherwise, always:

- provide the final output in markdown format.
- reuse the currently active browser tab.
- avoid opening new tabs unless absolutely necessary or requested.
- if any instructions include javascript to run, run it verbatim. (if you think it needs modification, ask first)

