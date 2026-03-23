---
id: codemap
title: Pi extension migration codemap for 0.61.1
created_at: 2026-03-24T09:02:06+10:30
updated_at: 2026-03-24T09:02:06+10:30
area: codebase-structure
tags: [architecture, state-machine, extensions, migration]
learned_from: [epic-pi611e01-update-extensions-for-pi-0-61-1.md, research-pi611r01-pi-0-61-1-migration-impact-audit.md]
---

# Pi extension migration codemap for 0.61.1

## State Machine Diagram

```text
[Start]
  |
  v
[Read upstream changelog: 0.61.1 + 0.61.0]
  |
  v
[Scan local extensions tree]
  |
  +--> [files.ts selector input]
  |        |
  |        v
  |   [legacy key ids: selectUp/selectDown/selectConfirm/selectCancel]
  |
  +--> [pi-fzf/src/selector.ts]
  |        |
  |        v
  |   [legacy key ids + editorKey(select*)]
  |
  +--> [other extensions]
           |
           v
      [no 0.61.x blocking migration found]

[Impact classification]
  |
  +--> [BLOCKER] keybinding namespace migration (0.61.0 breaking)
  |
  +--> [WATCH] ToolCallEventResult adoption when tool_call hooks are added (0.61.1)
  |
  v
[Epic pi611e01]
  |
  v
[Phase 2 tasks t01+t02]
  |
  v
[Phase 3 tasks t03+t04]
  |
  v
[Ready for implementation]
```
