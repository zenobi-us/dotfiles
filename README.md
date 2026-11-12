# My Dotfiles

Cross-platform configuration for:

- Zsh on Linux and macOS
- PowerShell on Windows
- Development tools managed by mise

## Getting started

Setup has two steps:

1. Install mise.
2. Bootstrap this repository.

## Install mise

### Linux and macOS

Run:

```bash
curl https://mise.run | sh
```

Open a new shell, then verify the installation:

```bash
mise --version
```

### Windows

Open PowerShell as an administrator. Enable the required Windows features:

```powershell
Enable-WindowsOptionalFeature `
  -Online `
  -FeatureName Microsoft-Windows-Subsystem-Linux,VirtualMachinePlatform `
  -All `
  -NoRestart
```

Restart Windows. Then open PowerShell and install mise:

```powershell
winget install --exact --id mise.run
```

Open a new PowerShell window, then verify the installation:

```powershell
mise --version
```

## Bootstrap the dotfiles

The first bootstrap clones this repository to a stable local path. It then applies the platform-specific packages, tools, and dotfiles.

### Linux and macOS

Run:

```bash
mise bootstrap \
  --from https://github.com/zenobi-us/dotfiles.git \
  --from-dir "$HOME/.local/share/dotfiles" \
  --yes
```

Open a new Zsh process after bootstrap changes the shell files:

```bash
exec zsh
```

The managed `.zshenv` sets `MISE_GLOBAL_CONFIG_ROOT` to the repository root. Future bootstrap runs do not need `--from` or `--from-dir`:

```bash
mise bootstrap --yes
```

### Windows

Run in PowerShell:

```powershell
mise bootstrap `
  --from https://github.com/zenobi-us/dotfiles.git `
  --from-dir "$HOME/.local/share/dotfiles" `
  --yes
```

Set the repository as the persistent mise global config root:

```powershell
[Environment]::SetEnvironmentVariable(
  "MISE_GLOBAL_CONFIG_ROOT",
  "$HOME/.local/share/dotfiles",
  "User"
)
```

Open a new PowerShell window. Future bootstrap runs do not need `--from` or `--from-dir`:

```powershell
mise bootstrap --yes
```

## Common commands

The pre-commit hook automatically bumps bundle versions for staged bundle changes and stages the plugin manifests and marketplace record in the same commit. `hk fix` also stages its version fixes. Neither operation stashes local changes. Review unstaged edits in those version files before committing, because automatic staging can include them. Stashes from earlier interrupted hook runs remain untouched.

If hk reports an interrupted stash recovery, compare each unresolved file with the preserved stash before you restore it. Do not apply the whole stash after hk has restored other files. Archive `.git/hk-pending-stash` only after you verify recovery. When replacing Lefthook with hk, remove obsolete Lefthook hooks from `.git/hooks/` as well.

Apply the full machine setup:

```bash
mise bootstrap --yes
```

Apply selected bootstrap parts, or refresh only the OMP agent setup:

```bash
mise bootstrap --only dotfiles --yes
mise bootstrap --only tools --yes
mise bootstrap --only task --yes
mise run bootstrap-agent
```

Inspect state without changing the machine:

```bash
mise bootstrap status
mise bootstrap status --missing
mise bootstrap --dry-run
mise bootstrap plan
```

## View Markdown locally

Run `markdown-view` directly; its mise shebang starts Bun and installs pinned npm packages on first use:

```bash
markdown-view ./path/to/file.md
markdown-view ./path/to/file.md --port 4000
```

The command prints a loopback URL. Refresh the browser to render edits to the file. YAML frontmatter configures markdown-it options and plugins:

```yaml
---
markdown:
  options:
    breaks: true
  plugins:
    markdown-it-anchor@9.2.0:
      tabIndex: false
---
```

Plugin keys use exact npm versions, and plugins must default-export a markdown-it function. Frontmatter plugins execute with your user permissions: only view files you trust. Local image assets are served from the file's directory and its subdirectories; other assets and hidden paths are not served.

## Debug bootstrap configuration

Show the mise version:

```bash
mise --version
```

Show the active config files:

```bash
mise config ls
```

Show the combined bootstrap plan:

```bash
mise bootstrap plan
```

