---
title: Inspect the configuration
---

Clone to the stable configuration path. These commands inspect the plan without applying it.

```
git clone https://github.com/zenobi-us/dotfiles.git \
  "$HOME/.local/share/dotfiles"
cd "$HOME/.local/share/dotfiles"
mise trust
mise bootstrap --dry-run
```

Use an existing checkout if that path is already present. Bootstrap can install packages and replace deployed configuration links; keep backups of your current setup.
