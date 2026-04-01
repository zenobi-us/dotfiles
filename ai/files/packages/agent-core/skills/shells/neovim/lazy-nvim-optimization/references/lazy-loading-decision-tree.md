# Lazy-Loading Decision Tree

Step-by-step guide for choosing the right lazy-loading strategy for each plugin.

## Decision Flow

```
START: Need to add a plugin
  │
  ├─> Is it a colorscheme?
  │   └─> YES: Use priority = 1000, no lazy-loading
  │   └─> NO: Continue
  │
  ├─> Is it nvim-treesitter?
  │   └─> YES: Load at startup (needed for syntax immediately)
  │   └─> NO: Continue
  │
  ├─> Does it have user-facing commands?
  │   └─> YES: Use cmd = "CommandName"
  │   └─> NO: Continue
  │
  ├─> Is it accessed primarily via keymaps?
  │   └─> YES: Use keys = {...}
  │   └─> NO: Continue
  │
  ├─> Is it language/filetype specific?
  │   └─> YES: Use ft = "filetype"
  │   └─> NO: Continue
  │
  ├─> Is it only needed in insert mode?
  │   └─> YES: Use event = "InsertEnter"
  │   └─> NO: Continue
  │
  ├─> Does it enhance the UI but isn't critical?
  │   └─> YES: Use event = "VeryLazy"
  │   └─> NO: Continue
  │
  ├─> Is it only used as a dependency?
  │   └─> YES: Use lazy = true
  │   └─> NO: Continue
  │
  └─> Default: Use event = "VeryLazy" or reconsider if plugin is needed
```

## Plugin Categories with Recommendations

### Colorschemes
**Strategy:** `priority = 1000`
**Why:** Must load before other plugins for proper highlighting

```lua
return {
  "folke/tokyonight.nvim",
  priority = 1000,
  config = function()
    vim.cmd("colorscheme tokyonight")
  end,
}
```

### Syntax & Treesitter
**Strategy:** Load at startup
**Why:** Needed immediately for syntax highlighting

```lua
return {
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",
  config = function()
    require("nvim-treesitter.configs").setup({})
  end,
}
```

### LSP
**Strategy:** `ft` for specific languages OR `event = "BufReadPost"`
**Why:** Only needed for specific filetypes

**Option 1: By filetype**
```lua
return {
  "neovim/nvim-lspconfig",
  ft = { "lua", "python", "typescript" },
  config = function()
    -- LSP setup
  end,
}
```

**Option 2: On buffer read**
```lua
return {
  "neovim/nvim-lspconfig",
  event = "BufReadPost",
  config = function()
    -- LSP setup
  end,
}
```

### Completion
**Strategy:** `event = "InsertEnter"`
**Why:** Only needed in insert mode

```lua
return {
  "hrsh7th/nvim-cmp",
  event = "InsertEnter",
  config = function()
    require("cmp").setup({})
  end,
}
```

### File Explorers
**Strategy:** `cmd` and/or `keys`
**Why:** User explicitly opens them

```lua
return {
  "nvim-tree/nvim-tree.lua",
  cmd = { "NvimTreeToggle", "NvimTreeFocus" },
  keys = {
    { "<leader>e", "<cmd>NvimTreeToggle<cr>", desc = "Toggle file tree" },
  },
}
```

### Fuzzy Finders
**Strategy:** `cmd` and/or `keys`
**Why:** Accessed via commands or keymaps

```lua
return {
  "nvim-telescope/telescope.nvim",
  cmd = "Telescope",
  keys = {
    { "<leader>ff", "<cmd>Telescope find_files<cr>" },
    { "<leader>fg", "<cmd>Telescope live_grep<cr>" },
  },
}
```

### Git Interfaces (LazyGit, Neogit, Fugitive)
**Strategy:** `cmd` and/or `keys`
**Why:** Used on-demand

```lua
return {
  "kdheepak/lazygit.nvim",
  cmd = "LazyGit",
  keys = {
    { "<leader>gg", "<cmd>LazyGit<cr>", desc = "LazyGit" },
  },
}
```

