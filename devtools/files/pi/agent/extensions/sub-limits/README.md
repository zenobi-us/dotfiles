# sub-limits

Display usage limits for all authenticated providers via pi-sub-core.

## Example Output

```
Provider Usage Limits
────────────────────────────────────────

● Anthropic (Claude)
   Daily: ███████░░░░░░░░ 47% (resets in 3h)
   Weekly: █████░░░░░░░░░░ 33%
   Extra Usage: On

● GitHub Copilot
   Month: ██████████░░░░░ 67% (250/375 requests)

● Google Gemini
   Pro: ████░░░░░░░░░░░ 25%
   Flash: ██░░░░░░░░░░░░░ 12%

○ Kiro
   ⚠ Required CLI tool not found
```

## Requirements

- [pi-sub-core](https://github.com/marckrenn/pi-sub) must be installed:

```bash
pi install npm:@marckrenn/pi-sub-core
```

- Providers must be configured in `~/.pi/agent/auth.json`

## Usage

```
/limits
```

## Supported Providers

- **Anthropic (Claude)** - 5h/week windows, extra usage status
- **GitHub Copilot** - Monthly quota, requests remaining
- **Google Gemini** - Pro/Flash quotas
- **Antigravity** - Model quotas
- **OpenAI Codex** - Primary/secondary windows
- **AWS Kiro** - Credits
- **z.ai** - Token limits

## Installation

```bash
# Download from gist
gh gist clone 25b4aee6f4a6a775aff028adfdb9936f ~/.pi/agent/extensions/sub-limits

# Reload pi
/reload
```

## How It Works

The extension uses the `sub-core:request` event to fetch usage entries:

```typescript
pi.events.emit("sub-core:request", {
  type: "entries",
  force: true,
  reply: (payload) => {
    // payload.entries: ProviderUsageEntry[]
  }
});
```