The repository stores its modules directly under `.mise/conf.d/`. Each direct child is a real directory, not a symlink to a separate `files/` tree. Module names use `<category>-<module>`, such as `devtools-agent`, `shells-zsh`, and `assets-fonts`; `secrets` keeps its existing name.

Each module contains its platform-specific `mise.<env>.toml` files and the files referenced by those configurations. Keep module-local source paths relative to the module, and refer to another module by its flattened directory name.

After updating a checkout from the old layout, refresh deployed symlinks without reinstalling tools:

```bash
mise bootstrap --only dotfiles --yes
```
## OMP shared-context autocomplete
The mise bootstrap links `.mise/conf.d/devtools-omp/extensions` to `~/.omp/agent/extensions`. In OMP, type `#` to find files from the shared context associated with the current repository. Select an item to insert it as an `@` attachment. OMP keeps its built-in `@` file autocomplete.

## OMP image editor

Run `/reload` after updating the extension. Use these commands in interactive
OMP sessions:

| Command | Action |
| --- | --- |
| `/image new [prompt]` | Open a blank drawing canvas. |
| `/image annotate "path/to/image.png" [prompt]` | Annotate a PNG, JPEG, WebP, or GIF file. |
| `/image annotate` | Annotate the latest image attached in the current session. |

You can also ask the agent to open a canvas or let you annotate a screenshot.
The `image_editor` tool accepts `action: new` or `action: annotate`, plus an
optional file `path`. Without a path, annotation uses the latest user attachment.
Attachment selection resets when you switch or branch sessions.

Draw in the browser, then click **Done** to return a PNG. The tool returns the
image directly to the agent. Slash commands submit the image and optional
prompt as a user message. **Cancel** returns no image. This editor supports
manual drawing; it does not generate images from prompts.

The `annotate:` prefix still opens an attached image directly without an agent
turn. The old annotation slash command has been replaced by `/image`.

### Tablet bootstrap

Run `/annotate add-device` to start one persistent service for the desktop user.
Pitchfork supervises it after OMP exits. Directory changes do not start or stop it.
Concurrent extension instances share the service. Readiness or identity failures
produce an error, not successful setup instructions. Browser editing stays unchanged.

#### Build prerequisites

Install only the pinned tools for this extension, then build the package:

```sh
cd mise/conf.d/devtools-omp/extensions/image-annotator
mise install bun@1.4.3 go@1.25.0 pitchfork@2.30.1 pipx:pyside6-essentials@6.8.3
MISE_AUTO_INSTALL=0 mise exec -- bun install --frozen-lockfile
MISE_AUTO_INSTALL=0 mise exec -- bun run build
```

The build also requires host OpenSSL, Info-ZIP 3.0, `tar`, `touch`, and
`sha256sum`. Qt 6.8.3 supplies the pinned resource compiler. Setup never
installs unrelated mise tools. `bun run provision:tablet` prints the same
trusted command without connecting to a tablet. Its `--dry-run` checks local
package inputs without starting the service.

#### Trust and installation

Paper Pro Developer Mode is required. Enabling it performs a factory reset and
weakens secure-boot protections. Back up documents first. Neither setup nor the
installer enables Developer Mode, changes firmware, or opens firewall ports.
Obtain separate owner approval before a tablet connection or installation.

The LAN page at `http://<desktop>:47840/setup` explains prerequisites.
It is not a trust anchor. Obtain the generated SSH command from trusted
extension output or `http://127.0.0.1:47840/setup`. Check the tablet SSH host
key independently. Use cable-connected SSH only for installation and repair.
The tablet also needs LAN access to the desktop for installation downloads.

The command checks independently supplied SHA-256 digests for the installer,
client ZIP, and server trust record before execution or extraction. It provisions
the stable server ID and certificate fingerprint. Runtime connections verify the
provisioned CA, hostname, server ID, and protocol. No certificate check is disabled.
The LAN surface exposes no pairing approval, revocation, or other management writes.

