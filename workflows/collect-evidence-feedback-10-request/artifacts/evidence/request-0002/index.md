---
title: Request workflow evidence
type: Report
---
# Request workflow evidence

## Verified outcomes

- **Fresh TUI:** Installed request captured the real Ready-to-Details transition. Both native assertions passed. The 1280 × 720 originals retain the purple bar and 20 px text-line spacing. Native video is unavailable. See runs/fresh-tui-02 and tui-viewer.webp.
- **Fresh GUI:** Installed request borrowed only the owned X11 fixture. Both panel probes passed in the original 480 × 260 PNG. The fixture stayed viewable after collection. GUI video and input are unavailable. See runs/fresh-gui and gui-viewer.webp.
- **Saved feedback:** The actual bundled viewer created one point pin in each fresh session. The CLI exports retain IDs, P2 comments, dimensions, normalized coordinates, original-pixel coordinates and source hashes. See tui-export.json and gui-export.json.
- **Historical reuse:** Explicit request --historical imported fresh-gui under a new session identity. The actual viewer showed HISTORICAL EVIDENCE. Export kept its original capture date and hash. See runs/historical-review, historical-export.json and historical-viewer.webp.
- **Blocked prerequisites:** An unavailable X11 display returned exit 3 and sealed BLOCKED records without creating blocked-review. Surf and Playwright request branches returned exit 3 before import. Surf lacked its socket; Playwright could not find /opt/google/chrome/chrome. No tool was installed. See commands.json and runs/blocked-gui.
- **Safety stops:** Real terminal API-token and unexpected confirmation fixtures returned exit 3 and BLOCKED before input. No feedback session was created. See runs/stop-credential and runs/stop-confirmation.
- **Failed assertion:** A real GUI dimension mismatch opened feedback while collection.verdicts retained FAIL. See runs/failed-pixels and runs/failed-review.
- **Interrupted request:** SIGTERM returned exit 1 and created no feedback session. The collector completed owned cleanup and retained incomplete diagnostics, not sealed evidence. See interrupted.json.

## Limits and observed side effects

Fresh web capture and real video were unavailable with the configured installed drivers. Browser-based annotation was exercised on the real TUI and GUI captures. This does not establish fresh web capture support on this host.

The first throwaway terminal fixture used the Eval host executable, which is omp rather than Bun. The collector saw the unexpected terminal prompt, returned BLOCKED and released its owned terminal. The retry used the installed Bun executable and a new run identity. Keep the stopped run as diagnostics; do not present it as the requested application. See runs/fresh-tui.

The historical viewer smoke initially waited for mixed-case text. The actual visible label is uppercase HISTORICAL EVIDENCE. Direct observation and its screenshot verified the label without a product change.

## Public suites

The relevant public Bun suites ran once: 103 passed, 32 skipped, two failed, 1054 expectations, 137 tests in ten files. Both failures stopped at the missing configured Chrome distribution. The new installed request regression did not fail. See suite-output.json for the complete retained output. Native and GUI opt-in suites were skipped; the fresh native workflows above were separate real smokes. LSP diagnostics could not start the configured TypeScript language server.

## Ownership and shutdown

The readiness records contain the actual loopback URLs and session paths used during this run. All four foreground feedback servers exited 0 after SIGTERM, released their explicit ports and removed their writer locks. The owned GUI fixture exited after SIGTERM. Its private Cage/Xwayland display exited 0, and its runtime directory was removed. Source asset identities record released native terminal resources. See shutdown.json, resources-live.json, resources-interrupted-live.json and resources-after.json.

The resource observer also records this active implementation agent, Eval workers and the harness-managed shared browser runtime. Those are not feedback servers or borrowed user windows. The feedback tab was released. Parent pane closure owns the implementation harness lifecycle. The resource observer remains pending while that harness is live; this report does not claim whole-pane shutdown.

## Record references

- **Commands:** commands.json retains exact installed CLI argv, stdout, stderr and exit codes. Local git init and local remote configuration prepared only the temporary store; no remote Git command ran.
- **Readiness:** readiness.json retains actual server readiness output and saved-record references.
- **Archives:** runs contains finalized evidence and feedback sessions copied without changing source media bytes.
- **Publication:** These artifacts are local repository records. No push, remote hosting or automatic publication occurred during capture or serving.
