---
schema: collect-evidence/v1
name: collect-evidence
description: Collects real browser and native terminal images, checked assertions and immutable evidence through Surf, Playwright, the Linux TUI driver or scoped Linux X11 GUI capture. Use for QA, acceptance checks, visual proof and screenshot handoffs. Produces versioned runs, case notes, verified media, reports and manual-step comments.
user-invocable: true
---

# collect-evidence

Use one typed `Plan` and the existing `Driver` boundary. Capture completion and assertion results are separate. A screenshot alone is not a pass.

## Procedure

1. Read the ticket, changed source and approved scope. For Surf or Playwright, read `references/web.md`. For the native Linux TUI driver, read `references/tui.md`, including its host limits. For GUI collection, read `references/gui.md`.
2. Resolve the installed directory containing this `SKILL.md`. Script paths are relative to that directory, not the repository. Use its absolute `scripts/collect-evidence.ts` entrypoint from any working directory.
3. Complete dependency setup separately. Run `doctor --driver surf`, `doctor --driver playwright` or `doctor --driver tui`. For GUI, run `doctor --driver gui --display <approved-display> --window <approved-id-or-root> --title <exact-title>`. Doctor checks installed capabilities and native capture access on that exact approved surface. Never install a browser or tool during collection.
4. Run `init <external-working-directory> --repository <repository-in-scope> --workflow <workflow-id> --run <new-run-id> --driver <driver>`. The CLI resolves the evidence destination through shared-context. The working directory must be outside the watched repository.
5. Author only `plan.ts`. Give cases stable IDs, purposes, preconditions, actions and executable assertions. Give captures scene names, not success claims. Read `scripts/browser-evidence/plan.ts` for the typed contract.
6. Run `render <working-directory>`. Show the generated procedure to the user. Confirm the origins, actions, attended operation and optional video. Put approved origins in `approval.origins`. Put approved click and Enter step IDs in `approval.confirmations`. For TUI collection, record the exact approved command and directory in `approval.terminal`, keep origins empty and approve every input step. For GUI, match `approval.gui` to the exact `gui` display, window and title. GUI collection is read-only; all input and confirmation steps are rejected, even when listed as approved. These fields record approval; they do not grant it.
7. Run `compile <working-directory>`. Use `run <working-directory> --dry-run` to inspect the selected destination without starting a driver or writing files.
8. Run `run <working-directory>`. Temporary captures stay outside the watched source tree. The CLI checks preconditions, runs the real driver, closes its owned session, validates the common records and finalizes a new sealed run into the selected evidence store.
9. Inspect actual images and visible screen state. Check assertion outcomes and cleanup. Read every limitation. A missing required driver blocks that case. Never replace it with a fake capture, reconstructed terminal image or another capture API.
10. Run `validate <sealed-run>`. Use `verdicts`, `report` and `comment` as read-only consumers. Keep publication separate and explicit.

## Safety

- **Inspect before acting.** Before Enter or a confirmation, check the live screen and approved step. Web and TUI drivers stop at credential prompts, unapproved origins and unapproved confirmation actions. GUI collection sends no input and cannot enter credentials or confirm operations. Never fill a GitHub prompt or another credential prompt.
- **Keep capture local.** During capture, perform no remote Git command, commit, push, tool installation or credential entry. Publication needs a separate access-boundary check and explicit approval.
- **Own cleanup resources.** Use fresh collector sessions. Close only resources created by the collector. Keep user Chrome, existing tabs and borrowed sessions open.
- **Keep evidence immutable.** A retry needs a new run identity. Captures within a step have increasing sequences. Never overwrite a sealed asset, change historical evidence or rewrite a third-party original.
- **Report interruptions.** On SIGINT or SIGTERM, stop new work and release owned resources. An interrupted capture is not a completed run. Retained temporary files are incomplete diagnostics, not sealed evidence.

## Commands

All commands use a mise Bun shebang and pinned CrustJS dependencies. Run the executable directly. Complete any first-run dependency download before capture.

| Command | Contract |
|---|---|
| `doctor --driver <driver>` | Check the installed CLI and connection or browser launch; do not install tools. |
| `init <dir> --repository <repo> --workflow <id> --run <id>` | Create an external authored plan and resolve the final evidence route. |
| `render <dir>` | Generate `plan.json` and versioned `test-plan.md`. |
| `compile <dir>` | Generate driver-native workflows and a plan fingerprint. |
| `run <dir> [--test <case-id>]` | Execute the compiled plan and finalize a new immutable run. |
| `validate <run>` | Check schemas, references, order, source hashes, dimensions and sealed media. |
| `report <run>` | Print a self-contained HTML report from the validated common records. |
| `verdicts <run>` | Read the case verdicts from the same common records. |
| `comment <run> --url <explicit-published-url>` | Print versioned Markdown with manual steps and the report link. Do not post it. |

Use `--help` and `--version` for discovery. Put command flags after the command. `--json` emits `collect-evidence/v1` event or error records on stdout. Diagnostics go to stderr. `--plain`, `--quiet`, `--no-color` and `--no-input` support non-interactive use. Output has no colour by default and respects `NO_COLOR` and `TERM=dumb`.

`--dry-run` performs no driver execution or writes. `--force` replaces only selected generated render or compile outputs. It cannot override approval, schemas, permissions, hashes or existing evidence identities. Flags override `COLLECT_EVIDENCE_REPOSITORY` and `COLLECT_EVIDENCE_DRIVER`. These non-secret defaults do not select a separate store.

Exit codes: `0` completed command, `1` operation or assertion failure, `2` invalid arguments or records, `3` blocked required prerequisite. Only `run` maps case outcomes to exit codes 1 and 3. Valid read-only consumers return 0 even when a recorded case failed. A valid image case does not fail merely because optional video is unavailable.

## Records and consumers

Read `references/evidence-schema.md` for the common contract. Each sealed run contains `run.json`, `plan.ts`, `plan.json` and `index.md`. Each case contains `case.json`, `index.md`, `events.jsonl` and `media/`. Preserve driver-native files and logs under `native/` without rewriting their bytes.

Use `writing-reports` only to present validated common records. Do not create another capture system, verdict source or annotation store. Historical evidence remains unchanged. Unsupported explicit schemas require an explicit import into a new identity, not an in-place migration. Keep unknown capture times unknown.

## Surface limits

Surf and Playwright remain the web drivers. The `tui` driver implements the private Linux foot/Cage/wlroots/grim path in `references/tui.md`. A prepared Fedora 45 host passed the real delayed-transition workflow, native RGB and 20 px line-spacing checks, credential and unapproved-input stops, and interrupted owned cleanup. See the TUI playbook for evidence and host limits. The `gui` driver captures approved Linux X11 windows or displays with ImageMagick import. Read `references/gui.md` for exact scope approval, pixel assertions and platform limits. It never changes focus, enters credentials, confirms operations or closes borrowed windows. Browser screenshots do not prove native terminal or desktop behaviour.
