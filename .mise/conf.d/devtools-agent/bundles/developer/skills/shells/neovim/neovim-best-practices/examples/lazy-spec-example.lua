-- Lazy.nvim Plugin Specification Examples
-- Demonstrates various lazy-loading patterns and configurations
--
-- ⚠️  DOCUMENTATION FILE - NOT MEANT TO BE SOURCED
-- This file contains 20 separate plugin examples for reference.
-- Each example starts with "return {" and is independent.
-- Copy individual examples to your plugin files, don't source this file directly.

-- Example 1: Basic plugin with configuration
return {
  "plugin/name",
  config = function()
    require("plugin").setup({
      -- Configuration options
    })
  end,
}

-- Example 2: Lazy-load on command
return {
  "nvim-telescope/telescope.nvim",
  cmd = "Telescope",  -- Load when :Telescope command is used
  dependencies = { "nvim-lua/plenary.nvim" },
  config = function()
    require("telescope").setup({})
  end,
}

-- Example 3: Lazy-load on keymap
return {
  "nvim-telescope/telescope.nvim",
  keys = {
    { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find files" },
    { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Live grep" },
  },
  config = function()
    require("telescope").setup({})
  end,
}

-- Example 4: Lazy-load on filetype
return {
  "rust-lang/rust.vim",
  ft = { "rust" },  -- Load only for Rust files
}

-- Example 5: Lazy-load on event
return {
  "lewis6991/gitsigns.nvim",
  event = "BufReadPost",  -- Load after opening a buffer
  config = function()
    require("gitsigns").setup({})
  end,
}

-- Example 6: Multiple lazy-load triggers
return {
  "nvim-tree/nvim-tree.lua",
  cmd = { "NvimTreeToggle", "NvimTreeFocus" },
  keys = {
    { "<leader>e", "<cmd>NvimTreeToggle<cr>", desc = "Toggle file tree" },
  },
  config = function()
    require("nvim-tree").setup({})
  end,
}

-- Example 7: Colorscheme (priority loading)
return {
  "folke/tokyonight.nvim",
  priority = 1000,  -- Load before other plugins
  config = function()
    vim.cmd("colorscheme tokyonight")
  end,
}

-- Example 8: Plugin with optional dependency
return {
  "hrsh7th/nvim-cmp",
  dependencies = {
    "hrsh7th/cmp-nvim-lsp",
    "hrsh7th/cmp-buffer",
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
      },
    })
  end,
}

-- Example 9: Build step for plugin
return {
  "nvim-treesitter/nvim-treesitter",
  build = ":TSUpdate",  -- Run after install/update
  config = function()
    require("nvim-treesitter.configs").setup({
      ensure_installed = { "lua", "vim", "vimdoc", "typescript", "python" },
      highlight = { enable = true },
      indent = { enable = true },
    })
  end,
}

-- Example 10: Defer loading (load when all plugins done)
return {
  "rcarriga/nvim-notify",
  event = "VeryLazy",  -- Load after startup
  config = function()
    vim.notify = require("notify")
  end,
}

-- Example 11: Conditional loading
return {
  "folke/which-key.nvim",
  event = "VeryLazy",
  cond = function()
    -- Only load if not in VSCode
    return vim.g.vscode == nil
  end,
  config = function()
    require("which-key").setup({})
  end,
}

-- Example 12: Setup function with options
return {
  "williamboman/mason.nvim",
  config = function()
    require("mason").setup({
      ui = {
        border = "rounded",
        icons = {
          package_installed = "✓",
          package_pending = "➜",
          package_uninstalled = "✗",
        },
      },
    })
  end,
}

-- Example 13: Plugin that needs init (runs before loading)
return {
  "folke/noice.nvim",
  event = "VeryLazy",
  init = function()
    -- Runs before plugin loads
    vim.o.cmdheight = 0
  end,
  dependencies = {
    "MunifTanjim/nui.nvim",
    "rcarriga/nvim-notify",
  },
  config = function()
    require("noice").setup({})
  end,
}

-- Example 14: Development plugin (local path)
return {
  dir = "~/projects/my-plugin",  -- Local development
  config = function()
    require("my-plugin").setup({})
  end,
}

-- Example 15: Disabled plugin (keep config, don't load)
return {
  "plugin/name",
  enabled = false,  -- Temporarily disabled
  config = function()
    -- Config preserved for when re-enabled
  end,
}

-- Example 16: LSP setup with Mason integration
return {
  "neovim/nvim-lspconfig",
  dependencies = {
    "williamboman/mason.nvim",
    "williamboman/mason-lspconfig.nvim",
    "hrsh7th/cmp-nvim-lsp",
  },
  config = function()
    -- Mason setup
    require("mason").setup({})
    require("mason-lspconfig").setup({
      ensure_installed = { "lua_ls", "tsserver", "pyright" },
      automatic_installation = true,
    })

    -- Capabilities
    local capabilities = require("cmp_nvim_lsp").default_capabilities()

    -- Setup servers
    local lspconfig = require("lspconfig")

    lspconfig.lua_ls.setup({ capabilities = capabilities })
    lspconfig.tsserver.setup({ capabilities = capabilities })
    lspconfig.pyright.setup({ capabilities = capabilities })
  end,
}

-- Example 17: Main telescope spec with extensions
return {
  "nvim-telescope/telescope.nvim",
  cmd = "Telescope",
  dependencies = {
    "nvim-lua/plenary.nvim",
    {
      "nvim-telescope/telescope-fzf-native.nvim",
      build = "make",
    },
  },
  keys = {
    { "<leader>ff", "<cmd>Telescope find_files<cr>", desc = "Find files" },
    { "<leader>fg", "<cmd>Telescope live_grep<cr>", desc = "Live grep" },
    { "<leader>fb", "<cmd>Telescope buffers<cr>", desc = "Buffers" },
    { "<leader>fh", "<cmd>Telescope help_tags<cr>", desc = "Help tags" },
  },
  config = function()
    local telescope = require("telescope")

    telescope.setup({
      defaults = {
        mappings = {
          i = {
            ["<C-j>"] = "move_selection_next",
            ["<C-k>"] = "move_selection_previous",
          },
        },
        file_ignore_patterns = { "node_modules", ".git/" },
      },
    })

    -- Load extensions
    telescope.load_extension("fzf")
  end,
}

-- Example 18: Plugin loaded by another plugin
return {
  "nvim-lua/plenary.nvim",
  lazy = true,  -- Only loaded when required by another plugin
}

-- Example 19: Version pinning
return {
  "plugin/name",
  version = "^1.0",  -- Semantic versioning
  -- or
  commit = "abc123",  -- Specific commit
  -- or
  tag = "v1.2.3",     -- Specific tag
}

-- Example 20: Complete LSP + Completion setup
return {
  {
    -- LSP config
    "neovim/nvim-lspconfig",
    dependencies = {
      "williamboman/mason.nvim",
      "williamboman/mason-lspconfig.nvim",
      "hrsh7th/cmp-nvim-lsp",
    },
    config = function()
      local capabilities = require("cmp_nvim_lsp").default_capabilities()
      require("lspconfig").lua_ls.setup({ capabilities = capabilities })
    end,
  },
  {
    -- Completion
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
        sources = {
          { name = "nvim_lsp" },
          { name = "luasnip" },
          { name = "buffer" },
          { name = "path" },
        },
      })
    end,
  },
}
