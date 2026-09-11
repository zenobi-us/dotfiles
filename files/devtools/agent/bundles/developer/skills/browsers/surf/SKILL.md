---
name: surf
description: Controls Chrome through surf-cli for browser automation, debugging, and AI-assisted browsing. Use when tasks need navigation, form filling, screenshots, page inspection, network diagnostics, session-scoped multi-agent browsing, or multi-step browser workflows from the terminal. Results in deterministic, scriptable browser operations with less orchestration overhead.
---

# Surf CLI Browser Automation

## Overview

Use this skill when browser work should be done through `surf` commands instead of ad-hoc manual browsing.

Core principle: **read page state first, then act, then verify**.

- Repo: `nicobailon/surf-cli`
- Tool style: local CLI + Chrome extension + native host (Unix socket / named pipe)
- Strength: fast deterministic workflows (`surf do ...`), robust page interaction via refs/semantic locators, and durable per-agent browser sessions

## When to Use

Use this skill when the user asks for:
- Browser automation from terminal/agent
- Clicking/filling/submitting web forms
- Screenshots, page text extraction, state checks
- Network or console diagnostics
- AI queries via browser sessions (ChatGPT/Gemini/Perplexity/Grok/AI Studio/Kimi)
- Multiple agents driving the same or different browser tabs concurrently

Do not use when:
- User only needs static HTTP scraping (use curl/wget first)
- Browser extension/native host is unavailable and cannot be installed

## Quick Start

```bash
# 1) Install surf-cli
npm install -g surf-cli

# 2) Inspect command surface
surf --help
surf --help-full
surf --llm-context             # compact reference built for agents

# 3) Diagnose the native host connection before first use
surf doctor

# 4) Smoke test connection
surf tab.list
```

If `doctor` or `tab.list` fails, load [references/setup-and-troubleshooting.md](references/setup-and-troubleshooting.md).

## Sessions: Required for Concurrent Agents

Every independent agent shell MUST claim a named session before its first browser command. Sessions stop Chrome focus changes from retargeting another agent's commands.

```bash
export SURF_SESSION="$(basename "$PWD" | sed 's/[^A-Za-z0-9._-]/-/g')"
surf session.ensure "$SURF_SESSION" about:blank

# All later tab-scoped commands use that session automatically
surf go "https://example.com"
surf read
```

`session.ensure` is idempotent: it creates a missing session, reuses a live one, and reopens a stale/closed one. Give each agent a distinct session name — never share one across concurrent agents in different worktrees/directories.

Other session commands: `session.new`, `session.list --refresh`, `session.info <name>`, `session.close <name>`, `session.cleanup --idle-after 1h`, `session.rebind`, `session.reopen`. Load [references/advanced-features.md](references/advanced-features.md) for full session, remote, and playbook detail.

## Default Interaction Loop

```bash
# Navigate
surf go "https://example.com"

# Read page model (refs and content)
surf read --compact

# Interact
surf click e5
surf type "hello" --selector "#search"

# Verify result
surf wait.load
surf screenshot --output /tmp/surf-result.png
```

## Recommended Command Patterns

### 1) Reliable element targeting
Prefer in this order:
1. **refs** from `surf read` (`e1`, `e2`, ...)
2. **semantic locators** (`locate.role`, `locate.label`, `locate.text`)
3. CSS selectors (fallback)

```bash
surf locate.role button --name "Submit" --action click
surf locate.label "Email" --action fill --value "user@example.com"
```

### 2) Multi-step automation with `do`
Use `surf do` for deterministic flows and less token overhead. Actions that change the page (navigation, click, type, tab switch) auto-wait for completion.

```bash
surf do 'go "https://example.com/login" | type "user@example.com" --selector "#email" | type "secret" --selector "#password" | click --selector "button[type=submit]" | wait.load | screenshot --output /tmp/login.png'
```

Validate before execution when flow is uncertain:

```bash
surf do 'go "https://example.com" | click e5' --dry-run
```

For a reusable flow, save it as a named workflow JSON file under `~/.surf/workflows/` or `./.surf/workflows/` and run `surf do my-workflow --url "..."`. See [references/advanced-features.md](references/advanced-features.md) for the JSON format (args, loops, step outputs).