The installer reads `IMG_VERSION` from `/etc/os-release`, not `VERSION_ID`.
Missing or unsupported `IMG_VERSION` fails before the stock-binary check or installation changes.
Only Paper Pro firmware `3.28.0.172` and its recorded Xochitl binary hash pass
preflight. This firmware has prior prototype evidence; the new AppLoad integration
still needs hardware acceptance. The installer checks ARM64, model, firmware,
root permissions, writable home storage, XOVI, AppLoad, and qt-resource-rebuilder before
changes. The native libraries `xovi/xovi.so`, `xovi/extensions.d/appload.so`, and
`xovi/extensions.d/qt-resource-rebuilder.so` under `/home/root` must be regular files.
If one is missing or is not a regular file, repair and verify that dependency
separately before retrying. Rejection occurs before archive extraction or installation.
The installer does not install those firmware-sensitive dependencies automatically.
Their installed versions and compatibility must be recorded during approved preflight.

Host preflight regressions: run `bun test test/production-install.test.ts` in the
image-annotator extension directory. It requires Linux Bubblewrap (`bwrap`) and
unprivileged user namespaces, plus `zip` and `unzip`. Tests run the real installer
with temporary metadata, a read-only host filesystem, and no network. Firmware
cases stop at the stock-binary guard. Native dependency cases use real ZIP and
trust-record digest checks, reject absent or non-regular libraries before extraction,
and use a bounded client sentinel to prove continuation when both libraries exist.
The sentinel does not prove native ARM64 installation.
After any installer edit, discard old trusted instructions and generate new
instructions with the current installer SHA-256.

Client configuration, pairing records, drafts, and immutable releases use
`/home/root/.local/share/pi-ink-bridge`. One named AppLoad link and one named
QMD link install Pi Annotations without duplicating entries. Repeating the same
verified release preserves existing data. Occupied or changed launcher paths,
changed server trust, and different release upgrades require explicit repair;
the installer does not overwrite them. Unrelated extensions and earlier prototype
installations remain untouched.

#### Activation and connection state

Installation never restarts Xochitl or reboots the tablet. Save and close all
documents. Obtain separate owner approval for one restart. After that restart,
select **Pi Annotations** in the sidebar. The thin QMD launcher opens the AppLoad
connection screen. It reports a verified available server separately from pairing.
It reports offline or identity/protocol errors without claiming readiness.
The stock editor remains responsible for drawing. Pairing and job actions belong
to later tickets, not this installation screen.

The AppLoad backend consumes two SOCK_SEQPACKET records per message: an
8-byte header and a body record, including an empty body. It rejects truncated
records and mismatched lengths. Host regressions use real Unix packets; a
compiled host CLI smoke verifies repeated empty polls against synthetic TLS.
This host proof does not establish native launch acceptance. Deploying the
rebuilt payload and repeating native checks require separate owner approval.

Real post-restart launch, dependency compatibility, unsupported-firmware rejection,
and repeat installation on the tablet remain required device acceptance checks.
Host protocol checks and the Qt host emulator do not prove device readiness.

#### Service storage and repair

The service stores identity, TLS files, and content-addressed runtime snapshots in
`$XDG_DATA_HOME/pi-ink-bridge` (default `~/.local/share/pi-ink-bridge`).
Use `pitchfork status pi-ink-bridge` and `pitchfork logs pi-ink-bridge` to
inspect it. Setup never force-restarts an incompatible service or rotates trust.
The default ports are HTTP `47840` and HTTPS `47841`. If another application
occupies them, configure distinct `PI_INK_SETUP_PORT` and `PI_INK_TLS_PORT`
values consistently before starting OMP. An old protocol-1 coordinator requires
an explicit operator-managed shutdown or different ports; setup leaves it alone.
Address changes outside the saved certificate SANs fail verification and require
an explicit certificate repair. Existing credentials and drafts must be preserved.

The earlier tar installer, coordinator protocol, and development update commands
remain prototype tools. They are not the production installation or trust path.
Production setup no longer starts the old extension-owned Avahi registration.
Discovery and pairing are separate tickets.

### Manual stock-PDF review

For an image annotation request, select **Import stock PDF** in the browser.
Download the request source PDF, annotate it with the stock editor, and select
the full annotated PDF export. This manual import is not tablet pairing,
current-document detection, an editor toolbar, or authenticated tablet LAN transfer.

The server accepts one opaque source image at its original PDF position and
scale. It checks decoded image samples against this request. It rejects unknown
transforms, rotation, multiple pages, extra images, masks, and differing page boxes.
The renderer checks transparent full-page pixels across all colors and alpha.
Conservative paint bounds require confirmation when subpixel marks are uncertain.
Expanded whitespace alone does not require confirmation.

