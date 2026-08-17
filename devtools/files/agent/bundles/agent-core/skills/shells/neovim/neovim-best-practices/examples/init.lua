-- Minimal Neovim Configuration Example
-- This is a complete, working minimal config following modern best practices
-- ⚠️  NEOVIM-SPECIFIC: Uses vim.* globals, meant for ~/.config/nvim/init.lua

-- Set leader key first (before any keymaps)
vim.g.mapleader = " "
vim.g.maplocalleader = " "

-- Load configuration modules
require("username")

-- Example structure for lua/username/:
--
-- lua/username/
-- ├── init.lua          -- Loads all modules
-- ├── options.lua       -- Vim options
-- ├── keymaps.lua       -- Keymaps
-- ├── autocmds.lua      -- Autocommands
-- └── lazy.lua          -- Plugin manager setup
--
-- lua/plugins/          -- Individual plugin specs
-- ├── colorscheme.lua
-- ├── treesitter.lua
-- ├── lsp.lua
-- ├── cmp.lua
-- └── telescope.lua
