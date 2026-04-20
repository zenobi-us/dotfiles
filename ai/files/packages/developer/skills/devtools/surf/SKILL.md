---
name: surf
description: Controls Chrome through surf-cli for browser automation, debugging, and AI-assisted browsing. Use when tasks need navigation, form filling, screenshots, page inspection, network diagnostics, or multi-step browser workflows from the terminal. Results in deterministic, scriptable browser operations with less orchestration overhead.
---

# Surf CLI Browser Automation

## Overview

Use this skill when browser work should be done through `surf` commands instead of ad-hoc manual browsing.

Core principle: **read page state first, then act, then verify**.

- Repo: `nicobailon/surf-cli`
- Tool style: local CLI + Chrome extension + native host
- Strength: fast deterministic workflows (`surf do ...`) and robust page interaction via refs/semantic locators

## When to Use

Use this skill when the user asks for:
- Browser automation from terminal/agent
- Clicking/filling/submitting web forms
- Screenshots, page text extraction, state checks
- Network or console diagnostics
- AI queries via browser sessions (ChatGPT/Gemini/Perplexity/Grok/AI Studio)

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

# 3) Smoke test connection
surf tab.list
```

If `tab.list` fails, load [references/setup-and-troubleshooting.md](references/setup-and-troubleshooting.md).

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
Use `surf do` for deterministic flows and less token overhead.

```bash
surf do 'go "https://example.com/login" | type "user@example.com" --selector "#email" | type "secret" --selector "#password" | click --selector "button[type=submit]" | wait.load | screenshot --output /tmp/login.png'
```

Validate before execution when flow is uncertain:

```bash
surf do 'go "https://example.com" | click e5' --dry-run
```

### 3) Debugging workflow

```bash
surf read --compact
surf page.state
surf console
surf network --limit 20
surf screenshot --output /tmp/debug.png
```

### 4) AI-through-browser workflow
Use when user explicitly wants browser-authenticated AI providers (no API key flow).

```bash
surf chatgpt "summarize this page" --with-page
surf gemini "explain this" --with-page
surf perplexity "fact-check this" --with-page
```

If login/model issues occur, load [references/setup-and-troubleshooting.md](references/setup-and-troubleshooting.md).

## High-Value Command Reference

```bash
# Navigation & page state
surf go <url>
surf back
surf forward
surf read --compact
surf page.text
surf page.state

# Interactions
surf click <ref>
surf click --selector "..."
surf type "..." --selector "..."
surf key Enter
surf hover --ref e5

# Waiting
surf wait 2
surf wait.element ".ready"
surf wait.network
surf wait.url "/success"
surf wait.load

# Capture
surf screenshot --output /tmp/shot.png
surf screenshot --full-page

# Diagnostics
surf console
surf network
surf network.get --id <req-id>
surf network.body --id <req-id>

# Workflows
surf do 'go "https://example.com" | read | screenshot'
surf workflow.list
surf workflow.info <name>
```

## Common Mistakes

1. **Acting before reading state**
   - Fix: always run `surf read` or `surf page.state` before interactions.

2. **Using stale refs after navigation/DOM shifts**
   - Fix: rerun `surf read` and use fresh refs.

3. **Long flows as many separate commands**
   - Fix: collapse into `surf do` for deterministic execution.

4. **Ignoring timeouts on slow AI models/pages**
   - Fix: increase timeout (`--timeout 600`) and add explicit waits.

5. **Assuming AI tools work without browser login**
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
