---
schema: collect-evidence/v1
kind: playbook
---
# Native Linux terminal evidence

Use driver tui through the common collect-evidence CLI. Resolve the installed directory containing SKILL.md. Invoke its absolute scripts/collect-evidence.ts entrypoint from any working directory. Keep plan.ts and temporary captures outside the watched repository. Shared-context selects the sealed destination.

## Verified capability and host limits

CPU-rendered foot and termscope attach to one owned tmux server, pane and PTY. Cage owns a private headless wlroots display. grim captures only its sole output. This is not a capture of the user's existing terminal.

A prepared Fedora 45 x86_64 host passed the public native workflow from /tmp with a temporary resolved repository store. The approved fixture changed from Ready screen through Loading screen to Details screen after 1.5 seconds. Both original 1280 × 720 PNGs were inspected. RGB probes matched [201, 166, 255] and [36, 36, 36]. Text tops at 11 and 31 px confirmed 20 px line spacing. Asset hashes and terminal/display identities matched the originals.

Evidence: workflows/collect-evidence-feedback-02-tui/artifacts/evidence/transition-02. The earlier transition-01 retains the real single-block OCR failure. Sparse-text OCR now reads the actual native frame without cropping or reconstruction. Credential and unapproved-input runs returned BLOCKED with exit 3 before forbidden input. SIGINT returned exit 1, removed the owned runtime and did not seal a run. The separate borrowed tmux session retained its original pane PID. See artifacts/snapshots/validation-implementation-0005.json in the same workflow for exact commands and cleanup observations.

Host setup was separate from capture. On this workstation, prefix every native command with PATH="/home/zenobius/.local/share/collect-evidence/native-tools/fedora-45-x86_64/bin:$PATH". The foot wrapper supplies only private library and terminfo paths. No graphics-version override, installation or publication occurred during capture.

## Prerequisites

Run doctor --driver tui --json. Required installed tools: termscope, tmux, foot, Cage, grim, wlr-randr, Tesseract with English language data, ImageMagick 7 (magick), mq and GNU /usr/bin/mv with exclusive no-copy publication support. When tools exist, doctor checks a private display launch, output access, actual PNG capture and OCR. Missing tools or permissions return exit 3. Complete setup separately. Do not install tools, request sudo, force graphics versions or substitute SVG, ANSI, browser or text reconstructions.

The driver selects WLR_BACKENDS=headless, WLR_RENDERER=pixman and WLR_HEADLESS_OUTPUTS=1. These select the CPU path without forcing a graphics version. Inherited graphics-version/driver overrides block collection. A fresh mode-0700 XDG_RUNTIME_DIR prevents attachment to borrowed Wayland sockets. The driver never attaches to inherited TMUX sessions.

## Author and approve one plan

Run init <external-dir> --repository <repo> --workflow <id> --run <new-id> --driver tui. Author only the generated plan.ts.

- **Terminal scope:** Set base to terminal://private. Set terminal.command to an absolute executable and argument array. Set terminal.cwd to the approved application directory. Set columns and rows to the intended grid, within 20–240 columns and 5–100 rows. This playbook fixes font to monospace:size=12 and lineHeight to 20 pixels.
- **Explicit approval:** Keep approval.origins empty. Copy the exact approved command and directory into approval.terminal. Put every approved input step ID in approval.confirmations, not only Enter. These fields record approval; they cannot grant it. Do not approve remote Git, tool installation, credentials, unintended destructive actions or background daemons during capture.
- **Visible content:** Use locator screen. A wait requires text. An expect requires text, a scene-name shot and image checks. A press requires one termscope key plus the expected current screen. A fill requires literal text plus the expected current screen. Fill rejects control characters; use a separate approved RET step for Enter.
- **Image expectations:** Each expect supplies image.width and image.height, pixel probes with x, y, rgb and optional tolerance, plus at least two lines with text, top and optional tolerance. Different line positions check spacing. Select contrasting foreground/background probes and stable labels. Derive expected values from the intended native fixture, not a rewritten image.

A native assertion has this shape. These coordinates were exercised on the prepared host. Derive other hosts’ expectations from their intended fixture and native image.

```typescript
{ do: "expect", says: "Check the details screen.", locator: "screen",
  text: "Details screen", shot: "details-screen",
  image: { width: 1280, height: 720,
    pixels: [{ x: 10, y: 55, rgb: [201, 166, 255], tolerance: 0 }],
    lines: [{ text: "Details screen", top: 11, tolerance: 2 },
            { text: "Selected item", top: 31, tolerance: 2 }] } }
```

Run render <external-dir>. Show the generated command, directory, terminal settings and actions to the user. Confirm scope before compile. Run run <external-dir> --dry-run to inspect routing without writes or driver execution.

## Verify a real transition

