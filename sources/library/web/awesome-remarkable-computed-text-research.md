---
fetched_at: 2026-10-01T02:28:07.000Z
id: awesome-remarkable-computed-text-research
linked_from: []
source: web
title: Computed text extensions for reMarkable
type: research
url: https://github.com/reHackable/awesome-reMarkable
---

# Computed text extensions for reMarkable

## Finding

No exact extension was found in Awesome reMarkable or the targeted project search. No found project combines a movable notebook object, JavaScript or Python execution, result replacement, and a source-reveal icon.

## Closest deterministic project

[rmgraph](https://github.com/tatjam/rmgraph) is a standalone graphing-calculator notebook for reMarkable 2. Its source calls equations math objects. A page stores each `MathExpression` with a position, and the notebook supports adding and dragging expressions. Its local evaluator uses a shunting-yard parser.

rmgraph does not run JavaScript or Python. It does not replace an expression with an answer-only object or provide a border icon that reveals source. It is a separate application, not an extension to native reMarkable notebooks.

## Closest native-notebook interaction

[Smart Remarkable](https://github.com/yangg1224/smart_remarkable) is the closest interaction match inside native notebooks. Its Select Mode accepts a selected question, lets the user choose an answer box, and draws the answer as movable reMarkable pen strokes. Its XOVI extension adds an LLM button to the native selection menu.

Smart Remarkable does not run JavaScript or Python. It sends a screenshot to an external vision model. It does not replace the source with a linked result object. It has no icon that reveals stored source code. The project has no published releases. Users must cross-compile and copy the binary.

## Related projects

- [Inkling](https://github.com/nathanmarlor/inkling) adds an AI button to the native selection menu. It sends selected handwriting to an external model and writes the answer below the source. It is a proof of concept for reMarkable 2.
- [RPN Calculator](https://github.com/rmkit-dev/rmkit/tree/master/src/rpncalc) is a standalone calculator application. It does not add computed objects to native notebooks.
- [reHackable Calculator](https://github.com/reHackable/Calculator) is an early-alpha standalone calculator. Its last repository push was in 2020.
- [rmathlab](https://github.com/Samdney/rmathlab) exports notebook pages to Mathpix for math recognition and LaTeX generation. It does not calculate inside a notebook.

## Implementation gap

XOVI can add buttons to the native selection menu. Smart Remarkable and Inkling prove this interaction. A linked source-and-result object needs new metadata, object tracking after movement, and a custom overlay. No supported native-notebook extension API for this object model was found.

A custom application is safer than a native notebook patch for JavaScript or Python execution. An expression-only evaluator is safer than unrestricted code execution.

## Device risk

Official reMarkable documentation states that Paper Pro modifications require Developer Mode. Enabling this mode factory-resets the tablet and weakens its security model. Smart Remarkable supports reMarkable 2 and Paper Pro builds, but Paper Pro input modules support only listed OS versions.

## Primary sources

- https://github.com/reHackable/awesome-reMarkable
- https://github.com/tatjam/rmgraph
- https://github.com/tatjam/rmgraph/blob/master/src/widgets/Notebook.h
- https://github.com/tatjam/rmgraph/blob/master/src/widgets/Notebook.cpp
- https://github.com/tatjam/rmgraph/blob/master/src/math/MathExpression.cpp
- https://github.com/yangg1224/smart_remarkable
- https://github.com/yangg1224/smart_remarkable/blob/main/SELECT_MODE.md
- https://github.com/nathanmarlor/inkling
- https://github.com/asivery/xovi
- https://github.com/rmkit-dev/rmkit/tree/master/src/rpncalc
- https://github.com/reHackable/Calculator
- https://github.com/Samdney/rmathlab
- https://developer.remarkable.com/documentation/developer-mode

## Research scope and evidence standard

The existing findings above remain unchanged. This section proposes an implementation for a new computed-text application. Claims under **Verified** come from primary project repositories or official vendor documentation. Claims under **Proposal** are design choices and must not be read as platform guarantees.

## Verified platform and host facts

### AppLoad

- **Verified:** AppLoad is a XOVI extension for RMPP applications. Frontends are QML. A backend is optional, may use any language, receives a temporary Unix socket path as `argv[1]`, and must follow the AppLoad protocol. The repository documents the application directory, `manifest.json`, executable backend entry, QML `close` signal, `unloading()` function, `net.asivery.AppLoad 1.0`, `sendMesssage(type, contents)`, and `onMessageReceived`. Source: [AppLoad README](https://github.com/asivery/rm-appload/blob/master/README.MD).
- **Verified:** The manifest supports `id`, `name`, `loadsBackend`, `entry`, `canHaveMultipleFrontends`, `supportsScaling`, `aspectRatio`, and `width`. AppLoad can keep a backend alive and can launch an application as a window. Source: [AppLoad README](https://github.com/asivery/rm-appload/blob/master/README.MD).
- **Verified:** AppLoad provides a PC emulator workflow and publishes releases. Source: [AppLoad README](https://github.com/asivery/rm-appload/blob/master/README.MD), [AppLoad releases](https://github.com/asivery/rm-appload/releases).
- **Verified:** The repository contains the launcher, QML entry point, backend clients, backend examples, and manifest resources. The current backend client path is `backends/appload-clients`. Sources: [AppLoad tree](https://github.com/asivery/rm-appload/tree/master), [backend clients](https://github.com/asivery/rm-appload/tree/master/backends/appload-clients), [examples](https://github.com/asivery/rm-appload/tree/master/examples), [full manifest example](https://github.com/asivery/rm-appload/blob/master/examples/appload/full/manifest.json).
- **Verified:** The current protocol uses a Unix-domain `AF_UNIX`/`SOCK_SEQPACKET` socket. Its packet header contains an integer message type and integer payload length; the source caps payloads at 10 MiB. System message types reserve `-1` for terminate, `-2` for a new coordinator/frontend, and `-3` for a lost coordinator/frontend. Sources: [protocol.h](https://github.com/asivery/rm-appload/blob/master/src/protocol.h), [management.cpp](https://github.com/asivery/rm-appload/blob/master/src/management.cpp), [Rust backend client](https://github.com/asivery/rm-appload/blob/master/backends/appload-clients/rust-backend/src/lib.rs).
- **Proposal:** Use one AppLoad frontend and one long-lived local backend. Use positive application message types for a versioned JSON envelope over the documented socket protocol. Treat the AppLoad packet framing as fixed and the JSON envelope as this app's API. Reject payloads above a smaller app limit before they approach AppLoad's 10 MiB ceiling.

### reMarkable software and device support

- **Verified:** reMarkable documents Developer Mode as a device setting for installing and running third-party software. It warns that enabling it factory-resets the device and changes the security posture. Source: [reMarkable Developer Mode](https://developer.remarkable.com/documentation/developer-mode).
- **Verified:** Official reMarkable developer documentation provides the supported developer workflow and device documentation. Source: [reMarkable developer portal](https://developer.remarkable.com/).
- **Verified:** Current AppLoad release assets include `appload-arm32.tar.gz` and `appload-aarch64.tar.gz`; its shim detects RM1, RM2, RMPP, RMPPM, and RMPPURE. Sources: [v0.6.0 release](https://github.com/asivery/rm-appload/releases/tag/v0.6.0), [release workflow](https://github.com/asivery/rm-appload/blob/master/.github/workflows/build-release.yml), [shim device detection](https://github.com/asivery/rm-appload/blob/master/shim/src/shim.cpp).
- **Proposal:** The first release should target the reMarkable 2 through AppLoad's supported XOVI/RMPP path. Paper Pro and Move are separate compatibility targets. Do not claim support until the exact AppLoad/XOVI release, Qt runtime, input behavior, framebuffer size, and device OS have passed the acceptance matrix.
- **Verified:** Qt Quick provides QML controls and input primitives such as `TextInput`, `TextEdit`, `MouseArea`, `DragHandler`, and `PinchHandler`. Sources: [Qt TextInput](https://doc.qt.io/qt-6/qml-qtquick-textinput.html), [Qt TextEdit](https://doc.qt.io/qt-6/qml-qtquick-textedit.html), [Qt MouseArea](https://doc.qt.io/qt-6/qml-qtquick-mousearea.html), [Qt DragHandler](https://doc.qt.io/qt-6/qml-qtquick-draghandler.html), [Qt PinchHandler](https://doc.qt.io/qt-6/qml-qtquick-pinchhandler.html).
- **Verified:** Qt text controls use input focus and virtual-keyboard integration through Qt Quick input methods. Sources: [Qt input focus](https://doc.qt.io/qt-6/qtquick-input-focus.html), [Qt input method](https://doc.qt.io/qt-6/qml-qtquick-inputmethod.html).
- **Proposal:** Avoid relying on continuous pinch animation, hover, colour, or high-frequency repaint. E-ink interaction should use explicit press, drag, resize-handle, and commit states with a single coalesced redraw after each gesture. Use a conventional `TextEdit` only while source editing is open.

### rmgraph precedent

- **Verified:** rmgraph stores drawn strokes and math expressions in a page, stores an expression position, and has explicit drawing, adding, and dragging states. Its notebook code uses a fixed page box and redraw flags. Sources: [rmgraph Notebook.h](https://github.com/tatjam/rmgraph/blob/master/src/widgets/Notebook.h), [rmgraph Notebook.cpp](https://github.com/tatjam/rmgraph/blob/master/src/widgets/Notebook.cpp).
- **Verified:** rmgraph evaluates expressions with a tokenizer/shunting-yard style pipeline and a small function/operator set. Source: [rmgraph MathExpression.cpp](https://github.com/tatjam/rmgraph/blob/master/src/math/MathExpression.cpp).
- **Proposal:** Reuse the precedent's separation of page coordinates, object coordinates, interaction state, and dirty redraw regions. Do not copy its parser as a security boundary without adding token, depth, operation, and numeric limits.

## Product UX and object model

### User flow

1. Choose **New computed text**.
2. Drag on the page to create a box. The box has a minimum size and a visible thin border only while selected.
3. Drag inside the box to move it. Drag the lower-right handle to resize it. Keep movement and resize mutually exclusive.
4. Choose one runtime: `math`, `javascript`, or `python`.
5. Tap the source area or the `fx` badge. A modal editor opens with the current source and runtime selector. The editor has `Evaluate`, `Cancel`, and `Save`.
6. Enter `356 / 135`, tap `Evaluate`, and show only the formatted answer, for example `2.637037037`. The source is not shown in the normal state.
7. Tap the small `fx` badge on the border to reveal the source editor. Re-evaluation replaces the displayed answer but preserves the source and object identity.
8. If evaluation fails, show a short error in the box and keep the last successful answer available in the object history. Never replace source with an error string.

### Object schema (proposal)

```json
{
  "schema": 1,
  "id": "uuid",
  "pageId": "document-page-uuid",
  "rect": {"x": 220, "y": 460, "width": 420, "height": 180},
  "runtime": "math",
  "source": "356 / 135",
  "display": "2.637037037037037",
  "status": "evaluated",
  "revision": 3,
  "sourceRevision": 2,
  "evaluatedAt": "2026-10-01T00:00:00Z",
  "limits": {"wallMs": 100, "ops": 10000, "outputChars": 256},
  "lastError": null,
  "history": [{"revision": 2, "display": "2.637037037037037"}]
}
```

`source` is always retained. `display` is derived and may be rebuilt. `rect` is in logical page coordinates, not screen pixels. `revision` changes for every committed source or geometry edit. `sourceRevision` changes only for source/runtime changes. `history` is bounded and optional; the undo stack is authoritative during the session.

### State transitions (proposal)

- `new -> idle`: create object with empty source and `needs_input` status.
- `idle -> selected`: tap border, answer, or object body.
- `selected -> moving`: press inside body and cross a small movement threshold.
- `selected -> resizing`: press resize handle and cross the threshold.
- `moving|resizing -> selected`: release; clamp rectangle and commit one undo command.
- `selected -> editing`: tap `fx`; freeze geometry and focus `TextEdit`.
- `editing -> evaluating`: tap `Evaluate`; disable duplicate submits.
- `evaluating -> evaluated`: backend returns a bounded result with matching object id and revision.
- `evaluating -> error`: backend returns a structured error; preserve source and prior display.
- `editing -> selected`: `Cancel` restores the pre-edit draft.
- Any state -> `deleted`: delete command; undo restores the full object.
- Late backend responses are ignored when their revision is not current.

## Frontend/backend contract (proposal)

Use JSON messages with a request id and protocol version. Each request includes `objectId` and `revision` where relevant.

```json
{"v":1,"id":"r17","op":"evaluate","objectId":"uuid","revision":3,"runtime":"math","source":"356 / 135","limits":{"wallMs":100,"ops":10000}}
```

```json
{"v":1,"id":"r17","ok":true,"objectId":"uuid","revision":3,"display":"2.637037037037037","type":"number","warnings":[]}
```

```json
{"v":1,"id":"r17","ok":false,"objectId":"uuid","revision":3,"error":{"code":"LIMIT","message":"operation limit exceeded"}}
```

Additional operations are `hello`, `load`, `save`, `evaluate`, `cancel`, `ping`, and `shutdown`. The frontend owns interaction and optimistic geometry. The backend owns evaluation, schema migration, and atomic persistence. Never send a QML object pointer or an unbounded string. Cap every message and reject unknown protocol versions.

## Persistence, recovery, undo, and migration (proposal)

- Store app data under the AppLoad application directory, with a documented subdirectory such as `data/`. AppLoad installs applications under `/home/root/xovi/exthome/appload/`; confirm the writable path and persistence behavior on the target build before release. Do not assume a native notebook storage API. Source: [AppLoad README](https://github.com/asivery/rm-appload/blob/master/README.MD).
- Keep one JSON document per notebook/page or one small manifest plus per-page files. For the first release, use `computed-text.json` with `{schema, appVersion, pages, objects}` and an atomic write pattern: write a temporary file, flush and close it, then rename it over the previous file. Keep `.bak` from the last successful commit.
- On startup, load the main file, validate every object, then fall back to `.bak` if parsing or schema validation fails. Write a recovery notice into the UI, not into source text.
- Debounce geometry saves after release and save source immediately after a successful `Save` or after a successful evaluation. Never write on every pointer move.
- Keep an in-memory command stack with `CreateObject`, `MoveObject`, `ResizeObject`, `EditSource`, `ChangeRuntime`, `EvaluateResult`, and `DeleteObject`. Coalesce one drag or resize gesture into one command. Undo restores source, runtime, rectangle, display, status, and revision.
- Migrations are pure functions from schema `n` to `n+1`. Refuse future schemas without modifying the file, preserve the backup, and show an actionable error. Include a migration test fixture for every supported prior schema.

## Evaluation choices and security model

### Restricted math

**Proposal:** Make math the default and the strongest mode. Parse a small grammar into an AST: decimal literals, parentheses, unary `+/-`, binary `+ - * / % ^`, and a fixed allow-list such as `abs`, `sqrt`, `min`, `max`, `sin`, `cos`, and `tan`. Reject identifiers, member access, assignment, strings, arrays, loops, imports, and function definitions. Enforce maximum source bytes, token count, AST depth, operation count, finite numeric results, division checks, and output length. A small dedicated parser is preferable to embedding a general-purpose language. rmgraph's parser is a useful precedent, not a security proof. Primary precedent: [rmgraph MathExpression.cpp](https://github.com/tatjam/rmgraph/blob/master/src/math/MathExpression.cpp).

### JavaScript

- **Verified:** QuickJS exposes runtime and context APIs, memory limits, a runtime interrupt handler, and job-queue support. Source: [QuickJS README](https://github.com/bellard/quickjs/blob/master/doc/quickjs.html), [QuickJS source](https://github.com/bellard/quickjs/tree/master).
- **Verified:** quickjs-ng documents memory limits and interrupt handling as runtime controls. Source: [quickjs-ng README](https://github.com/quickjs-ng/quickjs), [quickjs-ng API headers](https://github.com/quickjs-ng/quickjs/tree/master/quickjs).
- **Proposal:** Use a dedicated worker process, not the QML process, with QuickJS or quickjs-ng. Create a fresh runtime per evaluation. Install no modules, no host callbacks, no filesystem/network bindings, and no dynamic native library loading. Set memory and stack limits, an interrupt deadline, a job limit, source/output limits, and a result type allow-list. Kill and recreate the worker after timeout, protocol violation, or memory fault. The interrupt callback is a limit mechanism, not proof that every host integration is safe.

### Python

- **Verified:** CPython's own documentation describes `eval` and `exec` as execution of arbitrary Python code and documents that `__builtins__` can be supplied, but this is not a security sandbox. Sources: [Python eval](https://docs.python.org/3/library/functions.html#eval), [Python exec](https://docs.python.org/3/library/functions.html#exec).
- **Verified:** Python subprocesses and multiprocessing create process boundaries but do not, by themselves, impose a security policy. Sources: [Python subprocess](https://docs.python.org/3/library/subprocess.html), [Python multiprocessing](https://docs.python.org/3/library/multiprocessing.html).
- **Proposal:** Do not run Python in-process and do not promise that restricted builtins make CPython safe. The safe product choice is to ship Python as **experimental and opt-in**, in a separate worker with no inherited environment, no network, no filesystem access, a read-only minimal standard library if required, a wall-clock watchdog, memory/process/file-size limits, and a kill-and-restart policy. On the device, the first release should disable Python unless these OS controls are verified. If strong isolation is unavailable, expose Python as unavailable rather than a false sandbox.

### Common limits

Set defaults and make them visible in a diagnostics screen: source 8 KiB; output 256 UTF-8 bytes; AST depth 64; 10,000 operations; 100 ms wall time for math; 250 ms for JavaScript; 500 ms for Python; one concurrent evaluation per object; 8 MiB worker memory target; 1 MiB persistence file target. These are proposals and require measurement on each target device. Use monotonic clocks, bounded queues, and a worker kill on deadline. Never rely on UI disabling alone.

## Frontend implementation notes for e-ink

- Render the answer with a stable black-on-white text layout. Only show the border, handles, and `fx` badge when selected or when the user has entered edit mode.
- Keep the badge at least the platform's reliable touch target size, but visually small. Give it a rectangular hit region larger than its glyph.
- Use pointer press/move/release state and a movement threshold. Do not let the `TextEdit` consume page gestures while editing.
- On focus, request the virtual keyboard and select all source text only on an explicit first edit. On `Cancel`, restore the previous draft. On `Evaluate`, close the keyboard before committing the answer to reduce repaint conflicts. Relevant Qt references: [TextInput](https://doc.qt.io/qt-6/qml-qtquick-textinput.html), [TextEdit](https://doc.qt.io/qt-6/qml-qtquick-textedit.html), [input focus](https://doc.qt.io/qt-6/qtquick-input-focus.html).
- Use a single coordinate transform for device rotation, AppLoad scaling, and page coordinates. Test both full-screen and windowed AppLoad modes because the manifest explicitly supports scaling and window sizes. Source: [AppLoad README](https://github.com/asivery/rm-appload/blob/master/README.MD).

## Phased implementation

### Phase 0: compatibility spike

Build the AppLoad frontend-only example, load it in the PC emulator, then on a reMarkable 2 in Developer Mode. Confirm QML imports, screen dimensions, input focus, keyboard, scaling, windowed mode, writable application storage, and backend socket startup. **Acceptance:** a signed-off matrix records device OS, AppLoad release, XOVI version, Qt version, logical size, keyboard behavior, and storage path; no native notebook files are modified.

### Phase 1: math vertical slice

Implement one movable/resizable object, source editor, `fx` badge, math parser, answer-only display, JSON persistence, and undo. **Acceptance:** `356 / 135` evaluates to a stable answer; moving and resizing survives restart; source is hidden in normal view and recovered through `fx`; malformed input, divide by zero, NaN, overflow, and limits show bounded errors; undo restores every command.

### Phase 2: AppLoad backend protocol

Implement the socket client/server, request ids, revisions, load/save, cancellation, crash restart, atomic files, and migrations. **Acceptance:** delayed and out-of-order responses cannot overwrite newer objects; a killed backend restarts without losing the last committed source; corrupted primary storage recovers from backup; unknown protocol versions fail closed.

### Phase 3: JavaScript adapter

Add QuickJS or quickjs-ng in a separate worker with no host APIs and tested limits. **Acceptance:** arithmetic and pure functions work; filesystem, network, module, host-global, infinite-loop, deep-recursion, memory, and oversized-output tests fail safely; timeout kills and recreates the worker; the QML process remains responsive.

### Phase 4: Python decision gate

Measure a separately packaged worker on each supported device. **Acceptance:** ship Python only if process isolation, watchdog, resource limits, no-network/no-filesystem policy, and crash recovery are demonstrated by automated and manual tests. Otherwise keep the selector disabled with an explanation and retain the schema value for future migration.

### Phase 5: hardening and release

Package the manifest, icon, QML resources, backend, versioned schema, migration fixtures, and device notes. Run the AppLoad emulator and device matrix in full-screen and windowed modes. **Acceptance:** all tests pass, persistence survives forced power loss simulation, no evaluation blocks UI beyond the stated budget, and the release notes state exact supported AppLoad/XOVI/device versions.

## Test plan

- **Model:** schema validation, coordinate clamping, page transforms, revision checks, state transitions, command coalescing, undo/redo, migration fixtures.
- **Math:** grammar allow-list, precedence, unary operators, decimals, functions, divide-by-zero, non-finite values, depth/token/op/output limits, fuzzed malformed input.
- **JavaScript:** pure arithmetic, disabled globals, disabled imports, infinite loop, recursion, allocation pressure, promise/job exhaustion, timeout, worker restart, protocol framing.
- **Python gate:** import/file/network/environment probes, subprocess attempt, infinite loop, memory pressure, timeout, crash, and restart. The expected result is rejection or unavailable status unless the isolation design passes.
- **Protocol:** fragmented messages, multiple messages in one read, malformed JSON, oversized frame, duplicate request id, stale revision, backend disconnect, cancellation, and shutdown.
- **QML/device:** create, select, drag, resize, badge hitbox, editor focus, keyboard, evaluate, cancel, error display, rotation, scaling, windowed mode, sleep/wake, low battery, restart, and forced power interruption.
- **Acceptance evidence:** capture screenshots or a test log for the normal answer-only state, source reveal/edit state, error state, restart recovery, and both supported device classes. Do not claim native notebook integration; this proposal is a standalone AppLoad application.

## Primary-source index

- [AppLoad README](https://github.com/asivery/rm-appload/blob/master/README.MD)
- [AppLoad repository](https://github.com/asivery/rm-appload)
- [AppLoad releases](https://github.com/asivery/rm-appload/releases)
- [AppLoad examples](https://github.com/asivery/rm-appload/tree/master/examples)
- [AppLoad backend clients](https://github.com/asivery/rm-appload/tree/master/backends/appload-clients)
- [AppLoad protocol.h](https://github.com/asivery/rm-appload/blob/master/src/protocol.h)
- [AppLoad management.cpp](https://github.com/asivery/rm-appload/blob/master/src/management.cpp)
- [AppLoad v0.6.0](https://github.com/asivery/rm-appload/releases/tag/v0.6.0)
- [AppLoad device shim](https://github.com/asivery/rm-appload/blob/master/shim/src/shim.cpp)
- [reMarkable developer portal](https://developer.remarkable.com/)
- [reMarkable Developer Mode](https://developer.remarkable.com/documentation/developer-mode)
- [Qt TextInput](https://doc.qt.io/qt-6/qml-qtquick-textinput.html)
- [Qt TextEdit](https://doc.qt.io/qt-6/qml-qtquick-textedit.html)
- [Qt MouseArea](https://doc.qt.io/qt-6/qml-qtquick-mousearea.html)
- [Qt DragHandler](https://doc.qt.io/qt-6/qml-qtquick-draghandler.html)
- [Qt PinchHandler](https://doc.qt.io/qt-6/qml-qtquick-pinchhandler.html)
- [Qt input focus](https://doc.qt.io/qt-6/qtquick-input-focus.html)
- [Qt input method](https://doc.qt.io/qt-6/qml-qtquick-inputmethod.html)
- [rmgraph Notebook.h](https://github.com/tatjam/rmgraph/blob/master/src/widgets/Notebook.h)
- [rmgraph Notebook.cpp](https://github.com/tatjam/rmgraph/blob/master/src/widgets/Notebook.cpp)
- [rmgraph MathExpression.cpp](https://github.com/tatjam/rmgraph/blob/master/src/math/MathExpression.cpp)
- [QuickJS documentation](https://github.com/bellard/quickjs/blob/master/doc/quickjs.html)
- [QuickJS source](https://github.com/bellard/quickjs/tree/master)
- [quickjs-ng repository](https://github.com/quickjs-ng/quickjs)
- [Python `eval`](https://docs.python.org/3/library/functions.html#eval)
- [Python `exec`](https://docs.python.org/3/library/functions.html#exec)
- [Python `subprocess`](https://docs.python.org/3/library/subprocess.html)
- [Python `multiprocessing`](https://docs.python.org/3/library/multiprocessing.html)

### Restricted expression evaluator comparison

- **Verified:** CEL is specified as memory-safe, side-effect-free, terminating, strongly typed, and dynamically/gradually typed. Its host explicitly supplies variables and functions; parse and type-check happen before evaluation. CEL implementations can disable macros and apply bounded grammar limits. Sources: [CEL language definition](https://github.com/google/cel-spec/blob/master/doc/langdef.md), [cel-go README](https://github.com/google/cel-go/blob/master/README.md).
- **Proposal:** CEL is a strong alternative if the product later needs policy-like expressions rather than arithmetic syntax. For this UX, use the dedicated math AST first because it gives clearer calculator syntax and smaller device footprint. If CEL is adopted, expose only pure host functions, disable I/O and mutation, cap source/AST depth, and evaluate against an immutable activation. Do not expose CEL as a replacement for JavaScript or Python when users expect those languages.


## Implementation decision

This decision supersedes the earlier JSON-file and in-process evaluator proposals. The verified platform facts remain valid.

### Supported baseline

- Build a standalone AppLoad application. Do not patch native notebook data or Xochitl internals.
- Pin the package to a tested platform matrix. The current Vellum package publishes AppLoad 0.6.0 for `aarch64` and `armv7`, but restricts installation to reMarkable OS `>=3.28,<3.29`. This is a narrow compatibility window, not a general device guarantee. Source: [Vellum AppLoad package](https://github.com/vellum-dev/vellum/blob/main/packages/appload/VELBUILD).
- Build the Rust backend for `aarch64-unknown-linux-gnu` and `armv7-unknown-linux-gnueabihf`. These are the targets in the AppLoad examples. Sources: [Paper Pro build example](https://github.com/asivery/rm-appload/blob/master/examples/appload/full/build-rmpp.sh), [rM1/rM2 build example](https://github.com/asivery/rm-appload/blob/master/examples/appload/full/build-rm.sh).
- Use the matching official reMarkable SDK for each product and OS release. reMarkable states that SDKs are product-specific and that the OS version matters. Source: [reMarkable SDK](https://developer.remarkable.com/documentation/sdk).

Use this initial manifest:

```json
{
  "id": "computed-text",
  "name": "Computed Text",
  "loadsBackend": true,
  "entry": "/ui/Main.qml",
  "canHaveMultipleFrontends": false,
  "supportsScaling": true
}
```

One frontend avoids concurrent document edits. The QML root must provide the AppLoad `close` signal and `unloading()` function. `unloading()` should request shutdown and call `terminate()` because this app has no background work. Each committed mutation must already be durable before the backend acknowledges it.

### Component boundaries

```text
QML frontend
  -> versioned JSON request
AppLoad SOCK_SEQPACKET transport
  -> DocumentSession
     -> SQLite Store
     -> MathEvaluator
     -> optional WorkerSupervisor
        -> QuickJS worker
        -> Python worker, gated off by default
```

- **QML frontend:** Owns drawing, selection, local drag previews, resize previews, the source editor, and e-ink redraw policy. It is not the source of truth.
- **DocumentSession:** Owns object invariants, revisions, commands, undo/redo, persistence order, and stale-result checks. This is the main deep module.
- **SQLite Store:** Owns schema migration and transactions. Do not expose SQL details to QML.
- **EvaluationEngine:** Uses one interface, `evaluate(runtime, source, limits) -> EvalResult`. Math is local. JavaScript and Python use worker processes.
- **WorkerSupervisor:** Applies process limits, starts one evaluation, collects one bounded result, kills the worker on timeout or protocol failure, and never weakens isolation as a fallback.

Do not use full event sourcing. Store current state plus a bounded command log for undo. This is simpler and still gives crash-safe undo.

### Drawing and answer-only interaction

1. The user enters **Create** mode. This avoids conflict between drawing a new box and moving an existing box.
2. A press-drag-release gesture creates a rectangular outline in logical canvas coordinates. A tap creates a default-size rectangle. Reject boxes below the minimum size.
3. The source editor opens. Math is the default runtime. Phase 1 supplies a math keypad; physical keyboard input also goes to `TextEdit`. Do not depend on Qt Virtual Keyboard until the target image is tested.
4. **Save and evaluate** sends the rectangle, runtime, and source in one command. The backend persists the source before evaluation starts.
5. Normal rendering contains only the result, selection border, status mark, and `fx` control. The frontend snapshot does not contain source text.
6. The `fx` control sends `card.source.get`. The backend returns the source only for that editor request. Clear the temporary QML source buffer when the editor closes.
7. A `DragHandler` on the card body moves the card. A separate lower-right handle resizes it. The `fx` hit region is outside both handlers. Commit one geometry command on release; never write each pointer move.
8. Render evaluator output with `Text.PlainText`. Qt warns that automatic rich-text detection can load remote images from user-controlled text. Source: [Qt Text](https://doc.qt.io/qt-6/qml-qtquick-text.html).
9. Avoid transitions and continuous animation. During a gesture, draw one high-contrast outline. Commit and redraw the card on release.

Use a fixed logical page, for example width `10000` units and a height derived from the page aspect ratio at creation. Store integer coordinates. Map the page to the current AppLoad window with one uniform transform and letterboxing. This avoids pixel drift and preserves layout across screen sizes.

### Persistent model

The backend stores full cards. The frontend receives `CardView`, which omits `source`.

```text
Document
  id, title, canvas_width, canvas_height, revision, timestamps

Card
  id, document_id, z, x, y, width, height
  runtime
  source, source_revision
  status
  result_kind, result_text, engine_version
  evaluated_source_revision
  error_code, error_message
  revision, timestamps

CardView
  id, z, rect, runtime, status
  result_kind, result_text, error_code
  source_revision, evaluated_source_revision, revision
```

Card states are `draft`, `evaluating`, `ready`, `error`, and `stale`.

- Editing source increments `source_revision` and sets `evaluating` after the source commit.
- A result is accepted only when its `source_revision` still matches.
- Move and resize increment `revision` but do not evaluate.
- Startup changes orphaned `evaluating` rows to `stale`. It does not discard their source.
- Store the evaluator version with the result. Do not silently recompute stored results after an engine upgrade.

### SQLite persistence

Use `rusqlite` with its `bundled` feature so the application does not depend on the tablet's SQLite ABI. The rusqlite project recommends this for applications that own their database. Source: [rusqlite](https://github.com/rusqlite/rusqlite).

Store the database under `/home/root/.local/share/computed-text/state.sqlite3`, subject to the Phase 0 write-and-restart test. Use directory mode `0700` and file mode `0600`.

Use the default rollback journal with `synchronous=FULL`. There is one backend writer and no QML database reader, so WAL concurrency is not needed. SQLite documents atomic commits after crashes and power loss in rollback mode. Sources: [SQLite atomic commit](https://www.sqlite.org/atomiccommit.html), [SQLite WAL trade-offs](https://www.sqlite.org/wal.html).

A transaction contains the state change, document revision, and undo record. Recommended tables are:

```sql
CREATE TABLE documents (...);
CREATE TABLE cards (...);
CREATE TABLE commands (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  document_revision INTEGER NOT NULL,
  kind TEXT NOT NULL,
  forward_json TEXT NOT NULL,
  inverse_json TEXT NOT NULL,
  state TEXT NOT NULL,
  created_ms INTEGER NOT NULL
);
```

Use `PRAGMA user_version` for schema migrations. Run each migration in one transaction. Keep the newest 100 user commands per document. A new command after undo removes the redo branch. `EvaluateResult` is not a separate user command; undoing `EditSource` restores the prior source and prior result together.

### Application protocol

AppLoad already supplies a message type and UTF-8 string. Use two application types:

- `1`: request
- `101`: response or event

The string is a JSON envelope with `protocol`, `requestId`, `method`, and `baseRevision`.

```json
{
  "protocol": 1,
  "requestId": "42",
  "method": "card.move",
  "baseRevision": 19,
  "params": {"cardId": "uuid", "rect": {"x": 100, "y": 200, "w": 900, "h": 300}}
}
```

Mutating methods are `card.create`, `card.move`, `card.resize`, `card.source.save`, `card.delete`, `history.undo`, and `history.redo`. Read methods are `session.open` and `card.source.get`.

The backend rejects unknown protocol versions, unknown fields where ambiguity is unsafe, messages over 64 KiB, stale `baseRevision`, duplicate conflicting request IDs, invalid rectangles, invalid runtime names, and source above the selected engine limit. A stale write returns the current document revision and a fresh source-free snapshot.

AppLoad's Rust client uses `AF_UNIX`/`SOCK_SEQPACKET`, an eight-byte type/length header, and a 10 MiB maximum package buffer. Source: [AppLoad Rust backend client](https://github.com/asivery/rm-appload/blob/master/backends/appload-clients/rust-backend/src/lib.rs). Keep evaluation handling serial in Phase 1. This avoids concurrent calls to the client's two-send response path.

### Restricted math evaluator

Use `fasteval` for the first implementation, with an additional lexical allow-list. Its default protections cap expressions at 4 KiB, nesting at 32 levels, values at 64, and subexpressions at 64. It has no dependencies and an MIT license. It also includes built-ins such as `print`, so its parser limits alone are not the product policy. Source: [fasteval](https://github.com/likebike/fasteval).

Before parsing, accept only:

- decimal and scientific numeric literals;
- parentheses and comma;
- `+ - * / % ^`;
- fixed identifiers such as `pi`, `e`, `abs`, `sqrt`, `min`, `max`, `sin`, `cos`, `tan`, `ln`, and `log`.

Reject strings, assignment, statement separators, comments, comparisons, Boolean operators, unknown identifiers, and `print`. Use `EmptyNamespace`; do not register custom callbacks. Reject divide-by-zero, `NaN`, and infinity. Return structured errors such as `SYNTAX`, `LIMIT`, `UNKNOWN_SYMBOL`, `DIVIDE_BY_ZERO`, `DOMAIN`, and `NON_FINITE`.

Format finite `f64` output with one documented rule. Recommended: integer form for exact integers; otherwise at most 12 significant decimal digits; normalize negative zero to zero. Keep the full numeric value in the result record if later formatting must change.

### JavaScript worker

QuickJS supports separate runtimes and contexts, runtime memory limits, maximum stack size, and an interrupt handler for execution deadlines. Source: [QuickJS-NG C API](https://quickjs-ng.github.io/quickjs/developer-guide/intro/).

Run one fresh worker process per evaluation. Inside it:

- create a fresh runtime and context;
- do not link or install `std` or `os` modules;
- expose no filesystem, network, process, clock, random, or native host callbacks;
- set QuickJS memory and stack limits;
- use `JS_SetInterruptHandler()` for a monotonic deadline;
- accept only scalar results: number, string, Boolean, or null;
- cap source and encoded result size;
- destroy the runtime and exit after one response.

QuickJS limits contain ordinary script resource use. They do not contain a native engine flaw. Keep the worker outside the AppLoad backend and add OS isolation.

### OS isolation and Python gate

For JavaScript and Python workers, the supervisor should apply all controls that the target kernel proves available:

- dedicated unprivileged UID and GID;
- closed inherited file descriptors except input, output, and error pipes;
- empty environment and fixed working directory;
- `RLIMIT_AS`, `RLIMIT_CPU`, `RLIMIT_FSIZE`, `RLIMIT_NOFILE`, `RLIMIT_NPROC`, `RLIMIT_STACK`, and zero core size;
- `PR_SET_NO_NEW_PRIVS`;
- seccomp-BPF syscall allow-list, not a deny-list;
- new network and mount namespaces where available;
- parent wall-clock watchdog followed by `SIGKILL`;
- bounded request and response pipes.

Linux documents the resource limits and recommends seccomp allow-lists. It also states that `chroot()` is not a security sandbox. Sources: [getrlimit(2)](https://man7.org/linux/man-pages/man2/getrlimit.2.html), [seccomp(2)](https://man7.org/linux/man-pages/man2/seccomp.2.html), [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html), [chroot(2)](https://man7.org/linux/man-pages/man2/chroot.2.html).

Python remains disabled by default. CPython `-I` removes the current directory, user site packages, and `PYTHON*` environment variables, but it is not a sandbox. Python states that audit hooks are not suitable for a sandbox. Sources: [Python isolated mode](https://docs.python.org/3/using/cmdline.html#cmdoption-I), [Python audit hooks](https://docs.python.org/3/library/sys.html#sys.addaudithook).

If Python is added, use a separate native worker that initializes a minimal CPython runtime, removes dangerous extension modules, installs the OS policy before user code runs, evaluates one request, and exits. The Python selector must remain unavailable when seccomp, privilege drop, process limits, or network/filesystem isolation cannot be proved. Never fall back to `eval` with restricted built-ins.

Initial limits are test values, not platform facts: math source 4 KiB; code source 16 KiB; scalar output 1 KiB; JavaScript wall time 250 ms; Python wall time 500 ms; worker address space 64 MiB. Tune them on each device, then publish the tested values.

### Delivery plan

1. **Compatibility spike:** PC emulator plus one real target. Prove QML imports, create/move/resize gestures, finger-versus-pen behavior, keyboard behavior, scaling, backend round-trip, SQLite persistence, clean unload, and worker-kernel features.
2. **Math vertical slice:** One canvas. Create, move, resize, delete, source save, answer-only rendering, `fx` reveal, math limits, crash recovery, and undo/redo.
3. **Packaging and device matrix:** Build both architectures with matching SDKs. Publish exact OS, XOVI, AppLoad, Qt, device, keyboard, and sandbox capability results.
4. **JavaScript:** Add the fresh QuickJS worker only after every isolation test passes.
5. **Python decision:** Ship only if the stronger worker gate passes. Otherwise keep it disabled and document why.

### Acceptance checks

The math release is complete only when all checks pass in the emulator and on the target device:

- Create a box, enter `356 / 135`, and see only the documented formatted answer.
- Close and reopen the application. The answer, source, size, and position are unchanged.
- Tap `fx` and get the exact stored source. Cancel makes no persistent change.
- Move and resize a card. Neither action causes evaluation.
- Edit source and evaluate. Undo restores the old source and its matching result. Redo restores the new pair.
- Malformed input, divide by zero, deep input, oversized input, `NaN`, and infinity produce bounded errors without terminating QML or the backend.
- Kill the backend during a source update. Reopen to either the complete old transaction or complete new transaction, never a mixed card.
- Unload the app. No backend remains.
- Send a stale revision and malformed or oversized JSON. The backend rejects it and returns a source-free snapshot.
- Exercise create, drag, resize, `fx`, editor focus, keyboard, rotation, scaling, sleep/wake, and error states on the e-ink display.

JavaScript adds mandatory tests for infinite loops, recursion, allocation pressure, unavailable modules, file and socket attempts, oversized output, worker crash, timeout, and restart. Python adds mandatory rejection tests for `open`, `import os`, sockets, subprocesses, `ctypes`, infinite loops, and allocation pressure. If an isolation feature is absent, the correct result is `ENGINE_UNAVAILABLE`.