If outer marks exist or their bounds are uncertain, no image is delivered until
you select **Clip this PDF and send PNG**. This consent applies only to the
reviewed request, source digest, export digest, and one-use nonce. Replacing the
PDF, returning to browser drawing, cancellation, or changing the OMP session
invalidates consent. The PNG uses the original source window and dimensions;
it does not stretch the expanded page. Ordinary browser PNG export is unchanged.

The server retains the full original PDF and analysis under
`~/.local/share/omp/image-annotator/<request-id>/<revision>-<export-sha256>/`.
The completion screen and tool result report the PDF path. Files remain available
on the server after the request closes. They contain private document data;
remove them manually when they are no longer needed. No automatic deletion occurs.

PDF mode requires `uv` and Python 3.11 or later. Provision its pinned dependencies
before offline use:

```sh
uv sync --script mise/conf.d/devtools-omp/extensions/image-annotator/pdf-worker.py
```

Runtime uses `uv run --offline` with `pymupdf==1.26.7`, `pypdf==6.21.4`, and `Pillow==13.0.0`.
Missing dependencies or rejected geometry produce an explicit error, not a PNG.
Rendering does not execute PDF scripts, follow links, or fetch remote resources.
The server bounds PDF processing to 60 seconds and 40 million page pixels.

### Temporary stock-editor tablet prototype

The prototype source is in
`mise/conf.d/devtools-omp/extensions/image-annotator/`. It uses the normal tablet
library and editor. It does not capture or render pen strokes. The browser
workflow remains available. Blank canvases still use the browser.

Set `OMP_IMAGE_ANNOTATOR_TABLET_CONFIG` to a trusted desktop pairing JSON file
before starting OMP with this checkout's extension. Each source annotation then
registers its own stable request/job ID with the configured HTTPS listener.
The listener sends jobs and status through authenticated WebSocket connections.
The tablet downloads source PDFs and uploads results through authenticated HTTPS.
Certificate and hostname verification remain enabled. Setup provisions the server
identity, HTTPS origin, CA certificate and approved device ID. App pairing creates
the content credential only after local desktop approval. Never put tokens in
URLs, logs, or committed files.

| Desktop pairing field | Meaning                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `serverId`, `name`    | Stable opaque server identity and separate display name.                                               |
| `address`, `port`     | Desktop HTTPS bind address and port.                                                                   |
| `certificate`, `key`  | Absolute paths to the TLS certificate and private key.                                                 |
| `deviceId`            | Device identity provisioned during trusted setup.                                                      |
| `managementToken`     | Separate random desktop approval credential of at least 32 characters. Keep it desktop-only.           |
| `token`               | Content credential persisted after approval. Omit it before new app pairing.                           |
| `statusPath`          | Optional local JSONL path for kernel-network experiment evidence.                                      |
| `diagnosticsPath`     | Optional private diagnostic JSONL path. Defaults to the pairing config path plus `.diagnostics.jsonl`. |


The single Go client is in `tablet-client/`. Run `pi-ink-client serve --config
/path/to/runtime.json` for the stock-editor runtime. Its mode-0600 configuration
requires `deviceId`, absolute `statePath`, `uiAddress: "127.0.0.1:9821"`, and a
`servers` array. Each server entry has `serverId`, `name`, an HTTPS `origin`, and
a setup-provisioned `ca` certificate path. Omit `token` for new app pairing.
The client persists each generated credential in its private association state.
`syntheticAllowlist` contains SHA-256 digests of owner-approved source PDF bytes.
This prototype refuses other imports.

Select **Pair with this setup-trusted server** in the tablet manager. Compare its
approval ID and device ID with `GET /tablet/v1/management/pair` on the desktop
HTTPS listener. Approve only that ID with `POST /tablet/v1/management/pair` and
JSON `{"pairingId": "<displayed ID>"}`. All management requests require
`Authorization: Bearer <managementToken>` and a loopback peer. Use the provisioned
CA for verification. Browser origins, stale IDs and content credentials cannot
approve or reject pairing. To dismiss an unwanted request without ending the
annotation, send POST /tablet/v1/management/pair/reject with the same JSON
pairingId and management authorization. Rejection clears only that pending ID;
it grants no content access. Start pairing again from the tablet manager.
Content and status remain unavailable until approval.
The listener exists while an image annotation request is pending.

