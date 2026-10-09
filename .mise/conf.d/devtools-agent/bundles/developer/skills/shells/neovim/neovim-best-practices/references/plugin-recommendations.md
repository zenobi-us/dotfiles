# Plugin Recommendations by Category

Curated list of recommended plugins for modern Neovim configurations. All plugins are actively maintained, performant, and follow best practices.

## Plugin Manager

### lazy.nvim
**URL:** https://github.com/folke/lazy.nvim
**Why:** Modern, fast, lazy-loading, lockfile support, excellent UI
**Alternatives:** packer.nvim (less active), vim-plug (Vimscript)

## LSP & Completion

### nvim-lspconfig
**URL:** https://github.com/neovim/nvim-lspconfig
**Why:** Official LSP configs, community-maintained, comprehensive
**Essential:** Yes

### mason.nvim
**URL:** https://github.com/williamboman/mason.nvim
**Why:** Install LSP servers, DAPs, linters, formatters easily
**Companion:** mason-lspconfig.nvim for integration

### nvim-cmp
**URL:** https://github.com/hrsh7th/nvim-cmp
**Why:** Most popular completion engine, extensible, fast
**Sources needed:**
- cmp-nvim-lsp (LSP completions)
- cmp-buffer (buffer words)
- cmp-path (file paths)
- cmp-cmdline (command-line)

**Alternatives:** coq_nvim (faster, less customizable)

### LuaSnip
**URL:** https://github.com/L3MON4D3/LuaSnip
**Why:** Lua-based snippets, powerful, integrates with cmp
**Companion:** cmp_luasnip for nvim-cmp integration
**Alternatives:** vim-vsnip, snippy.nvim

## Syntax & Treesitter

### nvim-treesitter
**URL:** https://github.com/nvim-treesitter/nvim-treesitter
**Why:** Modern syntax highlighting, indentation, text objects
**Essential:** Yes
**Recommended modules:**
- highlight
- indent
- incremental_selection

### nvim-treesitter-textobjects
**URL:** https://github.com/nvim-treesitter/nvim-treesitter-textobjects
**Why:** Custom text objects (function, class, etc.)
**Usage:** Select functions with `vaf`, classes with `vac`

## File Navigation

### telescope.nvim
**URL:** https://github.com/nvim-telescope/telescope.nvim
**Why:** Most popular fuzzy finder, extensible, excellent UX
**Extensions:**
- telescope-fzf-native.nvim (faster sorting)
- telescope-file-browser.nvim (file browser)
- telescope-project.nvim (project management)

**Alternatives:** fzf-lua (faster, less features)

### oil.nvim
**URL:** https://github.com/stevearc/oil.nvim
**Why:** Edit filesystem like a buffer, modern, intuitive
**Philosophy:** File management through editing
**Alternatives:** nvim-tree.lua (traditional tree), neo-tree.nvim (feature-rich)

### harpoon
**URL:** https://github.com/ThePrimeagen/harpoon
**Why:** Quick navigation to marked files, workflow optimization
**Use case:** Navigating between frequently-used files

## Git Integration

### gitsigns.nvim
**URL:** https://github.com/lewis6991/gitsigns.nvim
**Why:** Git decorations in sign column, hunk operations, blame
**Essential:** Yes for Git users

### lazygit.nvim
**URL:** https://github.com/kdheepak/lazygit.nvim
**Why:** TUI for lazygit within Neovim, excellent UX
**Requires:** lazygit installed
**Alternatives:** fugitive.vim (Vimscript, powerful), neogit (Lua)

### diffview.nvim
**URL:** https://github.com/sindrets/diffview.nvim
**Why:** Git diff viewer, PR reviews, merge conflicts
**Use case:** Reviewing changes, comparing branches

## UI Enhancements

### lualine.nvim
**URL:** https://github.com/nvim-lualine/lualine.nvim
**Why:** Fast statusline, customizable, many themes
**Alternatives:** feline.nvim (more customizable)

### bufferline.nvim
**URL:** https://github.com/akinsho/bufferline.nvim
**Why:** Buffer/tab line with mouse support, diagnostics
**Alternatives:** barbar.nvim

