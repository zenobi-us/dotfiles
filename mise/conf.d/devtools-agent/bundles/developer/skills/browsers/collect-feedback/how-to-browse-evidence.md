---
schema: collect-feedback/v1
title: Browse original evidence
---
# Browse original evidence

1. Invoke `/collect-feedback` with an explicit sealed evidence run, repository, workflow ID, new session ID and local port.
2. Keep the returned session path. The session contains copied evidence, so it remains available after the original run moves.
3. Open the returned `http://127.0.0.1:<port>` URL on the same machine.
4. Select a case. Read its purpose, steps, recorded results and limits.
5. Select an asset. Inspect the original image and its capture metadata. Use arrow keys to move through each list. On a narrow screen, move horizontally between the columns or use the column navigation buttons.
6. Click an image to place a point, or drag a box in either direction. Use Point or Box to start with the keyboard. Move with arrows and resize a box with Shift plus arrows.
7. Enter a comment beside the pin. Select P1 Blocker, P2 Friction or P3 Polish. New notes start at P2. Save with the Save button or Ctrl or Meta plus Enter. Escape cancels.
8. Wait for Saved. If saving fails, keep the page open and retry. Unfinished notes stay in memory only. Select a saved pin to inspect it without a draft. Use Edit note, Delete note or Undo deletion. Undo remains available after reload or restart. A conflict keeps your draft in memory and does not overwrite the newer note. Compare the saved version with the draft. Use saved revision for next save explicitly adopts that revision without discarding your draft. Save again only when you intend to replace it.
9. Run `export <session> --json` through the installed collect-feedback command to read saved notes and source references.
10. Stop the owned server with Ctrl-C. Keep the session directory for later inspection. Start it again with the same session path and an explicit port.

A screenshot proves a capture, not a passing assertion. If an asset is missing, changed or unsafe, import corrected evidence under a new identity.

