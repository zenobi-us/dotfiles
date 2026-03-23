---
id: dataflow
title: Pi 0.61.1 extension migration data flow
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:02:06+10:30
area: data-flow
tags: [architecture, data-flow, extensions, migration]
---

# Pi 0.61.1 extension migration data flow

## Data Flow Diagram

```text
[Upstream CHANGELOG.md]
        |
        v
[Migration rules extracted]
  - 0.61.0 keybinding namespace break
  - 0.61.1 ToolCallEventResult availability
        |
        v
[Local source scan: extensions/]
        |
        +--> [grep + sg hits in files.ts]
        |
        +--> [grep + sg hits in pi-fzf/src/selector.ts]
        |
        +--> [no tool_call handlers found]
        v
[Impact matrix]
  blocker: keybinding id migration
  watch: typed tool_call returns for future hooks
        |
        v
[Memory artifacts]
  research -> epic -> stories -> tasks -> todo/summary/team
        |
        v
[Execution handoff]
  implement code migration in extension files
```