### indent-blankline.nvim
**URL:** https://github.com/lukas-reineke/indent-blankline.nvim
**Why:** Indent guides, scope highlighting
**Note:** v3 is major rewrite, check docs

### noice.nvim
**URL:** https://github.com/folke/noice.nvim
**Why:** Modern UI for messages, cmdline, popupmenu
**Note:** Experimental, changes core UX
**Dependencies:** nui.nvim, nvim-notify

## Color Schemes

### Modern Themes

**tokyonight.nvim**
- URL: https://github.com/folke/tokyonight.nvim
- Style: Dark, vibrant, excellent Treesitter support

**catppuccin**
- URL: https://github.com/catppuccin/nvim
- Style: Pastel, 4 flavors (Latte, Frappé, Macchiato, Mocha)

**kanagawa.nvim**
- URL: https://github.com/rebelot/kanagawa.nvim
- Style: Dark, inspired by Kanagawa artwork

**rose-pine**
- URL: https://github.com/rose-pine/neovim
- Style: Low-contrast, 3 variants

**gruvbox.nvim**
- URL: https://github.com/ellisonleao/gruvbox.nvim
- Style: Retro, warm, Lua port of original

## Editing Experience

### nvim-autopairs
**URL:** https://github.com/windwp/nvim-autopairs
**Why:** Auto-close brackets, quotes, integrates with cmp
**Essential:** Yes

### Comment.nvim
**URL:** https://github.com/numToStr/Comment.nvim
**Why:** Easy commenting, supports treesitter, multiple filetypes
**Note:** Neovim 0.10+ has built-in commenting
**Treesitter integration:** ts_context_commentstring

### nvim-surround
**URL:** https://github.com/kylechui/nvim-surround
**Why:** Surround text with brackets, quotes, tags
**Usage:** `ysiw"` to surround word with quotes

### mini.nvim
**URL:** https://github.com/echasnovski/mini.nvim
**Why:** Collection of minimal, independent modules
**Popular modules:**
- mini.ai (better text objects)
- mini.align (align text)
- mini.surround (surround alternative)
- mini.pairs (autopairs alternative)

**Philosophy:** Use individual modules instead of large plugins

## Search & Replace

### nvim-spectre
**URL:** https://github.com/nvim-pack/nvim-spectre
**Why:** Search and replace panel, preview changes
**Use case:** Project-wide find and replace

### inc-rename.nvim
**URL:** https://github.com/smjonas/inc-rename.nvim
**Why:** LSP rename with live preview
**Requires:** LSP server support

## Terminal Integration

### toggleterm.nvim
**URL:** https://github.com/akinsho/toggleterm.nvim
**Why:** Manage terminals, persistent terminal sessions
**Features:** Multiple terminals, custom commands

## Markdown & Writing

### markdown-preview.nvim
**URL:** https://github.com/iamcco/markdown-preview.nvim
**Why:** Live markdown preview in browser
**Build required:** Yes

### obsidian.nvim
**URL:** https://github.com/epwalsh/obsidian.nvim
**Why:** Obsidian vault integration, note-taking
**Use case:** Personal knowledge management

### render-markdown.nvim
**URL:** https://github.com/MeanderingProgrammer/render-markdown.nvim
**Why:** Render markdown in Neovim buffer
**Alternative to:** markdown-preview for in-buffer rendering

## Debugging

### nvim-dap
**URL:** https://github.com/mfussenegger/nvim-dap
**Why:** Debug Adapter Protocol client
**Essential:** For debugging

### nvim-dap-ui
**URL:** https://github.com/rcarriga/nvim-dap-ui
**Why:** UI for nvim-dap, makes debugging easier
**Companion:** nvim-dap

### nvim-dap-virtual-text
**URL:** https://github.com/theHamsta/nvim-dap-virtual-text
**Why:** Show variable values as virtual text during debugging

## Testing

### neotest
**URL:** https://github.com/nvim-neotest/neotest
**Why:** Testing framework, supports multiple test adapters
**Adapters:**
- neotest-python
- neotest-jest
- neotest-go
- neotest-rust

## Session Management

### auto-session
**URL:** https://github.com/rmagatti/auto-session
**Why:** Automatic session management, restore on startup
**Alternative:** persistence.nvim

