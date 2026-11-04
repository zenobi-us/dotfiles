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
show the endpoint. The default address is `http://127.0.0.1:47840`.

- `GET /health` reports the coordinator service and protocol.
- `GET /tablet/bundle.tar.gz` downloads the Linux ARM64 client bundle.
- `GET /tablet/bundle.sha256` downloads its SHA-256 checksum.

This server exposes public bootstrap files only. It does not accept images,
notebook data, credentials, or annotation jobs. The existing browser editor
keeps its separate token-protected server. Subagents do not start the coordinator.

Build the bundle and browser editor from the extension directory:

```sh
cd mise/conf.d/devtools-omp/extensions/image-annotator
bun run build
```

The bundle build needs Go, `tar`, and `sha256sum`. Provisioning also needs
`curl` and SSH. Use `version`, `status`, or `download-bundle` for routine checks. The installer
uses `validate-url` to check the coordinator URL. The client has no background
service or process detector.

For tablet access, set `OMP_IMAGE_ANNOTATOR_HOST` to the desktop USB address
before starting OMP. Set `OMP_IMAGE_ANNOTATOR_PORT` to change the port. The
loopback default is not reachable from the tablet. For example, if the desktop
USB address is `10.11.99.10`, start OMP with:

```sh
OMP_IMAGE_ANNOTATOR_HOST=10.11.99.10 omp
```

From the extension directory, check the bundle without contacting the tablet:

```sh
sh scripts/provision-tablet.sh \
  --server-url http://10.11.99.10:47840 \
  --coordinator-url http://10.11.99.10:47840 \
  --dry-run
```

Remove `--dry-run` to copy and install the bundle over SSH. The default SSH
target is `root@10.11.99.1`; use `--ssh-target` to change it. SSH host-key
verification stays enabled. The installer creates `/home/root/pi-ink-client`
and refuses an existing path. It runs the bundled client
with `validate-url` before it creates the install directory. It does not start a
background service or change Xochitl, XOVI, notebooks, firmware, or old experiments. A failed install can leave a
partial directory; the installer does not delete it or retry.

After installation, run `/home/root/pi-ink-client/pi-ink-client status` on the
tablet to check HTTP access. The client reads the installed `coordinator-url`
file. Use `download-bundle --output /new/bundle.tar.gz` to download and check
the public bundle. SHA-256 detects a changed download; it does not authenticate
the HTTP server. Pen input and annotation transfer are not part of this path.