The same executable retains `discover`, `select`, `status`, `download-bundle`,
`update`, and `version`. `/image coordinator` shows the public bootstrap endpoint
and stable coordinator ID. DNS-SD and HTTP health select a bootstrap endpoint;
they do not establish publisher identity or content-server trust. HTTP serves
only health and bundle assets. Development updates remain unsigned and display
the existing warning. Verify a separately approved payload hash before activation.
An adjacent bundle checksum detects corruption, not a trusted publisher.

`tablet-qml/pi-ink-bridge.qmd` adds a native **Pi Ink** library-sidebar entry
and drawing-toolbar button. The library entry idempotently opens the pairing
manager; **Back** hides the complete manager. Its bounds follow actual sidebar
visibility, width, content header and status bar. The document entry sits directly
before TOC and opens a separate native compact foldout, not the manager. Native
close controls, toolbar layout fixes and existing extension patches remain intact.

One zero-size client in MainView serializes the actual DocumentView UUID and
keeps import receipt handling alive while the panel is closed. The panel mounts
inside the active native content pane and hides when locked or unavailable. Its
component loads from `/home/root/pi-ink-bridge-0049/tablet-qml/PiInkToolbar.qml`.
The Go API listens only on tablet loopback. No tablet LAN proxy or private-library
listing exists. Physical stock close/navigation checks with the panel open and
closed remain mandatory; offline Qt parsing does not prove hit-testing.

Native modules use explicit aliases, so Qt Controls cannot silently shadow stock
controls or vice versa. The native Button exposes `pressed` as a property. Its
`onPressedChanged` handler captures the UUID and confirmation ID only when
`pressed` becomes true; release never recaptures a switched document or result.
The native input boundary canonicalizes valid UUID case and one optional matched
outer brace pair before current-document publication, display and press capture.
Controlled native document and parent receipts use the same conversion. An
invalid nonempty parent is rejected, never relabelled Stock root. Strict current
identity and immutable confirmation checks remain unchanged.

Use the panel to import an assigned synthetic source. The client serializes
imports and waits for the panel to acknowledge its controlled nonce name before
calling the stock upload service. It requires a matching native
`Library.entryImported` receipt for the actual UUID and parent. Explicit HTTP
UUID fields must be valid and agree with each other and that native receipt.
An invalid or contradictory explicit UUID is an error, not an absent identity.
A bare HTTP UUID never proves a stock root destination. A filesystem directory
is not a stock folder. The manager can call native `Library.createCollection`
to create a stock folder and associate its returned UUID with an online server.
The native root-parent argument and physical library visibility still require
device acceptance. Imports use the stock service destination; creating an
associated folder does not automatically move an import there. The import
receipt records its observed parent. Use normal stock controls for movement.
A destination associated with another server is refused, not silently rebound.
Uncertain identities fail closed. Duplicate acknowledgements cannot replace a
stored document association.

The manager and drawing foldout show connection and submission state. Folder
ownership and observed import parents remain available in the manager. The drawing
foldout does not display the document UUID. An unassociated document has no
Send action. Saving or closing never completes a request. Explicit Send checks
the current UUID and originating job, obtains only that UUID's PDF through
`http://127.0.0.1:81/download/{UUID}/pdf`, and uses the existing desktop PDF gate.
A document switch aborts processing and advances the server submission epoch,
so a delayed old upload cannot create a new result. Cancellation remains terminal.
Clipping confirmation binds to the displayed immutable result and rechecks the
hardware safety gate. The full PDF and source-sized PNG retention rules above
also apply to tablet results.

The adapter source is in `tablet-adapter/`. Its firmware-specific Qt hooks affect
the whole Xochitl process: USB interface lookup, loopback address classification,
and port-80 listeners. It forces those listeners to IPv4 localhost:81 and does
not install the upstream LAN proxy. Existing `webserver-remote.so` conflicts with
it. Never replace or disable that extension without fresh owner approval and an
explicit restoration choice.