### 3) Debugging workflow

```bash
surf doctor                 # native host / socket health first
surf read --compact
surf page.state
surf console
surf network --limit 20
surf screenshot --output /tmp/debug.png
```

### 4) Waiting for real readiness
`wait.ready` fails fast on a bad page state instead of timing out silently, returning a typed state (`ready`, `empty`, `login`, `challenge`, `not-found`, `error`).

```bash
surf wait.ready --selector ".results" --empty-text "No results"
```

### 5) AI-through-browser workflow
Use when the user explicitly wants browser-authenticated AI providers (no API key flow).

```bash
surf chatgpt "summarize this page" --with-page
surf gemini "explain this" --with-page
surf perplexity "fact-check this" --with-page
surf grok "latest AI agent trends on X" --deep-search
surf aistudio "explain quantum computing" --with-page
surf kimi "summarize" --with-page
```

For a durable, resumable ChatGPT consult (as opposed to a one-shot query), use `surf oracle ask/status/result/follow` — see [references/advanced-features.md](references/advanced-features.md).

If login/model issues occur, load [references/setup-and-troubleshooting.md](references/setup-and-troubleshooting.md).

## High-Value Command Reference

```bash
# Navigation & page state
surf go <url>                       # alias: navigate
surf back
surf forward
surf read --compact                 # alias: page.read
surf page.text
surf page.state
surf extract <url> --file rows.js   # read-only structured extraction into JSON/Markdown

# Interactions
surf click <ref>
surf click --selector "..."
surf type "..." --selector "..."
surf key Enter
surf hover --ref e5
surf select e5 "US"                 # dropdown option select

# Waiting
surf wait 2
surf wait.element ".ready"
surf wait.network
surf wait.url "/success"
surf wait.load
surf wait.ready --selector ".results"

# Capture
surf screenshot --output /tmp/shot.png   # alias: snap
surf screenshot --fullpage
surf record --duration 2000 --fps 10 --output /tmp/anim.gif
surf video start ./demo.webm --fps 30

# Diagnostics
surf doctor
surf console
surf network
surf network.get --id <req-id>
surf network.body --id <req-id>
surf network.export --har --output ./trace.har

# Emulation
surf emulate.device "iPhone 14"
surf emulate.viewport --width 375 --height 812

# Workflows & playbooks
surf do 'go "https://example.com" | read | screenshot'
surf workflow.list
surf workflow.info <name>
surf playbook list
surf use <site> <op>
```

Full command surface: `surf --help-full`. Search by keyword: `surf --find <term>`.

## Aliases

| Alias | Command |
|-------|---------|
| `snap` | `screenshot` |
| `read` | `page.read` |
| `find` | `search` |
| `go` | `navigate` |

## Common Mistakes

1. **Acting before reading state**
   - Fix: always run `surf read` or `surf page.state` before interactions.

2. **Skipping session setup with multiple agents**
   - Fix: run `surf session.ensure "$SURF_SESSION" about:blank` before any browser command when more than one agent may be driving Chrome.

3. **Using stale refs after navigation/DOM shifts**
   - Fix: rerun `surf read` and use fresh refs.

4. **Long flows as many separate commands**
   - Fix: collapse into `surf do` for deterministic execution, or save a named workflow.

5. **Ignoring timeouts on slow AI models/pages**
   - Fix: increase timeout (`--timeout 600`) and add explicit waits.

6. **Assuming AI tools work without browser login**
   - Fix: ensure active login session in Chrome for each provider.

## Decision Map

```text
[Need browser task]
   |
   v
[Can use surf?] --no--> [Use alternative tool/path]
   |
  yes
   v
[Multiple concurrent agents?] --yes--> [session.ensure "$SURF_SESSION" first]
   |
  no
   v
[Single action?] --no--> [Use surf do / workflow JSON]
   |                         |
  yes                        v
   v                      [dry-run optional]
[read -> act -> verify]       |
   |                          v
   +----------------------> [execute + screenshot/log validation]
```

## Adjacent Skills

- `agent-browser`: alternate browser automation CLI
- `chrome-debug`: CDP-first debugging workflows
- `lynx-web-search`: research without browser automation
