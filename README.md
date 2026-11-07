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

The `image-annotator` extension starts a public HTTP coordinator in interactive
root OMP sessions. Restart OMP after this update. Use `/image coordinator` to
show its local health URL, DNS-SD name, and coordinator ID. Subagents do not
start a coordinator.

The coordinator listens on all IPv4 and IPv6 interfaces at port `47840`. No
USB address or host environment variable is required. Set
`OMP_IMAGE_ANNOTATOR_PORT` only if you need a different port. Each tablet can
use the same coordinator.

- `GET /health` reports the service, protocol, and coordinator ID.
- `GET /tablet/bundle.tar.gz` downloads the Linux ARM64 client bundle.
- `GET /tablet/bundle.sha256` downloads its SHA-256 checksum.

These endpoints expose public bootstrap files only. They do not accept images,
notebook data, credentials, or annotation jobs. The existing browser editor
keeps its separate token-protected server.

#### Desktop discovery service

The desktop needs a running `avahi-daemon` and access to the system D-Bus.
The extension registers `_omp-ink._tcp.local.` through Avahi. Its SRV record
gives the host and HTTP port. Its TXT records contain `proto=1`, `path=/`, and
`id=<coordinator-id>`. Avahi publishes the host addresses. It removes the
registration when the extension closes its D-Bus connection or exits.

The desktop stores its public, stable ID in
`~/.omp/agent/image-annotator/coordinator-id`. The tablet discovers addresses
for each command. It does not store a coordinator URL.

DNS-SD uses local multicast. It normally does not cross subnets or VLANs.
The network must permit mDNS traffic on UDP port `5353`, replies to the
client’s unicast query socket, and HTTP access to the coordinator port.
Discovery and coordinator IDs do not authenticate a desktop. Do not put
private data on these public endpoints.

#### Build and provision

Build the browser editor and tablet bundle from the extension directory.
The bundle build needs Go 1.25 or later, `tar`, and `sha256sum`.

```sh
cd mise/conf.d/devtools-omp/extensions/image-annotator
bun run build
```

The provisioning script reads `tablet-client/dist` from its own location.
It does not fetch the bundle through HTTP. It can run from any directory,
and the coordinator does not need to be running. Check the local bundle
without contacting the tablet:

```sh
sh mise/conf.d/devtools-omp/extensions/image-annotator/scripts/provision-tablet.sh --dry-run
```

Run that command from the repository root. From another directory, use an
absolute path to the same script. Remove `--dry-run` to copy the bundle over
SSH and install it. The default SSH target is `root@10.11.99.1`. Use
`--ssh-target` to change it. SSH host-key verification stays enabled. No
server URL or coordinator URL argument is required.

The installer creates `/home/root/pi-ink-client` and refuses an existing
path. It copies the client and `VERSION` only. It does not run the ARM64
client, discover a desktop, or create a coordinator configuration file. It
does not start a background service or change Xochitl, XOVI, notebooks,
firmware, or old experiments. A failed install can leave a partial directory.
The installer does not delete that directory or retry.

#### Select and check a coordinator

After installation, run these commands on the tablet:

```sh
cd /home/root/pi-ink-client
./pi-ink-client discover
./pi-ink-client status
```

If discovery finds one compatible coordinator, `status` uses it without
configuration. If it finds several, choose an ID from `discover`:

```sh
./pi-ink-client select --coordinator-id <id-from-discover>
./pi-ink-client status
./pi-ink-client download-bundle --output /new/bundle.tar.gz
```

`select` checks HTTP health before it saves `coordinator-id` beside the
client. Each tablet keeps its own selection. If that coordinator disappears,
the client fails instead of switching to another desktop. Use `select` again
to change it. Use `--coordinator-id` with `status`, `download-bundle`, or `update` for a
one-command choice without changing the saved ID.

The client checks the discovered ID and protocol against HTTP health. It
checks downloaded bundle bytes against SHA-256. These checks do not
authenticate the HTTP server. Pen input and annotation transfer are not part
of this path. Desktop discovery and offline installation have been checked.
The owner confirmed tablet discovery and status. Self-update has desktop proof only; the tablet update still needs a device check.


#### Update from the tablet UI

A tablet UI can run this one-shot command as a child process:

```sh
/home/root/pi-ink-client/pi-ink-client update
```

The command discovers the coordinator and checks its health. It downloads the
bundle, checks SHA-256, and stages the replacement beside the installed client.
It accepts only the expected three regular archive files and a matching ELF
architecture. It does not execute the bundled installer. A same-filesystem
rename replaces the executable only after preparation succeeds. The saved
`coordinator-id` and other installed files stay in place.

On success, stdout contains one JSON object and the process exits with code 0:

```json
{"status":"updated","version":"0.2.0"}
```

On failure, the process exits with a nonzero code and writes the error to
stderr. Preparation failures leave the working executable unchanged. A second
concurrent update fails instead of competing for replacement. The caller can
run the next client command after success. No service or Xochitl restart is
part of this operation. Use `--coordinator-id` for a one-command destination
choice, as with `status`.

Read the current executable version with `pi-ink-client version`. The installed
`VERSION` file remains a record of the initial installation. Downloads have a
64 MiB limit.

The `update` command starts with client version `0.2.0`. An installed `0.1.0`
client needs one setup-time deployment of the new executable before the UI
can call this command. The initial installer still refuses an occupied prefix.
It is not an upgrade command.

Updates install code from an unsigned HTTP bundle. Use only a coordinator and
network you trust. SHA-256 does not authenticate the publisher. This development
path is not a secure production updater.



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
