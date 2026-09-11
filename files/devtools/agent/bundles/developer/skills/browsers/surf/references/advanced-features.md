# Surf Advanced Features

Covers sessions, remote Surf, workflow files, playbooks, and other capabilities beyond the default single-agent loop in SKILL.md.

## Browser Sessions (multi-agent coordination)

A session owns one explicit Chrome tab. New sessions default to a separate **unfocused normal window**, so Chrome focus changes cannot retarget another agent's commands.

```bash
surf session.new research "https://example.com"   # separate unfocused window
surf session.ensure research about:blank           # idempotent, safe to repeat
surf session.new scout about:blank --tab           # inactive tab instead of a window

surf --session research read                        # explicit selector
SURF_SESSION=research surf screenshot                # environment selector

surf session.list --refresh                          # all bindings + queue state
surf session.info research --refresh                 # target and scheduler details
surf session.close research                           # closes Surf-created target
surf session.cleanup --idle-after 1h --dry-run        # preview forgotten sessions
surf session.cleanup --idle-after 1h                  # remove idle bindings
surf session.rebind research --tab-id 789             # adopt an existing tab
surf session.reopen research                          # recreate from last URL
```

Rules:
- Give every independent agent a unique `SURF_SESSION` value. Never reuse one across concurrent agents in different worktrees/directories.
- Commands for the same session tab run FIFO. Commands for different session tabs can overlap.
- Browser-wide mutations (create/move/close/focus tab or window, write cookies) wait for active tab lanes to drain. Add `--no-wait` to get `tab_busy`/`browser_busy` immediately instead of queueing.
- Sessions share the same Chrome profile: cookies, auth, storage, downloads, history are shared. For hard isolation, use separate browser profiles with separate native hosts and `SURF_SOCKET` values.
- Recovery errors print a copy-pasteable fix, e.g. `Recovery: surf session.reopen research`.
- `surf chatgpt`, `surf gemini`, `surf oracle ask` warn before taking exclusive browser access, so a queued provider flow is not mistaken for a hung command.

## Remote Surf (over Tailscale)

Runs the browser + native host on one Tailnet machine while the CLI runs on another. Tailnet reachability is **not** authorization — every remote client needs its own credential.

On the browser host:
```bash
surf remote authorize agent-macbook --output ~/agent-macbook.surf-credential.json
surf remote list
surf install <extension-id> --listen 100.101.102.103:4321
```

From the authorized client:
```bash
surf --remote 100.101.102.103:4321 \
  --remote-credential ~/.config/surf/agent-macbook.json \
  tab.list
```

TLS (client-side, requires a TLS-terminating reverse proxy in front of the listener):
```bash
surf --remote surf.example.com:443 --remote-tls \
  --remote-tls-ca ~/.config/surf/private-ca.pem \
  --remote-credential ~/.config/surf/agent-macbook.json tab.list
```

Notes:
- `--remote`/`SURF_REMOTE` overrides `SURF_SOCKET`. `--remote-credential`/`SURF_REMOTE_CREDENTIAL` selects the identity.
- `SURF_REMOTE_TLS=1` is the only accepted env spelling; there is no CLI negation for an env-enabled setting.
- Unprefixed and `local:` paths are client-local; only `remote:/absolute/path` touches the browser host directly.
- Limits: 256 MiB per file, 512 MiB / 32 files per connection. `record`, `aistudio.build`, video, and multi-file/directory transfers are rejected remotely.
- Revoke access with `surf remote revoke agent-macbook` on the browser host.
- Use `surf doctor --remote <host:port> --remote-credential <path>` to verify endpoint selection and auth after confirming Tailnet reachability with `tailscale ping`.

## Workflow Files

Save a reusable `surf do` flow as JSON in `~/.surf/workflows/` (user) or `./.surf/workflows/` (project), then run it by name:

```bash
surf do my-workflow --url "https://example.com" --max_items 10
```

```json
{
  "name": "login-flow",
  "description": "Log into example.com",
  "args": {
    "email": { "required": true, "desc": "Login email" },
    "password": { "required": true, "desc": "Login password" }
  },
  "steps": [
    { "tool": "navigate", "args": { "url": "https://example.com/login" } },
    { "tool": "type", "args": { "text": "%{email}", "selector": "input[name=email]" } },
    { "tool": "type", "args": { "text": "%{password}", "selector": "input[name=password]" } },
    { "tool": "click", "args": { "selector": "button[type=submit]" } }
  ]
}
```

