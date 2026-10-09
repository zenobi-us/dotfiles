-- Optimized lazy.nvim Configuration Example
-- Target startup time: < 50ms
-- This demonstrates best practices for lazy-loading

-- This file goes in: lua/plugins/optimized-example.lua

return {
  -- 1. COLORSCHEME (Priority loading)
  {
    "folke/tokyonight.nvim",
    priority = 1000,  -- Load first
    config = function()
      vim.cmd("colorscheme tokyonight")
    end,
  },

  -- 2. TREESITTER (Load at startup for syntax)
  {
    "nvim-treesitter/nvim-treesitter",
    build = ":TSUpdate",
    config = function()
      require("nvim-treesitter.configs").setup({
        ensure_installed = { "lua", "vim", "vimdoc", "typescript", "python" },
        highlight = { enable = true },
        indent = { enable = true },
      })
    end,
  },

  -- 3. LSP (Lazy-load by filetype)
  {
    "neovim/nvim-lspconfig",
    ft = { "lua", "python", "typescript", "javascript", "rust" },
    dependencies = {
      "williamboman/mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      "hrsh7th/cmp-nvim-lsp",
    },
    config = function()
      require("mason").setup({})
      require("mason-lspconfig").setup({
        ensure_installed = { "lua_ls", "pyright", "tsserver", "rust_analyzer" },
      })

      local capabilities = require("cmp_nvim_lsp").default_capabilities()
      local lspconfig = require("lspconfig")

      lspconfig.lua_ls.setup({ capabilities = capabilities })
      lspconfig.pyright.setup({ capabilities = capabilities })
      lspconfig.tsserver.setup({ capabilities = capabilities })
      lspconfig.rust_analyzer.setup({ capabilities = capabilities })
    end,
  },

  -- 4. COMPLETION (Load on insert mode)
  {
    "hrsh7th/nvim-cmp",
    event = "InsertEnter",
    dependencies = {
      "hrsh7th/cmp-nvim-lsp",
      "hrsh7th/cmp-buffer",
      "hrsh7th/cmp-path",
      "L3MON4D3/LuaSnip",
      "saadparwaiz1/cmp_luasnip",
    },
    config = function()
      local cmp = require("cmp")
      cmp.setup({
        snippet = {
          expand = function(args)
            require("luasnip").lsp_expand(args.body)
          end,
        },
        mapping = cmp.mapping.preset.insert({
          ["<C-Space>"] = cmp.mapping.complete(),
          ["<CR>"] = cmp.mapping.confirm({ select = true }),
        }),
        sources = {
          { name = "nvim_lsp" },
          { name = "luasnip" },
          { name = "buffer" },
          { name = "path" },
        },
      })
    end,
  },

  -- 5. TELESCOPE (Lazy-load on command and keys)
  {
    "nvim-telescope/telescope.nvim",
    cmd = "Telescope",
    keys = {
      { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find files" },
      { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Live grep" },
      { "<leader>fb", "<cmd>Telescope buffers<cr>", desc = "Buffers" },
      { "<leader>fh", "<cmd>Telescope help_tags<cr>", desc = "Help tags" },
    },
    dependencies = {
      "nvim-lua/plenary.nvim",
      {
        "nvim-telescope/telescope-fzf-native.nvim",
        build = "make",
      },
    },
    config = function()
      local telescope = require("telescope")
      telescope.setup({
        defaults = {
          file_ignore_patterns = { "node_modules", ".git/" },
        },
      })
      telescope.load_extension("fzf")
    end,
  },

  -- 6. FILE EXPLORER (Lazy-load on command and keys)
  {
    "stevearc/oil.nvim",
    cmd = "Oil",
    keys = {
      { "<leader>e", "<cmd>Oil<cr>", desc = "File explorer" },
    },
    config = function()
      require("oil").setup({})
    end,
  },

  -- 7. GIT DECORATIONS (Load when opening file)
  {
    "lewis6991/gitsigns.nvim",
    event = "BufReadPost",
    config = function()
      require("gitsigns").setup({})
    end,
  },

  -- 8. GIT INTERFACE (Lazy-load on command)
  {
    "kdheepak/lazygit.nvim",
    cmd = "LazyGit",
    keys = {
      { "<leader>gg", "<cmd>LazyGit<cr>", desc = "LazyGit" },
    },
  },

  -- 9. STATUSLINE (Load at startup - small plugin)
  {
    "nvim-lualine/lualine.nvim",
    config = function()
      require("lualine").setup({
        options = {
          theme = "tokyonight",
        },
      })
    end,
  },

  -- 10. AUTO-PAIRS (Load on insert mode)
  {
    "windwp/nvim-autopairs",
    event = "InsertEnter",
    config = function()
      require("nvim-autopairs").setup({})
    end,
  },

  -- 11. COMMENTING (Lazy-load on keys)
  {
    "numToStr/Comment.nvim",
    keys = {
      { "gcc", mode = "n", desc = "Comment toggle linewise" },
      { "gc", mode = { "n", "v" }, desc = "Comment toggle" },
      { "gbc", mode = "n", desc = "Comment toggle blockwise" },
      { "gb", mode = { "n", "v" }, desc = "Comment toggle blockwise" },
    },
    config = function()
      require("Comment").setup({})
    end,
  },

  -- 12. SURROUND (Lazy-load on keys)
  {
    "kylechui/nvim-surround",
    keys = { "ys", "ds", "cs" },
    config = function()
      require("nvim-surround").setup({})
    end,
  },

  -- 13. WHICH-KEY (Defer after startup)
  {
    "folke/which-key.nvim",
    event = "VeryLazy",
    config = function()
      require("which-key").setup({})
    end,
  },

  -- 14. TODO COMMENTS (Defer after startup)
  {
    "folke/todo-comments.nvim",
    event = "VeryLazy",
    dependencies = { "nvim-lua/plenary.nvim" },
    config = function()
      require("todo-comments").setup({})
    end,
  },

  -- 15. TROUBLE (Diagnostics UI - Lazy-load on command)
  {
    "folke/trouble.nvim",
    cmd = { "Trouble", "TroubleToggle" },
    keys = {
      { "<leader>xx", "<cmd>TroubleToggle<cr>", desc = "Toggle trouble" },
      { "<leader>xw", "<cmd>Trouble workspace_diagnostics<cr>", desc = "Workspace diagnostics" },
    },
    config = function()
      require("trouble").setup({})
    end,
  },

  -- 16. TERMINAL (Lazy-load on keys)
  {
    "akinsho/toggleterm.nvim",
    cmd = "ToggleTerm",
    keys = {
      { "<C-\\>", "<cmd>ToggleTerm<cr>", desc = "Toggle terminal" },
    },
    config = function()
      require("toggleterm").setup({})
    end,
  },

  -- 17. MARKDOWN PREVIEW (Filetype-specific)
  {
    "iamcco/markdown-preview.nvim",
    ft = "markdown",
    cmd = "MarkdownPreview",
    build = function()
      vim.fn["mkdp#util#install"]()
    end,
  },

  -- 18. HARPOON (Lazy-load on keys)
  {
    "ThePrimeagen/harpoon",
    keys = {
      { "<leader>ha", function() require("harpoon.mark").add_file() end, desc = "Harpoon add" },
      { "<leader>hm", function() require("harpoon.ui").toggle_quick_menu() end, desc = "Harpoon menu" },
    },
    config = function()
      require("harpoon").setup({})
    end,
  },

  -- 19. DIFFVIEW (Git diffs - Lazy-load on command)
  {
    "sindrets/diffview.nvim",
    cmd = { "DiffviewOpen", "DiffviewFileHistory" },
    config = function()
      require("diffview").setup({})
    end,
  },

  -- 20. COPILOT (Load on insert mode if using AI)
  {
    "zbirenbaum/copilot.lua",
    event = "InsertEnter",
    enabled = false,  -- Enable if you have Copilot subscription
    config = function()
      require("copilot").setup({
        suggestion = { enabled = true },
        panel = { enabled = true },
      })
    end,
  },

  -- DEPENDENCIES (lazy = true, loaded automatically)
  {
    "nvim-lua/plenary.nvim",
    lazy = true,
  },
}

-- EXPECTED STARTUP TIME: 25-45ms
-- Key optimizations:
--   - Colorscheme loads first (priority 1000)
--   - Only treesitter and statusline load at startup
--   - LSP lazy-loads by filetype
--   - Completion lazy-loads on InsertEnter
--   - File explorer, telescope lazy-load on cmd/keys
--   - Git interface lazy-loads on cmd
--   - UI enhancements deferred (VeryLazy)
--   - All other tools lazy-load appropriately

-- VERIFICATION:
-- 1. Run: nvim --startuptime startup.log -c 'qa!'
-- 2. Check: tail -1 startup.log (should be < 50ms)
-- 3. Run: :Lazy profile
-- 4. Verify: Most plugins show "cmd", "keys", "ft", or "event" as reason