This is not a production installer or a lifecycle guarantee. Activation requires
an approved payload manifest, collision/hash checks, and saved/closed documents
before each approved Xochitl restart. Keep all existing extensions, QMDs, service
settings, cloud settings, and private notebooks unchanged. Normal operation must
use authenticated LAN transport with USB disconnected and no runtime SSH. The
client requires both tested Paper Pro UDC controllers to report `not attached`
or `powered`, no USB IPv4, and a loopback-only stock listener before import,
export, or confirmation.
Offline checks and host transport smoke do not pass tablet input quality, library
visibility, cable-free Send, lifecycle, or restoration acceptance. Production
tickets remain blocked until the canonical hardware acceptance criteria pass.

The tablet control API accepts JSON media-type parameters. Qt adds
`charset=UTF-8` when it sends JSON text. Requests still require the exact
loopback Host and no browser Origin. The Library manager first publishes an
empty document UUID, then loads `/state`. A rejected `/current` request
prevents the configured servers from appearing.

Charging-only USB power is supported when both controller observations are
`not attached` or `powered`. Configured, addressed, suspended, unknown or
unreadable controller states still fail closed. USB IPv4 addresses, a missing
private stock listener on IPv4 localhost:81, and exposed stock-service listeners
remain blocked. Record charging-only operation separately from a fully unplugged
run; a `powered` controller does not prove that the USB port is empty.

The native manager shows **Bridge version** from the running Go service’s
`GET /state` response. This is the same build value as `pi-ink-client version`,
not a QML version constant. The manager shows `unavailable` when it cannot read
the local bridge version.

### Import receipts and client diagnostics

The stock uploader sends the exact filename `pi-ink-<nonce>.pdf`. The native
receipt handler maps that filename to the controlled `pi-ink-<nonce>` token.
Ready and receipt acknowledgements use the token, not the filename. The handler
does not remove extensions from arbitrary library names. Unknown names do not
trigger parent lookup or document binding.

The client sends `type: "diagnostic"`, `schemaVersion: 1` JSON events through
the same authenticated WebSocket as hardware status. Events identify the device,
server, job, request and controlled import attempt. They include the client build
version, device timestamp, phase code, level, safe message and `droppedBefore`.
Import events cover start, source verification, stock upload, native receipt,
binding and failure. Native filename and UUID failures use explicit codes.
No content, arbitrary document titles, credentials, raw response bodies or
unknown dependency error strings enter this channel. Messages have a 512-byte
UTF-8 limit; diagnostic packets have a 4096-byte limit.

The coordinator validates the paired device/server and registered request before
appending an event. It adds its own `receivedAt` timestamp. The default private
JSONL file is `<desktop-pairing-config-path>.diagnostics.jsonl`; trusted setup
can set `diagnosticsPath` instead. Its parent directory must already exist and
be private. The writer refuses symlinks and nonregular files, sets mode 0600,
serializes appends and flushes queued appends on normal request shutdown. Logs
are append-only; retain or remove experiment logs through an approved cleanup.

The client queue holds at most 64 events per server. Overflow and failed socket
writes are counted on the next delivered diagnostic. The coordinator permits
at most 64 pending diagnostic appends; overload closes that socket with 1013.
This is best-effort reporting, not an acknowledged or durable replay protocol.
A successful socket write does not prove coordinator receipt. The local
`POST /diagnostic` route accepts only an active controlled import token and an
allowlisted native failure code. It derives routing from the active attempt
and deduplicates each native failure code within that attempt.

Deploy the updated coordinator receiver before the updated client. Existing
running OMP sessions do not hot-reload this code. Do not silently restart or
replace an originating request to activate diagnostics. No OpenTelemetry
collector, new tablet LAN listener or general log-ingestion API is required.

The native manager sorts synthetic import rows by stable server ID and job ID
before publishing each polled snapshot to the QML model. Go map iteration order
is not a row identity. A pure row-order change can replace a pressed Repeater
delegate and lose its click. Stable ordering keeps unchanged rows and their
controls intact across polls. Already-bound requests remain `pending` until
explicit Send, but no longer show an Import button. The import action also
refuses a row with a nonempty controlled import token; the Go immutable binding
guard remains in force.


### Ticket 01 tested build and retained installation

