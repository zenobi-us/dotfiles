---
schema: collect-feedback/v1
title: Browse original evidence
---
# Browse original evidence

1. Invoke `/collect-feedback` with the requested workflow and approved web, TUI or GUI scope. The agent follows [the request procedure](references/request.md), prepares one collector plan, then uses `request` to collect, validate, import and serve. For earlier evidence, explicitly select the sealed run and historical review.
2. Keep the returned session path. The session contains copied evidence, so it remains available after the original run moves.
3. Open the returned `http://127.0.0.1:<port>` URL on the same machine.
4. Select a case. Read its purpose, steps, recorded results and limits.
5. Select an asset. Inspect the original image or WebM recording and its capture metadata. Use arrow keys to move through each list. On a narrow screen, move horizontally between the columns or use the column navigation buttons.
6. For video, use Play and Pause, then seek with Recording position. Pause before annotating. Saved note buttons reopen their timestamp. Save or cancel a draft before seeking. Notes do not track objects or promise exact frames. Click an image or paused frame to place a point, or drag a box in either direction. Use Point or Box to start with the keyboard. Move with arrows and resize a box with Shift plus arrows.
7. Enter a comment beside the pin. Select P1 Blocker, P2 Friction or P3 Polish. New notes start at P2. Save with the Save button or Ctrl or Meta plus Enter. Escape cancels.
8. Wait for Saved. If saving fails, keep the page open and retry. Unfinished notes recover across case changes, asset changes and reload in the same browser tab and origin. Keep the same port. If browser storage fails, the warning means that the draft is memory-only. Save it before leaving the tab. Select a saved pin to inspect it without a draft. Use Edit note, Delete note or Undo deletion. Undo remains available after reload or restart. A conflict keeps your draft and starting revision without overwriting the newer note. Compare the saved version with the draft. Use saved revision for next save explicitly adopts that revision without discarding your draft. Save again only when you intend to replace it.
9. Use Export saved annotations for a complete review. Open each unfinished draft to save it, or choose Discard draft explicitly. Selecting an unchanged saved note does not block export. The installed `export <session> --json` command and direct API export read saved notes only.
10. Stop the owned server with Ctrl-C. Keep the session directory for later inspection. Start it again with the same session path and an explicit port.

A screenshot proves a capture, not a passing assertion. If an asset is missing, changed or unsafe, import corrected evidence under a new identity.


## Run an approved fresh workspace

Resolve `FEEDBACK_SKILL_ROOT` to the installed collect-feedback directory. Complete the matching collect-evidence driver playbook through plan approval, render and compile. Then run this absolute command from any directory:

```sh
"$FEEDBACK_SKILL_ROOT/scripts/collect-feedback.ts" request /tmp/approved-workspace --repository /absolute/repository --workflow review --session fresh-review --port 8091 --json
```

Keep the foreground process running while you review. Open its returned `url`. Keep `destination.ref` and `records.session` for saved-record references. Stop only the process you created. A blocked prerequisite returns exit 3 without a feedback session. A sealed assertion failure can open for feedback without changing its FAIL result. No command publishes evidence.

## Review an earlier run

Select the exact sealed run path. Resolve `FEEDBACK_SKILL_ROOT` to the installed collect-feedback directory. Run its absolute command from any directory:

```sh
"$FEEDBACK_SKILL_ROOT/scripts/collect-feedback.ts" init /absolute/earlier-run --historical --repository /absolute/repository --workflow review --session earlier-review --json
```

For one import-and-serve operation, use `request /absolute/earlier-run --historical` with the same store flags and an explicit `--port`. It returns the actual viewer URL and saved-record references.

For separate commands, keep the returned `destination.path`. Validate and serve that session as described above. The viewer shows **Historical evidence**. It states that the run does not show the current application. Export retains `session.historical: true`. The source snapshot, capture dates, asset IDs, hashes, results and media bytes stay unchanged. `createdAt` is the session import time, not a capture date. Unknown capture dates display as unknown.

Only sealed `collect-evidence/v1` runs are supported. Unsupported explicit versions and unversioned archives fail before session creation. Do not rewrite an earlier report or feedback session to make it importable. Select a supported run explicitly or obtain a separately approved format importer. Each import needs a new session ID. No command searches for the latest run or migrates earlier feedback.

For a read-only report, resolve `REPORT_SKILL_ROOT` to the installed writing-reports directory:

```sh
"$REPORT_SKILL_ROOT/scripts/report-cli.ts" evidence /absolute/feedback-session --feedback --json
```

The response contains the shared report cases and verdicts plus verified saved feedback. Without `--json`, it prints self-contained HTML. Save that output outside the evidence and feedback directories. The session controls its historical label; the report cannot override it. Repeated reports do not change source records, media or saved notes.