1. Run the approved application. Expect its first screen with native image checks.
2. Use an approved press or fill step. Before input, the driver checks termscope state, OCR of actual native pixels, the expected current screen and the approved stable step ID. A credential prompt stops the case before input.
3. Expect a distinct second screen. Use a real delayed transition to expose an earlier-frame capture. The driver requires expected text in both termscope and OCR, plus two consecutive identical native frame hashes. A matching buffer alone cannot pass.
4. Inspect both actual PNG files with an image viewer. Check the transition, colours, line spacing and recorded dimensions. OCR can miss text and cannot decide usability. Do not accept a stale image because the buffer advanced.
5. Run validate, verdicts, report and comment against the same sealed run. Compare source SHA-256, asset IDs, capture sequences, assertions, dimensions and terminal identities. Do not edit or recolour source PNGs. A retry needs a new run ID.
6. Exercise a credential prompt and an unapproved input step without entering secrets. Confirm exit 3 and BLOCKED. Interrupt another capture. Confirm that no incomplete run is sealed and borrowed terminals remain open.

## Identity and originals

Each native asset records the session name, socket path, pane ID, PTY, private runtime directory, Wayland display, Cage PID, foot PID, grid, font, line height and owned cleanup state. Common records compute actual PNG dimensions and SHA-256. The report shows the same identity. Native termscope JSONL, stderr and frame PNGs remain under native/ without schema injection or reconstruction.

Cases share the one approved application session in plan order. Preconditions inspect that application before case actions. Cases do not reset it automatically.

## Safety and cleanup

The collector closes only its owned termscope process, private tmux server and Cage/foot display. It removes only its runtime directory. A cleanup error stops finalization and retains diagnostics. Inspect application-specific filesystem and external side effects separately. Borrowed terminals are never attached, closed or killed.

SIGINT and SIGTERM stop new actions and release owned resources before failure. Do not run remote Git, commit, push, publish or install tools during capture. Publication needs separate approval.

## Regression check

From an unrelated directory, run RUN_NATIVE_EVIDENCE_TESTS=1 mise exec -- bun test <absolute-installed-skill>/scripts/browser-evidence/test/native-workflow.test.ts with the prepared native tools PATH. This opt-in public test uses a real delayed terminal frame and checks native assertions, source hashes, shared terminal identity and released runtime. It requires this playbook’s prepared 1280 × 720 Linux display/font environment. Missing prerequisites fail the opt-in check; they do not become fake evidence.

## Limits

Native video is unavailable. No empty or simulated recording is created. Font substitution, output size, OCR accuracy and CPU rendering depend on the prepared host. Missing required capabilities block collection. No borrowed-session capture, desktop capture, arbitrary window selection, graphics fallback or unverified platform support is claimed.

## Capture errors, blocked checks and confirmations

Native capture errors leave unexecuted assertions as `not-run` and record capture failure separately. A captured image that fails its content checks remains an assertion failure.

Native diagnostics are registered before preconditions. An unmet precondition retains termscope JSONL, tool stderr and captured frames under `native/workflows/`, even when every case is blocked. Owned processes and the private runtime are still released.

For an input step, include the actual expected confirmation prompt in `screen`, not only a heading behind it. The approved step ID authorizes only that expected operation. Every inspected screen, including preconditions, waits and assertions, is checked for questions, confirmation instructions and yes/no prompts in terminal text and native OCR. An unexpected prompt stops the case with exit 3 and `BLOCKED`, even when the plan contains no input. Only an explicitly approved input step whose `screen` names the actual prompt permits that operation. Credential prompts always require human handling. Prompt detection is conservative and depends on English text and OCR; inspect originals and keep unexpected dialogs for human review.

The opt-in native suite covers delayed rendering, post-doctor grim failure, unmet preconditions, unexpected confirmations that retain the approved heading, explicitly approved prompts, expect-only unexpected prompts, confirmations during preconditions and waits, and genuine image assertion failures. All cases use the public CLI and sealed-run validation.


## Credential prompt coverage

Snapshot and native OCR checks stop at token, API-key, PIN and OTP input fields such as `API token:`, `Token:`, `API-key:`, `PIN:` and `OTP:`. Input requests such as `Enter your access token` also stop. Ordinary output such as `Token count 3` is not a credential prompt. Existing password, passphrase, username, login and verification checks remain unchanged.

Credential stops are unconditional. A named `screen` and an approved fill or press step cannot authorize credential entry. Expect-only cases also return exit 3 and `BLOCKED`. Snapshot detection can stop before a PNG is captured; retained native diagnostics then contain the terminal snapshot, not an invented prompt image.

The public native suite checks six prompt variants with expect-only, approved fill and approved Enter paths. Each must report a credential stop with no input received and release its owned runtime, server and processes. A non-prompt word case must still pass. The separate fix-0023 smoke retained a passing delayed transition and twelve blocked API-token/API-key/PIN/OTP cases in the resolved parent evidence store.