The tested tablet runs firmware `3.28.0.172` and Pi Ink client `0.3.1`. Exact native
module fingerprints and the successful read-only inventory are recorded in
`workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/ticket-01-closeout-0115/build-version-reconciliation.json`.
The hardware proof covers stock pen, palm, erase, Undo, zoom, orientation, charging-only
LAN operation, two isolated requests, real PNG return, real cancellation, sleep/wake,
and normal reboot followed by manual recovery. It does not qualify other firmware
or require a firmware upgrade. The canonical ticket and immutable review define closure.

The owner chose to retain the installed prototype and tripletap. This is not a
restored tablet baseline. After a normal stock boot, the tested tripletap route
starts the existing mods when the owner triple-presses; it does not start the Go
service or prove automatic OS-boot startup. The existing Pi Ink Go unit needs its
recorded separately approved manual activation. Preserve private credentials,
associations, notebooks, test PDFs, the original quarantined module and evidence.

Do not run the old full-restoration script: it can re-enable the original LAN
proxy. The owned-only future removal and recovery procedure is recorded in
`workflows/pi-ink-bridge-01-pen-prototype/artifacts/evidence/ticket-01-closeout-0115/retained-maintenance-removal-plan.json`.
Any device inspection, change or restart needs fresh, exact owner approval.
Production work in tickets 02–10 is not part of the ticket 01 prototype gate.


## Herdr-app CLI, Context, and Tracker

For mod creation and edits, use [creating-herdr-app-mods](mise/conf.d/devtools-agent/bundles/developer/skills/shells/creating-herdr-app-mods/SKILL.md).

The native panels add **Context** and **Tracker** beside **Files** and **Changes**.

Use `mise bootstrap --yes` for the full setup. To reapply declared dotfiles and prepare this app's fonts and runtime, run:

```sh
mise dot apply
mise run herdrapp.bootstrap
```

The declarations in `mise/conf.d/devtools-herdrapp/mise.toml` (Linux, macOS and Windows) copy frontend code and assets, link the CLI layout/preview/theme, and link the Bun request entrypoint and data module to this checkout. Frontend imports must stay inside one canonical mod directory: individual file symlinks fail Herdr's import checks. Copies keep each writable `mod.json` and generated editor file local. Copy deployment is additive; removing a source file does not delete its old installed copy.

Mise merges the managed JSON keys from `app/preferences/` and each source mod manifest. It preserves unrelated settings, mod settings, zoom, workspace data, sessions, and generated editor files. The managed Shared Context layout remains C2. For an existing copy-based installation, back up the managed files before the first apply; `--force` is needed when replacing regular layout/theme files with links. Do not force deployment over an unreviewed mod-directory symlink.

`herdrapp.bootstrap` downloads Roboto Mono and its licence from pinned URLs, verifies SHA-256 hashes, and writes `data/shared-context-runtime.json` inside the app home. Runtime metadata stays outside the mod source. Departure Mono is not managed. Scoped tasks honour `HERDR_APP_HOME`; native declarations target `~/.config/herdr-app`, so custom homes need matching target declarations.

Better Config is optional. Install its pinned revision separately:

```sh
mise run herdrapp.better-config
```

An existing Better Config installation stays unchanged. Each backend request starts a fresh Bun process, so backend edits need no service restart.

Deployment preserves the selected layout. `mise run herdrapp.activate` selects `cli` without redeploying files. After frontend edits, apply the dotfiles, switch to another existing layout and back, then inspect `herdr-app status` and a screenshot. Other personal layouts stay unchanged.

Open the panel settings button. In Better Config, select **Shared Context → Tracker layout**:

- **C — Bottom drawer:** Select a record to open its details below the tree. Expand covers the tree. Collapse restores the split. Close slides the drawer down. Press Escape to collapse, then close.
- **C2 — Two columns:** Show the same tree beside the record. Drag the divider to change pane widths. The panel has no fixed maximum width and keeps your chosen width when the mod reloads. If the panel is narrower than 600 pixels, use the drawer.

Record headers keep Type, ID, title and workflow actions above the scrolling reader. Same-hue badges distinguish the label and value by luminance. The compact band contains Store and Reference. Clicking Reference or **Copy reference** copies the full canonical value and briefly shows confirmation.

