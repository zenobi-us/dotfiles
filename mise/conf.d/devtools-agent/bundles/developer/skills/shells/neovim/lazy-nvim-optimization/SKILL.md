---
name: lazy-nvim-optimization
description: >-
  Profiles Neovim startup performance and optimizes lazy.nvim plugin loading with
  targeted lazy-loading specs, priorities, and event triggers. Contains profiling
  workflow and bottleneck checklists. Make sure to use this skill whenever the user
  mentions slow neovim startup, neovim takes time to load, plugin profiling,
  lazy-loading, lazy.nvim config, startup time optimization, or neovim performance
  — even if the user doesn't say "lazy.nvim" explicitly.
version: 0.1.0
---

# Lazy.nvim Optimization

Diagnose and fix Neovim startup performance through profiling and targeted lazy-loading.

## Profiling Workflow

When a user reports slow startup, follow this sequence — don't skip to solutions.

### Step 1: Measure Baseline

```bash
nvim --startuptime startup.log && tail -1 startup.log
```

Compare against targets:
- < 30ms: Excellent
- 30-50ms: Good
- 50-100ms: Acceptable
- > 100ms: Needs work

### Step 2: Identify Slow Plugins

```vim
:Lazy profile
```

Look for plugins with load time > 10ms. These are your optimization targets. Sort by time, not alphabetically.

Also check the startup log for:
- Files taking > 10ms to source
- `setup()` functions taking > 5ms
- Synchronous operations blocking startup

### Step 3: Apply Lazy-Loading

For each slow plugin, choose the right trigger:

| Plugin Type | Trigger | Example |
|-------------|---------|---------|
| Has clear commands | `cmd` | `cmd = "Telescope"` |
| Accessed via keybindings | `keys` | `keys = { "<leader>e" }` |
| Language-specific | `ft` | `ft = { "rust", "go" }` |
| Needed after UI renders | `event = "VeryLazy"` | UI enhancements |
| Needed when editing | `event = "BufReadPost"` | Git signs, diagnostics |
| Needed in insert mode | `event = "InsertEnter"` | Completion, autopairs |
| Only used as dependency | `lazy = true` | plenary.nvim |

### Step 4: Verify Improvement

```bash
nvim --startuptime startup-after.log && tail -1 startup-after.log
```

Compare total times. Then `:Lazy profile` to verify plugins load when expected.

## What NOT to Lazy-Load

These need to load at startup — don't fight it:

- **Colorscheme** — Set `priority = 1000` so it loads first. Visible flash if deferred.
- **Treesitter** — Needed for syntax highlighting immediately. Deferring causes flicker.
- **Statusline** — Visible at startup. Deferring causes layout shift.
- **which-key** — Only if it shows on startup. Otherwise can lazy-load.
- **LSP base setup** — Though individual servers can lazy-load by filetype.

## Common Bottlenecks

**Synchronous system calls at startup:**
```lua
-- Bad: blocks startup
vim.fn.system("git status")

-- Good: defer it
vim.defer_fn(function()
  vim.fn.system("git status")
end, 100)
```

**Loading all LSP servers at once:**
Consider loading LSP servers per-filetype instead of all at startup. Each server you don't load saves 5-15ms.

**Plugins without any trigger:**
A bare `{ "plugin/name" }` spec loads at startup. Always add a trigger unless the plugin genuinely needs immediate availability.

## Performance Checklist

### Startup

- [ ] Colorscheme has `priority = 1000`
- [ ] File explorers load on cmd/keys
- [ ] Git interfaces load on cmd/keys
- [ ] Completion loads on `InsertEnter`
- [ ] Language plugins load on filetype
- [ ] UI enhancements load on `VeryLazy`

### Runtime

- [ ] Telescope uses fzf-native extension
- [ ] Treesitter parsers installed only for used languages
- [ ] LSP servers only for filetypes you use
- [ ] No plugins duplicating built-in 0.10+ features

### Config

- [ ] No synchronous system calls at startup
- [ ] `setup()` only runs when plugins load
- [ ] Keymaps defined with plugin lazy-loading
- [ ] Auto-commands use specific events, not `"*"`

## Reference Files

For detailed information:
- **`references/lazy-loading-decision-tree.md`** - Decision tree for choosing lazy-loading strategy
- **`references/profiling-guide.md`** - Advanced profiling techniques
