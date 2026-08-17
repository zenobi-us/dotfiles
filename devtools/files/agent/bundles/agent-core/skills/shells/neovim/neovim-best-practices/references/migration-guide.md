# Migrating from Vimscript to Lua

Guide for converting existing Vimscript Neovim configurations to modern Lua-based setups.

## Why Migrate to Lua?

**Benefits:**
- Better performance
- First-class Neovim integration
- Cleaner syntax for complex logic
- Better tooling and LSP support
- Active plugin ecosystem
- Future-proof (Vimscript maintenance minimal)

**When to migrate:**
- Starting fresh: Use Lua from day one
- Existing config: Gradual migration is fine
- Hybrid: Can mix Vim and Lua (but prefer all-Lua)

## Core Syntax Conversions

### Options (set commands)

**Vimscript:**
```vim
set number
set relativenumber
set expandtab
set shiftwidth=2
set tabstop=2
set noswapfile
```

**Lua:**
```lua
vim.opt.number = true
vim.opt.relativenumber = true
vim.opt.expandtab = true
vim.opt.shiftwidth = 2
vim.opt.tabstop = 2
vim.opt.swapfile = false
```

### Global Variables

**Vimscript:**
```vim
let g:mapleader = " "
let g:netrw_banner = 0
let g:loaded_perl_provider = 0
```

**Lua:**
```lua
vim.g.mapleader = " "
vim.g.netrw_banner = 0
vim.g.loaded_perl_provider = 0
```

### Keymaps

**Vimscript:**
```vim
nnoremap <leader>ff <cmd>Telescope find_files<cr>
nnoremap <silent> <leader>w :write<cr>
inoremap jk <Esc>
```

**Lua:**
```lua
vim.keymap.set("n", "<leader>ff", "<cmd>Telescope find_files<cr>", { desc = "Find files" })
vim.keymap.set("n", "<leader>w", "<cmd>write<cr>", { desc = "Save", silent = true })
vim.keymap.set("i", "jk", "<Esc>")
```

### Autocommands

**Vimscript:**
```vim
augroup highlight_yank
  autocmd!
  autocmd TextYankPost * silent! lua vim.highlight.on_yank()
augroup END

augroup format_on_save
  autocmd!
  autocmd BufWritePre *.lua lua vim.lsp.buf.format()
augroup END
```

**Lua:**
```lua
local highlight_group = vim.api.nvim_create_augroup("HighlightYank", { clear = true })

vim.api.nvim_create_autocmd("TextYankPost", {
  group = highlight_group,
  pattern = "*",
  callback = function()
    vim.highlight.on_yank()
  end,
  desc = "Highlight yanked text",
})

local format_group = vim.api.nvim_create_augroup("FormatOnSave", { clear = true })

vim.api.nvim_create_autocmd("BufWritePre", {
  group = format_group,
  pattern = "*.lua",
  callback = function()
    vim.lsp.buf.format()
  end,
  desc = "Format Lua files on save",
})
```

### Commands

**Vimscript:**
```vim
command! ReloadConfig source $MYVIMRC
command! -nargs=1 Search lua require('telescope.builtin').grep_string({ search = <q-args> })
```

**Lua:**
```lua
vim.api.nvim_create_user_command("ReloadConfig", function()
  vim.cmd("source $MYVIMRC")
end, { desc = "Reload configuration" })

vim.api.nvim_create_user_command("Search", function(opts)
  require("telescope.builtin").grep_string({ search = opts.args })
end, { nargs = 1, desc = "Search with Telescope" })
```

### Functions

**Vimscript:**
```vim
function! ToggleNumber()
  if &number
    set nonumber
  else
    set number
  endif
endfunction

nnoremap <leader>tn :call ToggleNumber()<cr>
```

**Lua:**
```lua
local function toggle_number()
  vim.opt.number = not vim.opt.number:get()
end

vim.keymap.set("n", "<leader>tn", toggle_number, { desc = "Toggle line numbers" })
```

## API Equivalents

### Common vim.cmd to Lua API

| Vimscript | Lua API |
|-----------|---------|
| `set number` | `vim.opt.number = true` |
| `let g:var = value` | `vim.g.var = value` |
| `nnoremap key cmd` | `vim.keymap.set("n", key, cmd)` |
| `autocmd Event * cmd` | `vim.api.nvim_create_autocmd("Event", {...})` |
| `command Cmd lua func()` | `vim.api.nvim_create_user_command("Cmd", func, {...})` |
| `highlight Group gui=bold` | `vim.api.nvim_set_hl(0, "Group", {bold=true})` |
| `echo "msg"` | `print("msg")` or `vim.notify("msg")` |

