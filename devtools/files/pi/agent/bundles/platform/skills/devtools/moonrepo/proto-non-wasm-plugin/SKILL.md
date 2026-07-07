---
name: proto-non-wasm-plugin
description: Guides moonrepo proto non-WASM plugin authoring, when adding simple prebuilt CLI or tool plugins from static JSON TOML YAML config, resulting in correct platform downloads, version resolution, executables, and .prototools registration.
---

# Proto Non-WASM Plugin

## Overview
Use this skill to write **proto non-WASM plugins** for simple tools distributed as prebuilt archives. Non-WASM plugins are static config: they resolve versions, download archives, verify checksums, expose executables, and register in `.prototools` without custom WASM logic.

Primary source: moonrepo **Non-WASM plugin** docs at `https://moonrepo.dev/docs/proto/non-wasm-plugin`.

## When to Use
- Creating a proto plugin for a simple CLI with GitHub/GitLab release archives.
- Mapping `{version}`, `{os}`, `{arch}`, or `{libc}` into download file names.
- Configuring `install.exes`, shims, checksums, platform support, or `.prototools` registration.
- Resolving versions from git tags, a manifest URL, static versions, or aliases.

Do **not** use this for tools that need custom logic, source builds, dynamic API calls, archive surgery, or complex install behavior. Use a WASM proto plugin for that.

## Authoring Flow
```text
prebuilt tool?
  -> no: use WASM plugin
  -> yes: define name/type
    -> define resolve source
    -> define platform download-file patterns
    -> define install download/checksum URLs
    -> define install.exes with one primary executable
    -> register plugin in .prototools
    -> run proto install / proto run smoke check
```

## Minimal TOML Shape
```toml
name = "frobnicate"
type = "cli"

[resolve]
git-url = "https://github.com/OWNER/frobnicate"
version-pattern = "^v(?<version>.*)$"

[platform.linux]
download-file = "frobnicate-v{version}-{os}-{arch}.tar.gz"
checksum-file = "checksums.txt"
exe-path = "bin/frobnicate"
archs = ["x64", "arm64"]

[platform.macos]
download-file = "frobnicate-v{version}-{os}-{arch}.tar.gz"
checksum-file = "checksums.txt"
exe-path = "bin/frobnicate"
archs = ["x64", "arm64"]

[install]
download-url = "https://github.com/OWNER/frobnicate/releases/download/v{version}/{download_file}"
checksum-url = "https://github.com/OWNER/frobnicate/releases/download/v{version}/{checksum_file}"

[install.exes.frobnicate]
primary = true
exe-path = "bin/frobnicate"
```

Register it:
```toml
# .prototools
[plugins.tools]
frobnicate = "file://./proto/plugins/frobnicate.toml"

[tools]
frobnicate = "1.2.3"
```

## Field Rules
| Area | Rule |
|---|---|
| File format | TOML, JSON, or YAML. Prefer TOML because `.prototools` is TOML. |
| Base fields | `name` and `type` are required. `type` is usually `cli` for standalone tools. |
| Platform | `[platform.<os>]` holds native asset names. OS keys follow Rust OS strings, so macOS is `macos`. |
| Download | `platform.<os>.download-file` and `install.download-url` are required for archive installs. |
| Checksums | Use `checksum-file` plus `install.checksum-url` when upstream publishes checksum files. |
| Executables | `[install.exes]` is required. Exactly one executable SHOULD be `primary = true`. |
| Archive paths | Put `exe-path` where the binary lives after extraction, for example `bin/tool`. |
| Arch support | `archs` restricts supported archs; `arch` maps proto arch tokens to upstream asset names. |
| Version tags | Use `version-pattern` to strip `v` prefixes from git tags. |

## Token Mapping
Common interpolation tokens: `{version}`, `{major}`, `{minor}`, `{patch}`, `{os}`, `{arch}`, `{libc}`, `{download_file}`, `{checksum_file}`.

If upstream asset names do not match proto defaults, map tokens instead of hardcoding duplicate platform blocks:

```toml
[platform.linux.arch]
x64 = "x86_64"
arm64 = "aarch64"
```

Platform-scoped `arch` or `libc` mappings override global `[install.arch]` or `[install.libc]` mappings.

## Verification
Run the smallest real check:

```bash
proto install frobnicate 1.2.3
proto run frobnicate -- --version
```

If the plugin is local, verify the locator first:
```toml
[plugins.tools]
frobnicate = "file://./proto/plugins/frobnicate.toml"
```

## Common Mistakes
- Using non-WASM for a tool that needs custom install logic or source builds.
- Forgetting `[install.exes]`; proto needs executable metadata to create shims/bins.
- Marking no primary executable, or multiple primary executables.
- Confusing `archs` with `arch`: `archs` filters support, `arch` renames token values.
- Using `darwin` for platform key when the docs use proto/Rust OS-style `macos` examples.
- Omitting `version-pattern` for `v1.2.3` tags, causing raw tag text to leak into normalized versions.
- Guessing archive paths. Inspect the release archive and set `exe-path` to the extracted binary path.
