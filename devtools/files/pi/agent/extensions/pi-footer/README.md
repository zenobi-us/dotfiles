# pi-footer extension

Composable custom footer for pi.

## Features

- Singleton `Footer` registry
- Providers are data sources (not layout definitions)
- Nunjucks-like template string for custom footer layout
- Default providers: token usage, git status, recent commit, model id, cwd
- Public registration API for other extensions

## Usage

```ts
import piFooterExtension, { Footer } from "./pi-footer/index.ts";

export default function (pi) {
  piFooterExtension(pi);

  Footer.registerContextProvider("codex-days-remaining", (ctx) => ({
    text: ctx.ui.theme.fg("accent", "12m34s"),
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
Footer.setTemplate(`{% block "footer" %}
  {% block "segment" %}{{ token-usage }}{% endblock %}
  {% block "segment" bg="accent" fg="background" %}{{ model }}{% endblock %}
  {% block "segment" align="right" %}{{ cwd }}{% endblock %}
{% endblock %}`);
```

Supported segment attributes:
- `align="left|right"`
- `fg="themeColorName"`
- `bg="themeColorName"`

Usage tracker scheduling can be configured from other extensions:

```ts
import { usageTracker } from "./pi-footer/index.ts";

usageTracker.setSettings({
  intervalMs: 30_000,
  maxBackoffMultiplier: 6,
});
```