### vim.cmd Usage

For operations without direct Lua API:

```lua
-- Execute single Vim command
vim.cmd("colorscheme tokyonight")
vim.cmd("write")

-- Execute multiple commands
vim.cmd([[
  colorscheme tokyonight
  highlight Normal guibg=NONE
]])
```

## Plugin Migration

### Plugin Manager Migration

**From vim-plug:**
```vim
" ~/.config/nvim/init.vim
call plug#begin()
Plug 'neovim/nvim-lspconfig'
Plug 'hrsh7th/nvim-cmp'
Plug 'nvim-telescope/telescope.nvim'
call plug#end()
```

**To lazy.nvim:**
```lua
-- ~/.config/nvim/lua/<username>/lazy.lua
local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git", "clone", "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

require("lazy").setup("plugins")
```

**Plugin specs:**
```lua
-- ~/.config/nvim/lua/plugins/lsp.lua
return {
  "neovim/nvim-lspconfig",
  config = function()
    -- Configuration
  end,
}

-- ~/.config/nvim/lua/plugins/cmp.lua
return {
  "hrsh7th/nvim-cmp",
  dependencies = { "hrsh7th/cmp-nvim-lsp" },
  config = function()
    -- Configuration
  end,
}
```

### Plugin Configuration Migration

**Vimscript:**
```vim
let g:gruvbox_contrast_dark = 'hard'
colorscheme gruvbox

lua << EOF
require('telescope').setup({
  defaults = {
    file_ignore_patterns = {"node_modules"}
  }
})
EOF
```

**Lua:**
```lua
-- lua/plugins/colorscheme.lua
return {
  "ellisonleao/gruvbox.nvim",
  priority = 1000,
  config = function()
    require("gruvbox").setup({
      contrast = "hard",
    })
    vim.cmd("colorscheme gruvbox")
  end,
}

-- lua/plugins/telescope.lua
return {
  "nvim-telescope/telescope.nvim",
  config = function()
    require("telescope").setup({
      defaults = {
        file_ignore_patterns = { "node_modules" },
      },
    })
  end,
}
```

## File Structure Migration

### Before (init.vim)

```
~/.config/nvim/
├── init.vim       (500+ lines)
└── plugin/
    └── settings.vim
```

### After (Lua)

```
~/.config/nvim/
├── init.lua       (~10 lines)
└── lua/
    └── <username>/
        ├── init.lua
        ├── options.lua
        ├── keymaps.lua
        ├── autocmds.lua
        └── lazy.lua
```

## Migration Strategy

### Option 1: All at Once (Small Configs)

For configs < 200 lines:

1. Create new Lua structure
2. Convert sections one by one
3. Test each section
4. Switch to Lua config

### Option 2: Gradual (Large Configs)

For configs > 200 lines:

1. Rename `init.vim` to `init.lua`
2. Wrap Vimscript in `vim.cmd([[...]])`
3. Convert small sections to Lua
4. Test incrementally
5. Eventually remove all Vimscript

**Hybrid approach:**
```lua
-- init.lua
-- Lua configuration
vim.opt.number = true
require("config.keymaps")

-- Keep Vimscript temporarily
vim.cmd([[
  " Old Vimscript config
  set expandtab
  nnoremap <leader>q :quit<cr>
]])

-- More Lua
require("config.plugins")
```

### Option 3: Fresh Start (Recommended)

Best for learning modern patterns:

1. Backup old config
2. Start with minimal Lua config
3. Add features incrementally
4. Reference old config as needed

**Minimal starting point:**
```lua
-- init.lua
vim.g.mapleader = " "
require("config")
```

```lua
-- lua/config/init.lua
require("config.options")
require("config.keymaps")
require("config.lazy")
```

## Common Patterns

### Conditional Logic

**Vimscript:**
```vim
if has('nvim-0.10')
  set smoothscroll
endif

if executable('rg')
  set grepprg=rg\ --vimgrep
endif
```

**Lua:**
```lua
if vim.fn.has("nvim-0.10") == 1 then
  vim.opt.smoothscroll = true
end

if vim.fn.executable("rg") == 1 then
  vim.opt.grepprg = "rg --vimgrep"
end
```

### Loops

