---
name: hrdx-plugins
description: Use when creating, approving, debugging, or driving hrdx plugins and the hrdx socket API; produces safe plugin manifests, bounded JSON-line protocol handlers, least-privilege grants, and tested lifecycle or workspace operations.
---

# hrdx plugins

Use this skill when a task mentions hrdx plugins, `plugin.json`, plugin approvals, plugin views, plugin capabilities, `hrdx.sock`, or hrdx JSON-RPC.

## Core rules

- Treat plugins as trusted executable code. They are not sandboxed.
- Keep normal hrdx startup unchanged. Plugins run only after `--plugins`.
- Request the smallest set of grants that the feature needs.
- Declare contributions and requested grants in `plugin.json`. Do not discover them by running plugin code.
- Bind approval to the package path and content digest. Reapprove after any package file changes.
- Keep protocol traffic as one JSON object per line on stdin and stdout.
- Respect the protocol limits: 256 KiB frames, 32 calls per direction, and ten-second deadlines.
- Do not treat plugin configuration as a secret store.
- Use `--plugin-views` only with `--plugins`, and only when the plugin needs views.

## Route by task

| Task | Read |
|---|---|
| Create or review a package, manifest, grant, or protocol handler | [Plugin reference](references/plugin-reference.md) |
| Drive a running hrdx session or build an integration | [Socket API reference](references/socket-api-reference.md) |
| Diagnose approval, digest, activation, lifecycle, or scope errors | Both references, then run `hrdx plugins doctor` and `hrdx plugins list` |

## Required workflow

1. Read the relevant reference before writing code or commands.
2. Inspect the plugin package and entrypoint before approval.
3. Write the manifest with only required requests and contributions.
4. Approve with `hrdx plugins approve --package PATH --trust` and explicit grants.
5. Start hrdx with `--plugins`. Add `--plugin-views` only for view features.
6. Exercise the smallest end-to-end path.
7. Run `hrdx plugins doctor` and inspect the saved approval when behavior differs.
8. Reapprove changed packages. Restart after new approvals or changed grants.

## Completion criteria

A plugin task is complete only when:

- The manifest is valid and its entrypoint exists.
- The approval uses explicit grants and the intended workspace or instance scope.
- The plugin completes `hello`, `hello_ack`, and `ready` before normal traffic.
- Requests have bounded responses and handle `shutdown`.
- The integration does not expose screen content or input without the matching grants.
- The relevant lifecycle or socket operation works in a running hrdx session.
- The final commands and required flags are documented.

## Source

The authoritative references are:

- <https://www.hrdx.dev/docs/plugins>
- <https://www.hrdx.dev/docs/api>

Read the live pages when the installed hrdx version differs from this skill.