Workflow badges distinguish **next** (recommended action), **status** (readiness or outcome), and **current** (a validated active phase bound to the inspected source). If phase evidence is incomplete, keep the recorded work status visible instead of inferring fixing or reviewing. Badges and reasons reflect the latest tracker refresh.

The ticket header shows the recorded work status separately from workflow recommendations and validation. Invalid workflow history does not replace the recorded status. The file tree and its totals remain unchanged. Direct prerequisites live in the header. Prerequisite links open the prerequisite record. Header metadata scrolls internally when long content would otherwise consume the reader.

Use **Description** for the document, **Blocking lineage** for dependencies, and **Activity** for workflow events and receipts. A grouped workflow warning links to **View in Activity**. This action opens Activity with invalid receipts filtered. **All events** restores the full list. The Activity tab count always includes all events. Each shared validation cause appears once above the list. Expand an affected receipt to inspect its error, reference, body, and original fields. Validation rules and receipts remain unchanged. Each tab keeps its scroll position while the record stays selected. Use Left/Right, Home, and End when a detail tab has keyboard focus. A failed detail read shows **Retry read** without clearing the selected record.

Use **Description** for the document, **Blocking lineage** for its prerequisites, and **Activity** for workflow events and receipts. The separate Details tab is removed. Each tab keeps its scroll position while the record stays selected. Use Left/Right, Home, and End when a detail tab has keyboard focus. A failed detail read shows **Retry read** without clearing the selected record.

The tree paints one selection background per row. Disclosure and title controls stay transparent.

Disable **Drawer motion** to remove animation. Select **Refresh** after external tracker changes.

Context provides explicit repository or shared-store setup and read-only file previews. The tree omits `.git` and symbolic links. Text previews have a 400 KB limit. Refresh reloads every expanded folder, including nested folders. Settings reloads restore those expanded contents. Only the newest file-preview request can change the preview or its error, including repeated selections of the same path.

Tracker groups initiatives first, then other tickets, prototypes, research, planning, and records. Each item uses a title line and a dimmed ID/status line. Filters form a flush, square-edged strip below the tree, with vertical dividers matching the tree border. The panel-wide canonical-records legend footer is removed.

The compact tree in C and C2 nests each ticket’s prerequisites. Expand or collapse a ticket to browse its dependency path. Shared prerequisite arrows reveal the canonical path and open that record. Filtered queues retain prerequisites as context. Missing records and dependency cycles show an error instead of an incomplete tree. The right-aligned initiative graph button opens a bottom drawer. Graphs support pan, zoom, fit, and node actions through right-click, Shift+F10, or Actions. Blocking lineage shows only the selected ticket and its transitive prerequisites.

Each available Tracker and graph action opens a dropdown. Select a preset, add an optional instruction in the final inline input, then select **Open new pane**. Selecting a preset does not start an agent. Workflow actions offer **No extra instructions**; Ask Matt offers questions such as **What next?** and **Why is this blocked?**. Submit includes **Capture evidence + attach to ticket**. Preset and detail drafts stay separate for each repository, record, and action while the panel is open. Dismissal and preparation errors keep the draft. Escape dismisses the dropdown; arrow keys select a preset, and Enter in the input launches.

Changing the repository, record, preset, or additional instruction invalidates pending launch preparation. Obsolete responses cannot open a pane or change the current action error. An unchanged selection opens one fresh session. Before launch, the backend re-reads canonical workflow availability and prepares the skill command with the combined instructions. It starts a fresh OMP session in a new pane to the right. Each launch uses an isolated session directory and leaves existing chats unchanged. Prompts do not bypass workflow checks. Preparation errors appear in the dropdown. Description, Blocking lineage, and Activity remain available. No prompt-preview dialog is required.

The GPUI mods call Herdr's `exec()` API once per request. A short-lived Bun process imports the existing shared-context and tracker TypeScript APIs, reads JSON arguments, and returns JSON on stdout. Errors return a JSON error and a failing exit code. Those APIs use `mq` with `okf.mq` to parse Markdown. There is no HTTP listener, connection token, or background Context service. Herdr limits exec output to 8 MiB; each request has a ten-minute deadline. Process startup cost repeats per request.

The panels operate on local repositories. The backend imports modules from this checkout, so keep it available. If you update Bun or `mq`, run `mise run herdrapp.runtime`; the next request uses those paths.