**Vimscript:**
```vim
for file in split(glob('~/.config/nvim/plugin/*.vim'), '\n')
  execute 'source' file
endfor
```

**Lua:**
```lua
local plugin_files = vim.fn.glob(vim.fn.stdpath("config") .. "/plugin/*.lua", true, true)
for _, file in ipairs(plugin_files) do
  dofile(file)
end
```

### Tables/Lists

**Vimscript:**
```vim
let s:langs = ['python', 'lua', 'rust']
for lang in s:langs
  echo lang
endfor
```

**Lua:**
```lua
local langs = { "python", "lua", "rust" }
for _, lang in ipairs(langs) do
  print(lang)
end
```

## Troubleshooting Migration

### Common Issues

**Issue: "module not found"**
```
Error: module 'config' not found
```
**Fix:** Check file location matches require path:
```lua
require("config")  -- Looks for lua/config/init.lua or lua/config.lua
```

**Issue: Options not applying**
```lua
-- Wrong
vim.o.number = true    -- Only sets global or window-local

-- Right
vim.opt.number = true  -- Smarter, handles all cases
```

**Issue: Keymaps not working**
```lua
-- Wrong (deprecated)
vim.api.nvim_set_keymap("n", "key", "cmd", {})

-- Right
vim.keymap.set("n", "key", "cmd", {})
```

### Testing Configuration

**Test incrementally:**
```bash
# Test with minimal config
nvim -u ~/.config/nvim/lua/config/options.lua

# Test specific file
nvim --cmd "luafile ~/.config/nvim/lua/config/keymaps.lua"
```

**Check for errors:**
```vim
:messages    " See error messages
:checkhealth " Check overall health
```

## Migration Checklist

**Pre-migration:**
- [ ] Backup current config
- [ ] Document custom functions/commands
- [ ] List all plugins used
- [ ] Note any Vimscript-only plugins

**File structure:**
- [ ] Create lua/<username>/ directory
- [ ] Create init.lua entry point
- [ ] Separate options, keymaps, autocmds

**Core config:**
- [ ] Migrate options to vim.opt
- [ ] Migrate keymaps to vim.keymap.set
- [ ] Migrate autocommands to nvim_create_autocmd
- [ ] Migrate functions to Lua functions
- [ ] Migrate commands to nvim_create_user_command

**Plugins:**
- [ ] Switch to lazy.nvim (or stay with packer)
- [ ] Create individual plugin files
- [ ] Migrate plugin configurations to Lua
- [ ] Replace Vimscript plugins with Lua alternatives

**Testing:**
- [ ] Test basic editing
- [ ] Test all keymaps
- [ ] Test plugin functionality
- [ ] Check startup time (should improve)
- [ ] Verify LSP working
- [ ] Check for error messages

**Cleanup:**
- [ ] Remove old init.vim
- [ ] Remove unused plugin/ directory
- [ ] Clean up Vimscript remnants
- [ ] Update dotfiles documentation

## Plugin Alternatives

Replace Vimscript plugins with modern Lua equivalents:

| Vimscript Plugin | Lua Alternative |
|-----------------|-----------------|
| vim-plug | lazy.nvim |
| nerdtree | nvim-tree.lua, oil.nvim |
| fzf.vim | telescope.nvim |
| vim-fugitive | neogit, lazygit.nvim |
| coc.nvim | nvim-lspconfig + nvim-cmp |
| vim-airline | lualine.nvim |
| vim-commentary | Comment.nvim |
| vim-surround | nvim-surround |
| vim-auto-save | Auto-save in autocmd |

## Learning Resources

**Official:**
- `:help lua-guide`
- `:help lua.txt`
- `:help vim.opt`
- `:help vim.keymap`

**Community:**
- kickstart.nvim (starter template)
- LazyVim (full distribution)
- NvChad (full distribution)
- Neovim Discourse

## Examples to Study

**Well-organized Lua configs:**
- kickstart.nvim (minimal, educational)
- LunarVim (extensive, well-documented)
- AstroNvim (modular structure)

Clone and study structure:
```bash
git clone https://github.com/nvim-lua/kickstart.nvim.git ~/reference/kickstart
```

## Next Steps After Migration

1. **Optimize:** Review lazy-loading of plugins
2. **Clean:** Remove unused plugins and configs
3. **Document:** Add comments for complex sections
4. **Share:** Publish config for others to learn
5. **Maintain:** Keep dependencies updated with lazy.nvim

Your Lua config should be cleaner, faster, and easier to maintain than Vimscript!
