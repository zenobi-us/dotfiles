---
name: neovim-best-practices
description: >-
  Configures Neovim with the user's opinionated Lua patterns, namespaced config
  structure, LSP via Mason + nvim-lspconfig, and leader key conventions. Contains
  user-specific decisions and checklists Claude cannot know without this skill.
  Make sure to use this skill whenever the user mentions neovim, nvim, init.lua,
  LSP setup, keymaps, autocommands, neovim plugins, Mason, TypeScript LSP, slow
  LSP, neovim config, or any neovim question — even if Claude thinks it can
  answer from general knowledge.
version: 0.1.0
---

# Neovim Best Practices

Opinionated guidance for modern Neovim configuration. This skill covers the decisions and patterns that matter — not documentation you can look up.

## Core Decisions

These are the opinionated choices this config follows. Apply these unless the user explicitly wants something different.

### Lua Only, No Vimscript

All configuration in Lua. No `vim.cmd()` wrappers around Vimscript unless there's no Lua API equivalent. Use `vim.opt` for options, `vim.keymap.set` for keymaps, `vim.api.nvim_create_autocmd` for autocommands.

### lazy.nvim for Plugin Management

One plugin per file in `lua/plugins/`. Every plugin lazy-loaded unless needed at startup (colorscheme, treesitter, statusline). See the `lazy-nvim-optimization` skill for deep lazy-loading guidance.

### Namespace Under Username

```
~/.config/nvim/
├── init.lua
└── lua/
    └── kriscard/
        ├── init.lua
        ├── options.lua
        ├── keymaps.lua
        ├── autocmds.lua
        └── lazy.lua
```

This prevents collisions with plugin module names. Entry point is just `require("kriscard")`.

### LSP via Mason + nvim-lspconfig

Mason manages server installations. nvim-lspconfig provides server configurations. Use `cmp_nvim_lsp` capabilities for completion integration. Set keymaps in `on_attach` so they're buffer-local.

### Leader Key Conventions

`<Space>` as leader, set before any plugins load. Organized by prefix:
- `f` = find/search (telescope)
- `g` = git operations
- `b` = buffer management
- `w` = window management
- `l` = LSP operations
- `t` = terminal/tests

Every keymap requires a `desc` field for which-key discoverability.

## Version-Specific Features (0.10+)

Take advantage of these — they replace plugins:

- **Built-in commenting**: `gcc`/`gc` work natively. Can replace Comment.nvim.
- **Inlay hints**: `vim.lsp.inlay_hint.enable(true)` — no plugin needed.
- **Improved diagnostics**: `vim.diagnostic.config()` with `float.border` for better display.

## Deprecated Patterns to Avoid

| Instead of... | Use... |
|---------------|--------|
| `vim.cmd("set number")` | `vim.opt.number = true` |
| `vim.api.nvim_set_keymap()` | `vim.keymap.set()` |
| `vim.cmd("augroup...")` | `vim.api.nvim_create_autocmd()` |
| Vimscript autocommands | Lua with `callback` |
| Comment.nvim (on 0.10+) | Built-in `gcc` |

## Checklists

### Config Structure

- [ ] `init.lua` is entry point only (just `require("kriscard")`)
- [ ] Config namespaced under username in `lua/`
- [ ] Plugin specs in `lua/plugins/` (one per file or logical group)
- [ ] Options, keymaps, autocmds in separate files
- [ ] Using lazy.nvim for plugin management

### Code Quality

- [ ] All config in Lua (no Vimscript)
- [ ] `vim.opt` for options
- [ ] `vim.keymap.set` with `desc` for keymaps
- [ ] `vim.api.nvim_create_autocmd` for autocommands
- [ ] No deprecated APIs
- [ ] Leader key set before plugin loading

### Performance

- [ ] Startup under 50ms (`nvim --startuptime`)
- [ ] Plugins lazy-loaded by cmd/keys/ft/event
- [ ] Heavy plugins deferred with `VeryLazy`
- [ ] No synchronous system calls at startup

## Reference Files

For detailed information:
- **`references/plugin-recommendations.md`** - Curated plugin list by category
- **`references/lsp-setup.md`** - Comprehensive LSP configuration guide
- **`references/migration-guide.md`** - Migrating from Vimscript to Lua