## Productivity

### which-key.nvim
**URL:** https://github.com/folke/which-key.nvim
**Why:** Shows available keybindings in popup
**Essential:** Yes for discoverability

### todo-comments.nvim
**URL:** https://github.com/folke/todo-comments.nvim
**Why:** Highlight TODO, FIXME, etc., telescope integration
**Requires:** Treesitter

### trouble.nvim
**URL:** https://github.com/folke/trouble.nvim
**Why:** Pretty list for diagnostics, quickfix, LSP
**Use case:** Better diagnostics UI

## GitHub Integration

### octo.nvim
**URL:** https://github.com/pwntester/octo.nvim
**Why:** Manage GitHub issues and PRs from Neovim
**Requires:** gh CLI

### gh.nvim (alternative)
**URL:** https://github.com/ldelossa/gh.nvim
**Why:** Litee-based GitHub integration
**Philosophy:** Different UX from octo

## AI & Copilot

### copilot.lua
**URL:** https://github.com/zbirenbaum/copilot.lua
**Why:** Lua implementation of GitHub Copilot
**Requires:** GitHub Copilot subscription

### copilot-cmp
**URL:** https://github.com/zbirenbaum/copilot-cmp
**Why:** Copilot source for nvim-cmp
**Companion:** copilot.lua

### ChatGPT.nvim
**URL:** https://github.com/jackMort/ChatGPT.nvim
**Why:** ChatGPT integration
**Requires:** OpenAI API key

## Performance & Monitoring

### vim-startuptime
**URL:** https://github.com/dstein64/vim-startuptime
**Why:** Visualize startup time, identify slow plugins
**Usage:** `:StartupTime`

## Plugin Combinations

### Minimal Setup (5-10 plugins)
- lazy.nvim (plugin manager)
- nvim-treesitter (syntax)
- nvim-lspconfig + mason.nvim (LSP)
- nvim-cmp (completion)
- telescope.nvim (fuzzy finder)
- gitsigns.nvim (git)
- which-key.nvim (keybindings)
- Colorscheme of choice

### Balanced Setup (15-25 plugins)
Minimal + these additions:
- oil.nvim or nvim-tree (file explorer)
- lualine.nvim (statusline)
- nvim-autopairs (auto-pairs)
- Comment.nvim (commenting)
- lazygit.nvim or fugitive (git interface)
- todo-comments.nvim (productivity)
- trouble.nvim (diagnostics)
- harpoon (navigation)

### Full-Featured Setup (30-50 plugins)
Balanced + specialized tools:
- nvim-dap + nvim-dap-ui (debugging)
- neotest (testing)
- nvim-surround (text editing)
- toggleterm.nvim (terminal)
- octo.nvim (GitHub)
- copilot.lua (AI)
- noice.nvim (UI)
- diffview.nvim (git diffs)
- markdown-preview.nvim (markdown)

## Plugin Evaluation Checklist

When considering a plugin, evaluate:

**Maintenance:**
- [ ] Updated in last 6 months
- [ ] Active issue resolution
- [ ] Compatible with latest Neovim

**Quality:**
- [ ] Good documentation
- [ ] Reasonable issue count
- [ ] Active community discussions

**Performance:**
- [ ] Lazy-loadable
- [ ] No significant startup impact
- [ ] Minimal dependencies

**Integration:**
- [ ] Works with your existing plugins
- [ ] Follows Neovim conventions
- [ ] Uses Lua API

**Alternatives:**
- [ ] Compared with alternatives
- [ ] Best fit for your workflow
- [ ] Not duplicating built-in features

## Red Flags

Avoid plugins that:
- Haven't been updated in 2+ years
- Have many unresolved critical issues
- Require complex external dependencies
- Have poor or no documentation
- Duplicate Neovim 0.10+ built-in features
- Have very low adoption (< 100 stars, unless very new)

## Staying Current

**Check these resources:**
- r/neovim subreddit
- awesome-neovim (GitHub)
- This Week in Neovim
- Neovim discourse
- Plugin author announcements

**Update strategy:**
- Review lazy-lock.json monthly
- Test updates on non-critical branch first
- Read changelogs for breaking changes
- Keep lockfile in version control
