---
id: codemap
title: pi-interview and proposed pi-tui questionnaire codemap
created_at: 2026-01-23T12:51:00+10:30
updated_at: 2026-02-20T19:39:55+10:30
area: codebase-structure
tags: [architecture, state-machine, interview, pi-tui]
learned_from: [epic-9c7e21ab-pi-interview-pi-tui-questionnaire.md, research-6d4f2a10-pi-interview-source-and-pi-tui-feasibility.md]
---

# pi-interview and pi-tui codemap

## State Machine Diagram

```text
CURRENT: pi-interview-tool (web flow)

[Tool call: interview()]
          |
          v
[load+validate questions (schema.ts)] --invalid--> [throw error]
          |
          v
[startInterviewServer(server.ts)]
          |
          v
[open browser URL + token]
          |
          v
[form/script.js session loop]
    |        |         |          |
    |        |         |          +--> [POST /save] -> [snapshot html/images]
    |        |         +--------------> [POST /cancel timeout/stale/user] -> [recovery json]
    |        +------------------------> [POST /heartbeat] -> [session kept alive]
    +-------------------------------> [POST /submit responses+images]
                                          |
                                          v
                                [onSubmit callbacks -> tool result]
                                          |
                                          v
                                    [server close]


TARGET: pi-tui questionnaire (inside Pi)

[Tool call: interview_tui() or interview(mode=tui)]
          |
          v
[load+validate questions (reuse schema rules)]
          |
          v
[ctx.ui.custom overlay mount]
          |
          v
[Question loop state]
  ├─> [render info/single/multi/text]
  ├─> [capture answer / optional attachment paths]
  ├─> [validate next]
  ├─> [cancel] ------> [cancelled result]
  └─> [timeout] -----> [timeout result (+ partial answers)]
          |
          v
[review + submit]
          |
          v
[tool returns structured responses]
```
