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
6. Stop the owned server with Ctrl-C. Keep the session directory for later inspection. Start it again with the same session path and an explicit port.

This viewer cannot create, save or export annotations. A screenshot proves a capture, not a passing assertion. If an asset is missing, changed or unsafe, import corrected evidence under a new identity.