### Git Decorations (Gitsigns)
**Strategy:** `event = "BufReadPost"`
**Why:** Needed when viewing files in Git repos

```lua
return {
  "lewis6991/gitsigns.nvim",
  event = "BufReadPost",
  config = function()
    require("gitsigns").setup({})
  end,
}
```

### Statusline/Tabline
**Strategy:** Load at startup OR `event = "VeryLazy"`
**Why:** Visible immediately, but can be deferred

**Option 1: Immediate**
```lua
return {
  "nvim-lualine/lualine.nvim",
  config = function()
    require("lualine").setup({})
  end,
}
```

**Option 2: Deferred (slight flicker)**
```lua
return {
  "nvim-lualine/lualine.nvim",
  event = "VeryLazy",
  config = function()
    require("lualine").setup({})
  end,
}
```

### Commenting Plugins
**Strategy:** `keys` (if using custom keymaps) OR load at startup
**Why:** Small plugins, often used

```lua
return {
  "numToStr/Comment.nvim",
  keys = {
    { "gcc", mode = "n", desc = "Comment toggle linewise" },
    { "gc", mode = { "n", "v" }, desc = "Comment toggle" },
  },
  config = function()
    require("Comment").setup({})
  end,
}
```

### Auto-Pairs
**Strategy:** `event = "InsertEnter"`
**Why:** Only needed in insert mode

```lua
return {
  "windwp/nvim-autopairs",
  event = "InsertEnter",
  config = function()
    require("nvim-autopairs").setup({})
  end,
}
```

### Surround Plugins
**Strategy:** `keys`
**Why:** Accessed via specific keymaps

```lua
return {
  "kylechui/nvim-surround",
  keys = { "ys", "ds", "cs" },
  config = function()
    require("nvim-surround").setup({})
  end,
}
```

### Debugging (DAP)
**Strategy:** `keys` OR `cmd`
**Why:** Used on-demand for debugging

```lua
return {
  "mfussenegger/nvim-dap",
  keys = {
    { "<leader>db", function() require("dap").toggle_breakpoint() end },
    { "<leader>dc", function() require("dap").continue() end },
  },
}
```

### Testing Frameworks
**Strategy:** `keys` OR `cmd`
**Why:** Run tests on-demand

```lua
return {
  "nvim-neotest/neotest",
  cmd = "Neotest",
  keys = {
    { "<leader>tn", function() require("neotest").run.run() end },
  },
}
```

### Terminal Integrations
**Strategy:** `cmd` and/or `keys`
**Why:** Opened on-demand

```lua
return {
  "akinsho/toggleterm.nvim",
  cmd = "ToggleTerm",
  keys = {
    { "<C-\\>", "<cmd>ToggleTerm<cr>", desc = "Toggle terminal" },
  },
}
```

### Markdown Preview
**Strategy:** `ft = "markdown"` and `cmd`
**Why:** Only for markdown files

```lua
return {
  "iamcco/markdown-preview.nvim",
  ft = "markdown",
  cmd = "MarkdownPreview",
  build = function()
    vim.fn["mkdp#util#install"]()
  end,
}
```

### Which-Key
**Strategy:** `event = "VeryLazy"` OR load at startup
**Why:** Shows keybindings, can be deferred

```lua
return {
  "folke/which-key.nvim",
  event = "VeryLazy",
  config = function()
    require("which-key").setup({})
  end,
}
```

### Todo Comments / Diagnostics UI
**Strategy:** `event = "VeryLazy"`
**Why:** Nice-to-have, not immediately critical

```lua
return {
  "folke/todo-comments.nvim",
  event = "VeryLazy",
  config = function()
    require("todo-comments").setup({})
  end,
}
```

### Session Management
**Strategy:** `event = "VeryLazy"`
**Why:** Restores after initial load

```lua
return {
  "rmagatti/auto-session",
  event = "VeryLazy",
  config = function()
    require("auto-session").setup({})
  end,
}
```

