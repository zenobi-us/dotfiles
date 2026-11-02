# Prove Paper Pro pen input — attempt 2

## Status

Blocked. The revised stock-editor workflow is not implemented or accepted. Keep the ticket claimed and dependent production work blocked.

## Problem

The ticket requires real pairing, visible stock-library documents, current-document server/job context, and explicit Send of actual pen marks. The inspected resources do not establish three required interfaces. A filesystem directory is not a stock-library folder. An inserted image is not an imported PDF. A screenshot is not a full annotated export.

## Implementation

No integration source changed. No speculative adapter, replacement drawing surface, or USB/localhost probe was added. The source remains at `564c037546911f6e26936383b63eab9129819b97`, tree `57df0dbb0fb91fa3da0716f1c3a62460906c96eb`, on `prototype/pi-ink-bridge-01-pen-prototype`. The base branch is `master`.

This fresh session inspected official Xochitl documentation, AppLoad facilities, current 3.28 toolbar/navigation patches, and the existing annotation server. Toolbar insertion and hashed navigation are candidate interfaces, not tested document ownership or export contracts. No device command, installation, private notebook access, service restart, account change, or cloud operation ran.

## Missing prerequisites

- **Stock-library access:** Establish a safe operation that registers a received synthetic image/PDF and folder in the normal library. It must yield stable document and folder identities.
- **Current-document output:** Establish a firmware-specific editor interface that tracks the current document across switches and exports its full visible annotation. Preserve source dimensions and editable stock data. Do not use private live notebook files, runtime SSH, USB-web prerequisites, or cloud transport.
- **Owner acceptance:** After those interfaces work, obtain the owner operations and verdict below. No owner verdict was available in this session. The earlier failed pen-quality result still stands.

These are missing facts in the inspected interfaces, not proof that all stock-editor integrations are impossible. Another blank implementation retry cannot supply device evidence.

## Required owner operations

Perform this sequence only after the integration prerequisites are established. Use the generated synthetic alignment source. Do not transfer project images or expand cloud/account permissions.

1. Open the tablet app on Paper Pro. Record firmware, AppLoad/XOVI versions, desktop dependencies, activation steps, restart limits, and app access. Pair the intended desktop server and associate a visible local folder with its stable identity.
2. Disconnect USB after any approved installation. Receive the known source through authenticated LAN HTTPS with status over the authenticated WebSocket. Do not use runtime SSH. Locate and open the received document through normal tablet operations. Record stable document/server/job identities and source dimensions.
3. Draw near all image edges. Rest the palm, erase, undo, pan, zoom, change display scale, and test orientation through normal controls. Give an explicit usable/unusable latency verdict and palm-handling verdict with the toolbar present.
4. Save and close without Send. Confirm that the originating request remains pending. Reopen the document and confirm editable marks remain. Switch to another bound document and an unbound document. Verify correct context and an explicit unbound state; never infer a job from the active conversation.
5. Select Send in the toolbar. Observe local-save state, durable server acceptance, and originating agent delivery separately. Compare the returned flattened PNG dimensions, edge alignment, and changed pixels with the known source. Confirm the visible pen marks are included, not only the original PDF.
6. Cancel another request and attempt late Send. Confirm terminal cancellation and no image delivery. With two requests/servers, confirm that document switching cannot route output to the wrong destination. Alternate-server Send is not implemented or required for this attempt.
7. Confirm that original source and editable stock work remain recoverable. Record lifecycle and sleep/restart limits. Remove temporary experiment code after the experiment. Keep production blocked until the revised quality gate passes.

## Validation

- **Build:** `mise exec -- bun install --no-save && mise exec -- bun run build` passed in the annotation extension. Vite 7.3.6 built 2371 modules. Upstream use-client and chunk-size warnings remain.
- **Existing suite:** `mise exec -- bun test mise/conf.d/devtools-omp/extensions/image-annotator/test` passed: 7 tests, 0 failures, 39 assertions.
- **Real HTTP smoke:** Two real loopback annotation servers served the built page and source. Missing and cross-request tokens returned 404. No result arrived before explicit submission. One request received the exact uploaded PNG; the other received nothing. The smoke replayed preserved synthetic PNG fixtures. It did not exercise a tablet, LAN HTTPS/WebSocket, pairing, drawing, or export.
- **Tracker check:** The canonical ticket schema passed. It remains claimed with no direct blockers. Dependent production tickets remain waiting.
- **Source review:** No new source diff exists against the parent source identity. No code-review verdict or new independent review was created.

## Changed files

Only the new evidence, result receipt, immutable draft, manifest, and generated projections changed. No source commit was needed. No permanent tests or temporary source were added. Ignored browser build outputs remain local.

## Preserved history

- **Start 1:** [start-0001](../../events/start-0001.yaml) records the first scoped takeover and archived source identity.
- **Result 1:** The blocked `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/workflows/pi-ink-bridge-01-pen-prototype/events/implementation-0002.yaml` and `/run/media/zenobius/Store/Projects/Mine/Github/Dotfiles.worktrees/prototype-pi-ink-bridge-01-pen-prototype/workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/stock-editor-hooks-001/findings.json` remain in the source checkout. Their historical workflow root mismatch is preserved. They are not copied, normalized, repaired, or treated as success.
- **Parent 1:** [start-complete-0003](../../events/start-complete-0003.yaml) records the blocked/unusable result and confirmed prior child shutdown.
- **Start 2:** [start-0004](../../events/start-0004.yaml) records the approved fresh takeover, liveness, reservation checks, and unchanged source.
- **Result 2:** [implementation-0005](../../events/implementation-0005.yaml) records this blocked result. [Fresh findings](../evidence/stock-editor-attempt-002/findings.json) contain interface references and exercised validation.

## Review history

The canonical [ticket](../../../../tracker/tickets/pi-ink-bridge-01-pen-prototype.md) preserves the earlier two-axis review comments. The failed native drawing experiment passed review only for record accuracy; it did not pass pen latency. The stock-editor feasibility review recorded five acceptance limits. The cable-free diagnostic review passed the diagnostic evidence only. No formal worktree review phase or current SUCCESS verdict exists.

No implementation finding is resolved by this attempt. The stock-library, current-document/output, and hardware gates remain open. Base-context inspection accepted preserved base history before this result. That observation does not repair the source-local historical envelope or turn the blocked result into success.

## Merge status

Not merged or pushed. The ticket is not complete. The parent must validate this result and append phase-complete. Do not start production work or treat browser regression checks as tablet acceptance.

## Primary sources

- [Xochitl document storage and access rules](https://developer.remarkable.com/documentation/xochitl)
- [AppLoad application interfaces](https://github.com/asivery/rm-appload)
- [3.28 image toolbar patch](https://github.com/ingatellent/xovi-qmd-extensions/blob/main/3.28/imageStickers.qmd)
- [3.28 document navigation patch](https://github.com/ingatellent/xovi-qmd-extensions/blob/main/3.28/fourFingerSwipeLeftForFinishAndOpenNextDoc.qmd)

