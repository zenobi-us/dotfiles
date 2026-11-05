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

