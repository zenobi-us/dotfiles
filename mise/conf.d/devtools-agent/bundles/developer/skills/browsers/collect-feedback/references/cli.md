---
schema: collect-feedback/v1
kind: reference
title: Evidence and feedback CLI reference
---
# Evidence and feedback CLI reference

Look up public command inputs, outputs, and failure states.
For operators and agents. Version: collect-feedback/v1 and collect-evidence/v1.
Use the [how-to](../howto.md) for procedures or the [system explanation](system.md) for record ownership.

## Overview

- **Resolve executables:** [Entrypoints](#entrypoints).
- **Select commands:** [Command index](#command-index).
- **Read results:** [Output and flags](#output-and-flags).
- **Handle failures:** [Exit codes](#exit-codes).
- **Select surfaces:** [Driver limits](#driver-limits).
- **Inspect records:** [API and validation reference](#api-and-validation-reference).

## Entrypoints

Set these paths once. The OMP installation is the example, not a required harness.
All data arguments in these examples are absolute paths. No command depends on the caller's directory.

```sh
BUNDLES="$HOME/.omp/agent/bundles"
EVIDENCE="$BUNDLES/developer/skills/browsers/collect-evidence/scripts/collect-evidence.ts"
FEEDBACK="$BUNDLES/developer/skills/browsers/collect-feedback/scripts/collect-feedback.ts"
"$EVIDENCE" --help
"$FEEDBACK" --help
"$EVIDENCE" --version --json
"$FEEDBACK" --version --json
```

Run the executable directly. Its mise shebang selects Bun and pinned CrustJS dependencies.
Dependency setup can require a network connection. Complete setup before capture or serving.
A writable store, supported records, and Linux non-following file access are required for feedback serving.
The feedback viewer is prebuilt. Startup needs neither a frontend build nor a CDN.

For a complete manual capture example, use [Collect a web image through the CLI](../../collect-evidence/references/manual-web-example.md).

## Command index

The collector owns capture. Feedback invokes it for a request, or imports an explicitly selected sealed run.

| Collector command | Required input | Output or side effect |
|---|---|---|
| `doctor --driver <surf\|playwright\|tui\|gui>` | Installed driver tools and approved surface access | Actual capability result. GUI also requires `--display`, `--window`, `--title`. |
| `init <workspace> --repository <repo> --workflow <id> --run <id> --driver <driver>` | New external workspace and new run identity | Authored `plan.ts`, local configuration, resolved evidence destination. |
| `render <workspace>` | Authored typed plan | Generated `plan.json` and versioned `test-plan.md`. |
| `compile <workspace>` | Valid approved plan | Driver-native workflows and plan fingerprint. |
| `run <workspace> [--test <case-id>]` | Compiled unchanged plan and available driver | Native observations, media, verdicts, and new sealed run. |
| `validate <sealed-run>` | Supported sealed records and original media | Schema, reference, ordering, hash, dimension, and media validation. |
| `verdicts <sealed-run>` | Validated run | Case verdicts from common records. |
| `report <sealed-run>` | Validated run | Self-contained HTML by default. With `--json`, a versioned event contains the HTML. |
| `comment <sealed-run> --url <published-url>` | Validated run and explicit published URL | Versioned manual-step Markdown by default. JSON wraps that text. No posting. |

| Feedback command | Required input | Output or side effect |
|---|---|---|
| `request <workspace> --repository <repo> --workflow <id> --session <id> --port <port>` | Approved compiled workspace matching repository and workflow | Capture, validate, import, then foreground loopback server. Readiness returns URL and actual saved-record paths. |
| `request <sealed-run> --historical` | Explicit earlier run plus the same store and port flags | Historical import and foreground server. No fresh capture. |
| `init <sealed-run> --repository <repo> --workflow <id> --session <id> [--historical]` | Supported sealed run and new session ID | Separate immutable snapshot, case media, `session.json`, index, and returned destination. |
| `validate <session>` | Session directory | Validated source snapshot, cases, asset hashes, and saved annotations. |
| `serve <session> --port <port>` | Validated session and available explicit port | Bundled viewer, loopback HTTP API, exclusive writer lock. |
| `export <session>` | Validated session | Saved records and verified source identities. No mutation. |

Store flags apply only to feedback `init` and `request`. `--port` applies only to `serve` and `request`.
`--historical` applies only to `init` and `request`. IDs contain 1–128 letters, digits, dots, underscores, or hyphens.
IDs start with a letter or digit. Existing destination identities cannot be replaced.

The direct `collect-feedback/scripts/collect-feedback/serve.ts <session> --port <port>` entrypoint uses the same server and command definition.

## Output and flags

- **Machine output:** `--json` writes versioned JSON events or errors to stdout. Diagnostics use stderr. Schemas are `collect-evidence/v1` and `collect-feedback/v1`.
- **Collector defaults:** Human-oriented output is command-specific. `report` prints HTML and `comment` prints Markdown. `--json` wraps their text in events.
- **Feedback defaults:** Commands print JSON with indentation. `--json` emits compact records. Export has kind `export`, not a readiness event.
- **Plain output:** `--plain` selects compact collector JSON or dotted feedback fields. `--quiet` suppresses successful output, not failures.
- **Non-interactive output:** `--no-input` never authorizes actions. Output is uncolored. `--no-color`, `NO_COLOR`, and `TERM=dumb` remain supported.
- **Dry-run:** `--dry-run` validates without writes or server startup. Collector `run --dry-run` does not execute a driver. Request dry-run does not reserve the port or prove driver availability.
- **Generated replacement:** Collector `--force` replaces selected render or compile outputs only. Feedback has no force override.
- **Environment defaults:** `COLLECT_EVIDENCE_REPOSITORY`, `COLLECT_EVIDENCE_DRIVER`, and `COLLECT_FEEDBACK_REPOSITORY` supply non-secret defaults. Flags take precedence. They do not select another store.

A request readiness event includes `url`, `destination.path`, `destination.ref`, and `records.session`, `records.index`, and `records.cases`.
A fresh request also returns its collector result. Readiness proves serving, not a passing application result.

## Exit codes

| Code | Meaning | Important distinction |
|---|---|---|
| 0 | Command completed | Read-only consumers can complete while a recorded case failed. |
| 1 | Operation or assertion failure | Collector `run` maps assertion FAIL to 1. A stopped operation is not a completed run. |
| 2 | Invalid arguments, input, or schema | Unsupported evidence formats fail before feedback import. |
| 3 | Blocked required prerequisite | Includes driver/store unavailability and feedback writer-lock contention. |

Collector read-only consumers do not map stored case verdicts to their process status.
A fresh feedback request can serve a sealed assertion-only FAIL run.
Any BLOCKED case prevents request import, including mixed FAIL/BLOCKED runs. The request returns 3.
Optional video unavailability does not fail valid images.
An occupied feedback port is an operation failure. It never selects a fallback port.

## Driver limits

| Driver | Prerequisites and supported surface | Recording and limits |
|---|---|---|
| Surf | Attended Chrome extension, native host, connected Surf socket, approved web origins | Recording unavailable. Uses a fresh owned session. |
| Playwright | Installed `playwright-cli` and launchable browser | Real WebM when the owned recorder probe succeeds. `PLAYWRIGHT_MCP_EXECUTABLE_PATH` selects an existing browser. |
| TUI | Linux private foot/Cage/wlroots display, termscope interaction, grim pixels, required image tools | Native images only. No ANSI reconstruction. Host setup is specific. Read the complete TUI procedure. |
| GUI | Linux X11, ImageMagick `import`, `xwininfo`, `ffprobe`, exact approved display/window/title | Read-only native images. No GUI input or video. Native Wayland, macOS, and Windows unsupported. |

Driver procedures remain authoritative for approval and host constraints:
[Web](../../collect-evidence/references/web.md), [TUI](../../collect-evidence/references/tui.md), and [GUI](../../collect-evidence/references/gui.md).
A browser screenshot cannot prove native terminal or desktop behavior.
The existence of a driver does not prove coverage on an unexercised host.

## API and validation reference

The [viewer contract](viewer-contract.md#http-api) defines routes, write tokens, payloads, revision ETags, and HTTP error codes.
The [evidence schema](../../collect-evidence/references/evidence-schema.md) defines sealed runs, cases, events, and assets.
The [request contract](request.md) defines collection failure precedence and foreground ownership.
Use the [how-to](../howto.md#export-your-feedback) for a saved-feedback export procedure.