### Dependency-Only Plugins
**Strategy:** `lazy = true`
**Why:** Only loaded when required by other plugins

```lua
return {
  "nvim-lua/plenary.nvim",
  lazy = true,
}
```

## Combining Triggers

Some plugins benefit from multiple triggers:

```lua
return {
  "nvim-telescope/telescope.nvim",
  cmd = "Telescope",  -- Load on command
  keys = {            -- Also load on keymaps
    { "<leader>ff", "<cmd>Telescope find_files<cr>" },
    { "<leader>fg", "<cmd>Telescope live_grep<cr>" },
  },
}
```

**Benefits:**
- Multiple entry points
- Loads on whatever happens first
- Better user experience

## Special Cases

### Plugins with Build Steps

```lua
return {
  "nvim-telescope/telescope-fzf-native.nvim",
  build = "make",  -- Build after install
  lazy = true,     -- Only load when telescope loads it
}
```

### Conditional Loading

```lua
return {
  "iamcco/markdown-preview.nvim",
  ft = "markdown",
  cond = function()
    return vim.fn.executable("node") == 1  -- Only if Node.js installed
  end,
}
```

### Development Plugins

```lua
return {
  dir = "~/projects/my-plugin",  -- Local development
  lazy = false,                   -- Always load for testing
}
```

## Common Mistakes

### Mistake 1: Over-Lazy-Loading

**Problem:**
```lua
return {
  "nvim-lualine/lualine.nvim",
  cmd = "Lualine",  -- Lualine has no commands!
}
```

**Fix:** Load at startup or use `event = "VeryLazy"`

### Mistake 2: Loading Too Early

**Problem:**
```lua
return {
  "folke/todo-comments.nvim",
  -- No lazy-loading, loads at startup
}
```

**Fix:** Use `event = "VeryLazy"` to defer

### Mistake 3: Wrong Event

**Problem:**
```lua
return {
  "hrsh7th/nvim-cmp",
  event = "BufReadPost",  -- Loads even in normal mode
}
```

**Fix:** Use `event = "InsertEnter"` for completion

### Mistake 4: Lazy-Loading Colorscheme

**Problem:**
```lua
return {
  "folke/tokyonight.nvim",
  event = "VeryLazy",  -- Wrong! Highlights will be broken
}
```

**Fix:** Use `priority = 1000`, no lazy-loading

## Validation Checklist

After configuring a plugin, verify:

- [ ] Does it have the right trigger? (cmd, keys, ft, event)
- [ ] Will it load when needed?
- [ ] Is it not loading too early?
- [ ] Dependencies are properly lazy-loaded?
- [ ] Build steps run correctly?

## Testing Your Configuration

```vim
:Lazy profile  " Check what loads when
```

Verify:
1. Colorscheme loads first
2. Treesitter loads at startup
3. Other plugins load on triggers
4. Total startup < 50ms

## Quick Decision Table

| Plugin Type | Trigger | Example |
|-------------|---------|---------|
| Colorscheme | `priority = 1000` | tokyonight |
| Treesitter | Load at startup | nvim-treesitter |
| LSP | `ft` or `event = "BufReadPost"` | nvim-lspconfig |
| Completion | `event = "InsertEnter"` | nvim-cmp |
| File Explorer | `cmd` + `keys` | nvim-tree |
| Fuzzy Finder | `cmd` + `keys` | telescope |
| Git Interface | `cmd` + `keys` | lazygit |
| Git Decorations | `event = "BufReadPost"` | gitsigns |
| Statusline | Startup or `event = "VeryLazy"` | lualine |
| Auto-pairs | `event = "InsertEnter"` | nvim-autopairs |
| Commenting | `keys` or startup | Comment.nvim |
| Debugging | `keys` or `cmd` | nvim-dap |
| Terminal | `cmd` + `keys` | toggleterm |
| Markdown | `ft = "markdown"` | markdown-preview |
| UI Enhancement | `event = "VeryLazy"` | todo-comments |
| Dependency | `lazy = true` | plenary.nvim |

Use this decision tree to optimize every plugin in your configuration.
