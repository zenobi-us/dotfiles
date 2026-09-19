<!-- vstack:append-system @vanillagreen/pi-web-tools begin -->
## pi-web-tools — web and code retrieval

Tool selection (pick the cheapest option that answers the question):
- `code_search` — code patterns, library APIs, developer documentation. Token-efficient via Exa Code; the default for "how do I use X library / what's the API for Y".
- `web_search` — general web queries; the default for "find me…" when not code-specific.
- `web_answer` — quick cited answer to a focused factual question (single short response, not a deep dive).
- `web_fetch` — a URL or local PDF you already have. Stores extracted text so later `get_web_content` calls retrieve without refetching: direct/GitHub/PDF/HTTP paths store full text, Exa-provider paths store provider-capped excerpts (default 6000 chars; override per call with `textMaxCharacters`). Multi-URL calls (2–5 URLs) shrink each per-URL preview to fit a 16 KB aggregate cap; 6+ URLs return a manifest plus short 512-char preview heads under a 25 KB aggregate cap. Pass `textMaxCharacters` to opt back into larger inlined previews; the sidecar stores per-URL data as described above (full for direct paths, capped excerpt for Exa).
- `web_find_similar` — expand from a known good URL.
- `web_research` — multi-source deep-dive findings report. Expensive; only when the user wants a researched recommendation, not a quick lookup.
- `get_web_content` — re-read content already fetched/searched in this session by id (`web-...`). Never refetch what you already have. To page another tool's truncated output, re-call that tool with `offset:` — don't pass its tool-call id or sidecar path here.
<!-- vstack:append-system @vanillagreen/pi-web-tools end -->

<!-- vstack:append-system @vanillagreen/pi-session-bridge begin -->
## pi-session-bridge — `pi-bridge` CLI

To control other interactive Pi sessions (different tmux windows, terminals, hosts), use the `pi-bridge` CLI. Do not use `tmux send-keys` or `tmux capture-pane` — the bridge is JSON in/JSON out and avoids ANSI noise, alt-screen issues, and stream collisions. Bridge addresses peer Pi sessions you did not spawn; child panes from `subagent` are addressed with `subagent`/`steer_subagent`/`stop_subagent` instead.

Discovery: `pi-bridge list` returns `(PID, IDLE, SESSION, NAME, CWD, SOCKET)`. Filters: `--pid`, `--cwd`, `--session`, `--name`, `--socket`. If exactly one bridge is active, target flags are optional.

Commands:
- `state` — structured snapshot (idle, model, cwd, session id, paths).
- `send "msg"` — deliver a prompt; auto-queues if the target is busy. Slash dispatch is hybrid: `/skill:<name>` and prompt templates expand client-side, including `${N:-default}`, `${@:-default}`, and `${ARGUMENTS:-default}` defaults, extension/TUI commands paste into the target Pi pane, and plain text uses normal `sendUserMessage`. Repeated `/skill:<name>` sends in one Pi session use a short previously-loaded reminder unless the `SKILL.md` content hash changes; session shutdown evicts that session, bridge restart loses the in-memory cache, and the bridge keeps only the 100 most recent sessions.
- `steer "msg"` / `follow-up "msg"` / `abort` — interrupt-and-redirect / queue-after-turn / cancel.
- `history N` / `stream` — structured events (input, message_update, tool_execution_start, tool_execution_update, tool_execution_end, agent_end, bridge_pong, question, `vstack_activity`). Activity rows are non-chat bridge events emitted by the local activity broker. History returns compact envelopes by default — `input` is reduced to source/streamingBehavior/images count/text byte count + preview, `message_update` to role/contentIndex/delta length + preview, `tool_execution_*` to name/id/status/byte counts/artifact paths, and `agent_end` to status/usage/final-text preview. Pass `--raw` (alias `--verbose`) to rehydrate from the per-session JSONL sidecar; `--event NAME`, `--since TS`, and `--max-bytes N` narrow the response.
- `questions` + `answer --request-id … --answers '[[...]]'` / `reject --request-id …` — drive `pi-questions` popups.
- `commands` — list slash commands the target session exposes.
- `/bridge:ping <text>` (via `send`) — no-LLM connectivity probe.

Installed at `~/.pi/agent/bin/pi-bridge` (global) or `<project>/.pi/bin/pi-bridge` (project).
<!-- vstack:append-system @vanillagreen/pi-session-bridge end -->

<!-- vstack:append-system @vanillagreen/pi-task-panel begin -->
## pi-task-panel — `tasks_write` tool

The Pi `tasks_write` tool is the only way the user sees what you're working on. Writing tasks once and ignoring them is the most common failure mode — keep the panel current throughout the turn, not only at the final reply.

Use:
- Before any non-trivial multi-step work, `action: "replace"` with a full `tasks: [...]` list.
- The moment you start an item, `action: "start_task"`.
- The moment you finish one, `action: "mark_done"` (auto-advances to the next pending task).
- When scope changes mid-turn, `action: "add_task"` for new follow-ups, `action: "drop_task"` for items that no longer apply.

Rules:
- Never end a turn with a stale `in_progress` task. If work has moved on, `start_task` the right one or `drop_task` it before replying.
- Do not narrate task transitions in prose ("now I'll start X") — just call the tool.
- For one-shot trivial requests, do not create a task panel at all.
- If the user hides the panel, `tasks_write` updates keep state current but do not auto-reopen the widget; only explicit `/tasks show`, `/tasks show-all`, or toggle-in reveals it again.
<!-- vstack:append-system @vanillagreen/pi-task-panel end -->
