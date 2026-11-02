---
title: Prove Paper Pro pen input — implementation-0017
type: Report
---

# Prove Paper Pro pen input — implementation-0017

## Status

**Full ticket: blocked.** The repository-only clipping gate is implemented and exercised. The canonical ticket remains claimed. This manual browser PDF import is not tablet current-document integration.

## Problem

The stock editor can export visible marks beyond the original source window. Fitting its expanded page into source dimensions stretches the source. Silent clipping loses outer marks without consent.

## Implementation

- **Detection:** Render the full PDF with alpha, independent of ink color. Use conservative paint bounds for subpixel or uncertain visibility. Ignore known hidden, zero-opacity, and empty annotation appearances. Expanded empty margins do not require consent.
- **Source mapping:** Compare decoded source samples to this request. Accept one opaque, direct source image at the original scale and position. Reject unsupported transforms, masks, extra images, page geometry, and paint state. Never trust browser-supplied bounds.
- **Consent:** Bind one-use confirmation to the immutable request ID, source digest, export digest, and nonce. Replacement, cancellation, server closure, and OMP session changes invalidate consent. Abort obsolete processing and reject late delivery.
- **Output:** After confirmation, render the original source window at source dimensions without stretching. Keep the full original PDF on private disk after server shutdown. Report its server-local path in the UI and tool result.
- **Browser preservation:** Keep Excalidraw mounted during PDF review. Existing drawing state survives Import stock PDF and Back. Ordinary PNG submission remains available.

## Source identity

Commit `ff9ec2a2f5aedbf804ad8cce7c8843ec95f25456`. Tree `93faf247089822a60c8cb534416997690fb989de`. Branch `prototype/pi-ink-bridge-01-pen-prototype`. Baseline `564c037546911f6e26936383b63eab9129819b97`. Source worktree: `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype`.

## Verification

| Check | Observed result |
|---|---|
| Scoped Vite build | Passed; existing use-client and large-chunk warnings remain. |
| Scoped TypeScript check | Passed. |
| Final regression suite | 13 passed, 0 failed; 100 assertions. |
| Actual image_editor + browser PDF path | Delivery stayed pending until explicit per-result consent; then returned a marked 800 × 1000 PNG. |
| Source geometry | All four 40 × 40 marker regions matched the source pixels exactly; annotated PNG differs from source. |
| Full original PDF | Retrieved from disk after server shutdown; SHA-256 `fc49be15009fdf904eb4cd5edc82833b22cfeec40c656d90d5041a98a4ab42cf`. |
| Actual browser PNG path | Rectangle remained after PDF mode and Back; Undo remained enabled; Done returned the marked PNG. |
| Missing offline dependency | HTTP 500 with explicit renderer setup error; no PNG delivered and no dependency network fallback. |

The final detector observed 7,179 outer alpha-bearing pixels in the retained PDF. This is not the earlier red-threshold diagnostic.

## Review history and resolved slice findings

Independent standards and specification self-checks found drawing loss on mode change, invisible-content false prompts, late resource checks, and obsolete work after cancellation. The implementation fixes those issues. Focused regressions and the final live browser run exercise the fixes. The original reports and resolution evidence remain linked below. These self-checks are not a formal worktree review or a whole-ticket SUCCESS verdict. Earlier review history remains preserved.

## Remaining findings and limits

- **Tablet integration:** Pairing, authenticated tablet LAN transport, stable stock-library folder/document/server/job associations, current-document resolution, and toolbar Send remain missing.
- **Hardware acceptance:** Tablet wrong-document/wrong-server cancellation, pen/palm/zoom/undo/erasing/orientation quality with the toolbar, sleep/wake, reboot, and firmware-update behavior remain untested.
- **Mapping boundary:** Unsupported PDFs fail closed. Conservative paint bounds can require confirmation where visibility cannot be proved. This does not establish arbitrary-document support.
- **Owner observation:** The owner reports that the device slept and they disabled auto-sleep. The agent did not verify or change that setting. This is not a lifecycle pass or new device approval.
- **Tool limits:** LSP initialization could not locate workspace TypeScript; direct scoped typecheck passed. The browser upload helper produced ERR_FILE_NOT_FOUND, so the smoke assigned exact retained bytes to a real File/DataTransfer input. It did not mock submission, detection, confirmation, or delivery.

