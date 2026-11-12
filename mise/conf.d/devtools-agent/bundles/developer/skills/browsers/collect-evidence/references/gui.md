---
schema: collect-evidence/v1
kind: playbook
---
# Scoped native GUI collection

## Supported surface

Use `gui` for read-only Linux X11 window or display capture through ImageMagick `import`. Native Wayland windows, portals, macOS, Windows and GUI recording are unsupported. Do not substitute browser screenshots, reconstructed images or an unapproved display.

The collector borrows the selected surface. It does not launch applications, change focus, send input, enter credentials, accept confirmations or close windows. Prepare application state separately. If a case needs input, record a `human` step or stop. Approval cannot enable GUI input.

Keep the selected window visible and unobscured. X11 capture can include occlusion. A root capture includes the whole approved display. Approve root only when all visible content is in scope. The collector does not detect or redact secrets in captured pixels.

## Check tools and permissions

Resolve the installed directory that contains `SKILL.md` as `COLLECT_EVIDENCE_SKILL_ROOT`. Run its absolute `scripts/collect-evidence.ts` entrypoint from any working directory. Complete dependency setup before collection. Required tools are Linux X11, `xwininfo`, ImageMagick `import`, `magick`, and the common `mq` and GNU `mv` prerequisites. Never install tools, request sudo or change X11 access rules during collection.

Select an exact local display and hexadecimal window ID. Use `root` only for an approved whole display. Obtain the window title from the approved application, not by capturing an unrelated desktop.

```sh
"$COLLECT_EVIDENCE_SKILL_ROOT/scripts/collect-evidence.ts" doctor --driver gui --display :0 --window 0x123456 --title 'Approved application' --json
```

Doctor queries that window, checks its exact title and viewable state, captures its native pixels into private temporary storage, and decodes the image. It removes its probe afterward. Missing tools, denied X11 authorization, an inaccessible window or a changed title return exit 3. Missing scope returns exit 2. Doctor never captures another surface as a fallback. The `run` command repeats these checks per case and seals unavailable cases as `BLOCKED`.

## Author one plan

Use the common `init`, `render`, `compile`, `run`, `validate`, `verdicts`, `report` and `comment` commands. Keep the workspace outside the watched repository. Use a new run ID for every retry. `--dry-run` checks the route and plan without querying or capturing a display.

Put the exact selected scope in both `gui` and `approval.gui`. Set `base` to `gui://local` and keep origins empty. For a window, `title` must match the actual X11 title. For `root`, use a descriptive display label. Confirm scope before running; the fields record approval, not permission to collect private content.

```ts
export const plan = {
  schema: "collect-evidence/v1", kind: "plan", workId: "gui-review",
  driver: "gui", base: "gui://local",
  gui: { display: ":0", window: "0x123456", title: "Approved application" },
  approval: { origins: [], gui: { display: ":0", window: "0x123456", title: "Approved application" } },
  tests: [{
    id: "ready", claim: "Inspect the approved application",
    pass: "The native scene matches", fail: "The native scene differs",
    steps: [{
      do: "expect", says: "Inspect the selected window.",
      locator: "screen", visible: true, shot: "application-scene",
      image: { width: 480, height: 260,
        pixels: [{ x: 40, y: 110, rgb: [201, 166, 255] }], lines: [] },
    }],
  }],
};
```

Use dimensions and RGB probes that distinguish the required state. The driver captures two equal consecutive native frames and checks dimensions and every probe against the same original PNG. It checks title and viewability before and after capture. A timeout retains the real image and records a failed assertion. OCR text and text-line assertions are unsupported. Pixel assertions cannot establish usability or prove all visible text. Inspect every original PNG before presenting the result.

## Provenance and cleanup

Common assets record `surface: gui`, `driver: gui`, `captureMethod: x11-imagemagick-import`, actual dimensions, capture time, tool version and SHA-256. The `gui` identity contains display, window, title, `ownership: borrowed` and `cleanup: preserved`. Source originals remain unchanged under `native/`. Reports and verdicts consume these common records.

No borrowed process receives a shutdown request. Temporary doctor and frame files are the only resources the driver removes. On interruption, collection stops without claiming completion. The common pipeline retains incomplete diagnostics. No remote Git, device-side action, tool installation or publication occurs during capture.

## Verification and changes

Before this slice, installed `doctor --driver gui --json` returned exit 2 with `--driver must be surf, playwright or tui`.

The public regression runs a temporary installed copy from an unrelated directory with a temporary shared-context-resolved repository store. Supply only an approved collector-owned X11 fixture through `GUI_EVIDENCE_SCOPE` and `GUI_EVIDENCE_IMAGE`, and enable `RUN_GUI_EVIDENCE_TESTS=1`. It checks native pixels, failed pixel assertions, denied X11 authorization, title mismatch, scope mismatch, credential-input rejection, confirmation rejection and borrowed-window preservation. It uses `/dev/null` as XAUTHORITY for the denial case; the host must enforce X11 authorization.

This change adds the native X11 driver, selected-surface doctor probe, explicit GUI scope approval, common provenance, sealed blocked outcomes and the read-only playbook. Existing web and TUI drivers remain unchanged.

### Observed verification

The public evidence suite ran on the prepared Linux host: 102 passed, 31 skipped, 0 failed. The installed-copy GUI scenario passed with a collector-owned GTK X11 fixture. The original 480 × 260 PNG was inspected directly. It shows the expected heading, purple and cyan panels, and fixture notice, with no unrelated desktop content. Its SHA-256 is `2baf864452cc75f47db3e8cc9876d3af5e7f7765321f4ae5a2defc7b718076ff`.

The same public scenario retained a failed dimension assertion and blocked X11 authorization and title-mismatch cases. Scope mismatch, credential-input and Enter-confirmation plans stopped before collection. The fixture remained viewable after all cases. Only the fixture's owning smoke harness closed it afterward.

A retained TUI transition archive validated through the current public command. Fresh TUI capture was blocked by missing foot, grim and tesseract. Playwright doctor was blocked because its Chrome distribution was absent. No tools were installed.

The additional live Surf regression failed at `approved-space.3`: it expected `Submitted` but observed `Not submitted`. Its sealed native records remain in the implementation workflow. The GUI slice does not change Surf input handling. This result is not a passing web acceptance claim. Independent review must assess it before integration.

### Capture-stage failure status

A native capture command failure after a successful identity check records `BLOCKED`, `captureStatus: failed`, `assertionResult: not-run` and no asset. This also applies to the doctor probe during collection. A missing tool, denied X11 authorization or title mismatch that stops collection before capture keeps `captureStatus: not-requested`.

The installed-copy GUI regression uses a temporary ImageMagick PNG-denial policy to exercise a real native capture failure. It also checks the distinct pre-capture permission and identity outcomes. The policy and run stores are removed after the test.

