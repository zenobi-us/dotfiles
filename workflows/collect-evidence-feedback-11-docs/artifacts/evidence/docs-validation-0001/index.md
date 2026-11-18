---
schema: collect-evidence/v1
kind: report
---
# Documentation workflow verification

Installed public CLIs ran from `/tmp/evidence-docs-WCh29z`, with a temporary repository-backed evidence route.
The original repository stores and existing user feedback remained unchanged.

## Observed results

- **Real capture:** Playwright captured the controlled `Evidence ready` page. The sealed case verdict was PASS. See [the run](collected-run/run.json) and [HTML report](evidence-report.html).
- **Saved feedback:** The browser created a box note with P3 Polish and received Saved. See [the viewer screenshot](saved-feedback.png) and [saved export](saved-export.json).
- **Source identity:** Export retained asset `ready.2.capture-002`, dimensions 1280 × 720, SHA-256 `7b02f5161ac08b37c6581cc0a7858865bd776111ea53ec4b1f75f19d45a3beec`, and pixel box `{x:33,y:19,width:313,height:74}`.
- **Durable restart:** The server stopped with exit 0, released its lock and port, and reopened. The saved note remained visible. The saved JSON records before and after restart were semantically identical. The export files use different whitespace. See [restart export](restart-export.json).
- **Fresh request:** Public `request` collected a second new run and served session `request-feedback-002` on port 8092. Readiness retained PASS and actual destination references.
- **Historical review:** Public historical init, validate, export, and request retained `historical:true`, source `fresh-001`, original capture times, and source hashes. The browser showed HISTORICAL EVIDENCE and the earlier-state warning.
- **Resolver agreement:** Public shared-context resolutions matched the run and session destinations under the temporary repository. See [exact commands and outputs](commands.json).
- **Writer exclusion:** A second public serve returned exit 3 with `Session writer lock is held or unavailable; stop its owner before serving`.
- **Website:** The built site rendered 282 pages. Browser navigation from the home Evidence and feedback link reached both guides. The guide had no missing local fragment destinations. Final source links use `master`. See [guide screenshot](website-guides.png), [collector screenshot](website-collector-guide.png), and [final links](website-final-links.json).
- **Guide screenshots:** The how-to contains the actual original-asset and saved-note screenshots. The illustrated browser preview used identical local bytes for only the two unpublished raw GitHub image URLs. See [preview scope](screenshot-preview.json) and [illustrated page](website-illustrated-howto.png). This is local rendering proof, not remote publication proof.
- **Website checks:** Typecheck and lint passed. All 14 existing website tests passed. The initial formatting check found the new skill-files expression. The scoped formatter corrected it.
- **Independent self-checks:** The spec helper found no discrepancies. The standards helper found the old website guide filename rule. The source rule now names both supported forms. These helper results are not a formal worktree review verdict.

## Limits

- **Playwright setup:** Default Chrome was absent. The supported `PLAYWRIGHT_MCP_EXECUTABLE_PATH` selected the already installed `/home/zenobius/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`. Doctor then passed, including its owned recorder probe. This run did not collect video.
- **Surf unavailable:** Doctor returned exit 3 because `/tmp/surf.sock` was absent. No Surf capture ran.
- **Native TUI unavailable:** Doctor returned exit 3 for missing foot, grim, and tesseract. No native terminal screenshot was substituted.
- **Native GUI unavailable:** The explicit unavailable display `:65000` failed access with exit 3. No user desktop or unapproved surface was captured.
- **React Doctor:** It returned exit 1 for `react-doctor/artifact-env-leak` in the generated `dist/server/assets/vite-flare-starter-BnCRG9s2.js:2` documentation artifact. That skill source is outside this change. The diagnostic remains unresolved. Other website checks do not turn this result into a pass.
- **Publication pending:** New source links and screenshots cannot be verified on GitHub or Pages until the parent publishes the branch. No push or publication occurred.

## Cleanup

All owned fixture, feedback, request, and preview services stopped. Ports 8090, 8091, 8092, 8093, and 4187 were closed.
All three served feedback session locks were absent. Only owned browser tabs closed.
Both self-check child tabs closed with confirmed process shutdown. The implementation pane remains for its parent to close.
The retained run and feedback session copies preserve source bytes. Temporary capture workspaces are not authoritative outputs.
See [service shutdown](service-shutdown.json) and the resource observations for process identities.