Step outputs (`"as": "title"`), `each`/`repeat` loops, and `until` exit conditions are supported — see the upstream README for full loop syntax. Manage with `surf workflow.list`, `surf workflow.info <name>`, `surf workflow.validate ./file.json`.

## Playbooks

Use `surf do` for a one-off sequence. Use a **playbook** for a reusable site capability that tries a network request first and falls back to a workflow when the endpoint drifts.

```bash
surf playbook list
surf pb show page
surf pb ops page
surf use page read --json

# Write ops require explicit authorization and a duplicate-safety receipt
surf use <site> <write-op> --write --resource-id 123
```

Read ops may use a trusted `script` strategy (`--allow-script` required at run time; this is not a security sandbox — only run scripts from playbooks you trust). Project playbooks in `./.surf/playbooks/` override user playbooks in `~/.surf/playbooks/`; built-ins are the final fallback.

Author from observed activity:
```bash
surf pb suggest --since 1h
surf pb record start example --op read --network --watch
surf pb record stop --draft
surf pb save --from-record <record-id>
```

## Oracle (durable ChatGPT consult)

Prefer over one-shot `surf chatgpt` when the consult needs file context, a specific model/effort, or should be resumable.

```bash
surf oracle ask "review this change" --files "src/**/*.ts" --file ./design.md \
  --model gpt-5.5 --effort pro --github --detach --json
surf oracle status <job-id> --json
surf oracle result <job-id> --wait --json
surf oracle follow <job-id> "challenge that recommendation" --file ./follow-up.md --github --detach --json
```

Only one oracle job runs at a time — a second `ask` returns the blocking job id instead of queueing silently. Accepted efforts: `instant`, `medium`, `high`, `xhigh`/`extra-high`, `pro`. `--model gpt-6-astra` must read back as model 6 before submission (fails closed if the UI can't verify it); `--model latest` floats. `--github` requires the ChatGPT Chat tab and connected GitHub tool.

## Emulation, Recording, and Performance

```bash
surf emulate.device --list
surf emulate.device "iPhone 14"
surf emulate.viewport --width 375 --height 812 --scale 2
surf emulate.touch

surf record --duration 2000 --fps 10 --output /tmp/anim.gif      # GIF (ImageMagick required)
surf video start ./demo.webm --fps 30                              # WebM/VP9 (ffmpeg required)
surf animate-audit --selector ".thing" --duration 2000 --fps 10   # JSON timeline, no file output
surf perf-audit --duration 3000 --trigger "click:.cta" --output /tmp/perf.json
surf perf.metrics / perf.start / perf.stop
```

## Extract (read-only structured data)

`surf extract` opens an owned tab, waits for readiness, runs a page script, validates the JSON result, and closes the tab.

```bash
surf extract "https://example.com/list" --file rows.js --ready-selector ".item"
surf extract --tab-id 42 --code 'return [...document.querySelectorAll("h2")].map(h => ({title: h.textContent}))'
```

Treat extraction scripts as idempotent — a retry can replay the script. Zero rows retry (bounded, default 1, max 5) unless `--allow-empty` or `--empty-text` is set. Login/challenge/not-found/page-error results never retry.

## Network Capture

Capture is automatic while Surf is active — no explicit start needed.

```bash
surf network --exclude-static --since 5m
surf network --origin api.github.com --status 4xx,5xx
surf network.get r_001
surf network.body r_001
surf network.export --har --output ./trace.har
```

Storage: `~/.surf/state/network/` (override `SURF_NETWORK_PATH`). Auto-cleanup: 24h TTL, 200MB max.

## Global Options

```bash
--session <name>   # Target a durable browser session (or set SURF_SESSION)
--tab-id <id>
--window-id <id>
--no-wait          # Return tab_busy/browser_busy instead of queueing
--json
--soft-fail        # stderr warning, exit 0, empty stdout — even with --json
--no-lock          # Bypass legacy lock for compound client-side commands
--no-screenshot
--full             # Full-resolution screenshots (skip resize)
```

## Key Environment Variables

`SURF_SESSION`, `SURF_SOCKET`, `SURF_REMOTE`, `SURF_REMOTE_CREDENTIAL`, `SURF_REMOTE_TLS`, `SURF_STATE_DIR`, `SURF_NETWORK_PATH`. Full list and use cases: upstream README `Environment Variables` section.
