# pi-footer extension

Composable custom footer for pi.

## Features

- Singleton `Footer` registry
- Providers are data sources (not layout definitions)
- Template string with filter/pipe support for custom footer layout
- Auto-detected platform usage tracking (Anthropic, Copilot, Codex, etc)
- Default providers: token usage, git status, recent commit, model id, cwd
- Public registration API for other extensions

## Template Variables

### Auto-detected Usage (current platform)

Auto-detects provider from `ctx.model`:

- `{usage_emoji}` – Health emoji (🟢 >50%, 🟡 20-50%, 🔴 <20%)
- `{usage_platform}` – Provider label (Anthropic, Copilot, etc)
- `{usage_quota_remaining}` – Remaining quota (raw number)
- `{usage_quota_used}` – Used quota (raw number)
- `{usage_quota_total}` – Total quota (raw number)
- `{usage_quota_percent_remaining}` – Remaining ratio (0-1)
- `{usage_quota_percent_used}` – Used ratio (0-1)

### Per-Platform Usage (explicit)

Available for: `anthropic`, `copilot`, `codex`

- `{anthropic_emoji}` / `{copilot_emoji}` / `{codex_emoji}`
- `{anthropic_platform}` / `{copilot_platform}` / `{codex_platform}`
- `{anthropic_quota_remaining}` / `{copilot_quota_remaining}` / etc
- `{anthropic_quota_used}` / `{copilot_quota_used}` / etc
- `{anthropic_quota_total}` / `{copilot_quota_total}` / etc
- `{anthropic_quota_percent_remaining}` / etc
- `{anthropic_quota_percent_used}` / etc

### Core Providers

- `{time}` – Current time
- `{git_branch_name}` – Current git branch
- `{git_worktree_name}` – Git worktree name
- `{model_context_used}` – Model context used
- `{model_context_window}` – Model context window
- `{model_name}` – Current model name
- `{cwd}` – Current working directory

## Template Filters

Use pipe syntax to format raw values:

```ts
{usage_quota_remaining | humanise_time}  // → "2h 34m"
{usage_quota_percent_used | humanise_percent}  // → "64%"
```

Available filters:

- `humanise_time` – Format seconds as human-readable (2h 34m, 5d 3h)
- `humanise_percent` – Format ratio as percentage (64%)
- `humanise_number` – Add thousands separator (1,234,567)
- `round(N)` – Round to N decimal places
- `clamp(min,max)` – Clamp value between min and max

## Example Templates

Basic usage display:

```ts
"{usage_emoji} {usage_platform} | {usage_quota_remaining | humanise_time}"
// → "🟢 Anthropic | 2h 34m"
```

Percentage display:

```ts
"{usage_emoji} {usage_quota_percent_remaining | humanise_percent} remaining"
// → "🟢 64% remaining"
```

Multi-platform:

```ts
"Anthropic: {anthropic_quota_percent_remaining | humanise_percent} | Copilot: {copilot_quota_remaining}"
// → "Anthropic: 64% | Copilot: 288"
```

## Usage

```ts
import piFooterExtension, { Footer } from "./pi-footer/index.ts";

export default function (pi) {
  piFooterExtension(pi);

  Footer.registerContextProvider("custom-provider", (ctx) => ({
    text: ctx.ui.theme.fg("accent", "value"),
    align: "left",
    order: 30,
  }));
}
```

To disable a provider:

```ts
Footer.unregisterContextProvider("cwd");
```

To customize layout with a template:

```ts
import { Config } from "./pi-footer/services/config";

Config.template = [
  "{usage_emoji} {usage_platform} | {usage_quota_remaining | humanise_time}",
  { items: ["{cwd}"], flexGrow: true, align: "left" },
];
```

Supported segment attributes:
- `align="left|right"`
- `fg="themeColorName"`
- `bg="themeColorName"`
- `flexGrow` – Expand to fill space

Usage tracker scheduling can be configured from other extensions:

```ts
import { usageTracker } from "./pi-footer/index.ts";

usageTracker.setSettings({
  intervalMs: 30_000,
  maxBackoffMultiplier: 6,
});
```

## Slash commands

- `/usage-store` – Scrollable list of current `UsageTracker` store entries.
- `/context-providers` – Scrollable list of registered footer context providers.