## Changed source files

- **Source:** `README.md`.
- **Source:** `bun.lock`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/index.ts`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/package.json`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/pdf-session.ts`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/pdf-worker.py`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/src/PdfImport.tsx`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/src/main.tsx`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/src/style.css`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/editing-session.test.ts`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-fixtures.py`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-samples.py`.
- **Source:** `mise/conf.d/devtools-omp/extensions/image-annotator/test/pdf-submission.test.ts`.

## Supporting evidence

- **Summary:** [Bounded evidence summary](../evidence/implementation-0017/summary.json).
- **Raw checks:** [Build](../evidence/implementation-0017/accepted-build.log), [typecheck](../evidence/implementation-0017/accepted-typecheck.log), and [final isolated tests](../evidence/implementation-0017/isolated-final-tests.log).
- **Live delivery:** [Actual tool result](../evidence/implementation-0017/final-smoke/pdf-tool-result.json), [ordinary marked PNG result](../evidence/implementation-0017/final-smoke/png-tool-result.json), [geometry checks](../evidence/implementation-0017/final-smoke/output-verification.json), and [full retained PDF](../evidence/implementation-0017/final-smoke/retained-annotated.pdf).
- **Visual evidence:** [Blocked confirmation UI](../evidence/implementation-0017/final-smoke/confirmation.webp), [completed PDF UI](../evidence/implementation-0017/final-smoke/delivered.webp), [drawing before PDF mode](../evidence/implementation-0017/final-smoke/drawing-before.webp), and [drawing after returning](../evidence/implementation-0017/final-smoke/drawing-after.webp).
- **Self-checks:** [Standards](../evidence/implementation-0017/standards-self-check.txt), [specification](../evidence/implementation-0017/spec-self-check.txt), and [resolutions](../evidence/implementation-0017/review-resolutions.json).
- **Failure boundaries:** [Explicit offline dependency error](../evidence/implementation-0017/offline-dependency-result.json), [preserved initial failures](../evidence/implementation-0017/browser-upload-errors.json), and [owner observation](../evidence/implementation-0017/owner-device-observation.json).
- **Integrity:** [Source identity](../evidence/implementation-0017/source-identity.json), [fresh session](../evidence/implementation-0017/session-identity.json), and [all evidence checksums](../evidence/implementation-0017/checksums.json).

## Receipt history

- **start-0001:** [start-0001](../../events/start-0001.yaml).
- **start-complete-0003:** [start-complete-0003](../../events/start-complete-0003.yaml).
- **start-0004:** [start-0004](../../events/start-0004.yaml).
- **implementation-0005:** [implementation-0005](../../events/implementation-0005.yaml).
- **start-complete-0006:** [start-complete-0006](../../events/start-complete-0006.yaml).
- **start-0007:** [start-0007](../../events/start-0007.yaml).
- **implementation-0008:** [implementation-0008](../../events/implementation-0008.yaml).
- **start-complete-0009:** [start-complete-0009](../../events/start-complete-0009.yaml).
- **start-0010:** [start-0010](../../events/start-0010.yaml).
- **implementation-0011:** [implementation-0011](../../events/implementation-0011.yaml).
- **start-complete-0012:** [start-complete-0012](../../events/start-complete-0012.yaml).
- **start-0013:** [start-0013](../../events/start-0013.yaml).
- **implementation-0014:** [implementation-0014](../../events/implementation-0014.yaml).
- **start-complete-0015:** [start-complete-0015](../../events/start-complete-0015.yaml).
- **start-0016:** [start-0016](../../events/start-0016.yaml).
- **implementation-0017:** [implementation-0017](../../events/implementation-0017.yaml).

## Latest reviewer verdict and merge status

No formal verdict covers this source commit. No merge, rebase, push, device operation, or ticket completion occurred. Parent reconciliation remains pending.

