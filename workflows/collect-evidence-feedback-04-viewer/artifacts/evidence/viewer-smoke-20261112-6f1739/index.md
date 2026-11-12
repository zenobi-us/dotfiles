---
schema: collect-feedback/v1
kind: evidence-report
---
# Read-only viewer evidence

## Result

The installed public workflow created a sealed Playwright run and imported 12 cases into a feedback session. The final bundled page displayed the original captures at desktop and 390 px widths. The final affected suite passed 102 tests, skipped 32 existing opt-in cases and failed none. It made 940 assertions.

The source feature commit is `c4b48e60`. The authoritative implementation receipt records the exact final clean source commit and tree. This report is implementation evidence, not a formal review approval or ticket completion.

## Visual proof

- **Desktop inspector:** [Final three-column view](final-desktop.png). The session, case and asset columns remain separate.
- **Narrow inspector:** [Final 390 px asset view](final-narrow-asset.png). Horizontal drill-down exposes the asset column without document overflow.
- **Original pixels:** [Unmodified browser capture](original-browser-capture.png). The 1280 × 720 PNG has 25111 bytes and SHA-256 `9c3004a6ec3b9f0f72f4055016202e553c17d69ea5a60cbec6e0876839811449`.
- **Measured behavior:** [Final browser checks](final-browser-checks.json). Repeated asset arrows retain focus. The focus outline is exactly 2 px primary with a 3 px offset. Embedded JetBrains Mono 400/500 loads without a CDN.

At a short desktop viewport, independent scroll states were `[100,0,0]`, `[0,100,0]` and `[0,0,100]`. At 390 px, the asset column left edge was 0 and the horizontal scroll position was 780. The page reported no JavaScript errors or external requests.

## Public workflow checks

[Validation results](validation.json) record commands, working directories, actual results and limits. The public regression uses installed CLI entrypoints from an unrelated temporary directory. It captures real browser media rather than constructing evidence records.

The regression checks dry-run immutability, source identity and capture-time retention, event references, byte equality, invalid and unsupported records, missing and changed media, symlinks, unsafe paths, Host and Origin refusals, request bounds, busy ports, second writers and signal cleanup. It restarts the direct entrypoint on the same port after shutdown.

The first collection attempt stopped because the default Chrome executable was absent. A later run explicitly selected an already installed Chromium executable and completed. No browser installation, remote Git command or credential input occurred during collection or serving.

## Durable records

- **Feedback session:** [Session manifest](session/session.json). Case records and immutable media remain under `session/cases/`.
- **Sealed source:** [Original run manifest](session/source/run.json). Its plan, case events, media and collector-native output remain under `session/source/`.
- **Image identity:** [Byte comparison](image-identity.json) records the paths actually exercised. The retained source and session provide durable copies after temporary paths are removed.
- **Self-review:** [Two-axis findings and resolutions](implementation-review.json). The dangling event reference, repeated-key focus loss, concurrent metadata rereads and focus styling were corrected before the final suite and browser proof. This does not replace the parent's formal review phase.

Earlier `desktop.png`, `narrow-asset.png`, `narrow-cases.png` and `browser-checks.json` retain pre-review observations. Use the `final-*` records for the final interface.

## Limits and cleanup

Native TUI and GUI capture and new video recording were outside this slice. Existing opt-in collector cases were not enabled. Annotation mutations, editing, drafts, export and historical labels remain unsupported. The configured LSP failed to locate workspace TypeScript; explicit frontend `tsc --noEmit` passed.

Both owned smoke servers exited with code 0 after SIGTERM. The browser tab was released. The copied transient writer lock was removed from the retained session. The public regression separately checked SIGINT, SIGTERM, port reuse and lock removal. Unrelated user sessions remained open.

