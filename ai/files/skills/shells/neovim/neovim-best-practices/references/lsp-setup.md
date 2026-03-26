# Comprehensive LSP Setup Guide

Complete guide for configuring Language Server Protocol (LSP) in Neovim, covering installation, configuration, and optimization.

## Architecture Overview

Neovim's LSP client communicates with language servers to provide IDE features:

```
┌──────────────┐
│  Neovim LSP  │  (Built-in client)
│    Client    │
└──────┬───────┘
       │ LSP Protocol
       │
┌──────▼───────┐
│   Language   │  (External processes)
│   Servers    │  - lua_ls, tsserver, pyright, etc.
└──────────────┘
```

**Key components:**
1. **LSP Client** - Built into Neovim
2. **nvim-lspconfig** - Pre-made server configurations
3. **Mason** - Server installation manager
4. **Completion** - nvim-cmp integration

## Basic Setup

### 1. Install Required Plugins

```lua
-- lua/plugins/lsp.lua
return {
  "neovim/nvim-lspconfig",
  dependencies = {
    "williamboman/mason.nvim",
    "williamboman/mason-lspconfig.nvim",
    "hrsh7th/cmp-nvim-lsp",  -- LSP completion source
  },
  config = function()
    -- Setup code here
  end,
}
```

### 2. Mason Setup

Mason installs and manages language servers:

```lua
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

require("mason-lspconfig").setup({
  ensure_installed = {
    "lua_ls",      -- Lua
    "tsserver",    -- TypeScript/JavaScript
    "pyright",     -- Python
    "rust_analyzer", -- Rust
    "gopls",       -- Go
  },
  automatic_installation = true,
})
```

### 3. Server Configuration

Configure each language server:

```lua
local lspconfig = require("lspconfig")
local capabilities = require("cmp_nvim_lsp").default_capabilities()

-- Lua
lspconfig.lua_ls.setup({
  capabilities = capabilities,
  settings = {
    Lua = {
      diagnostics = {
        globals = { "vim" },  -- Recognize vim global
      },
      workspace = {
        library = vim.api.nvim_get_runtime_file("", true),
      },
    },
  },
})

-- TypeScript/JavaScript
lspconfig.tsserver.setup({
  capabilities = capabilities,
})

-- Python
lspconfig.pyright.setup({
  capabilities = capabilities,
})
```

## On-Attach Configuration

The on_attach function runs when LSP attaches to a buffer:

```lua
local on_attach = function(client, bufnr)
  -- Enable completion
  vim.api.nvim_buf_set_option(bufnr, "omnifunc", "v:lua.vim.lsp.omnifunc")

  -- Keybindings
  local opts = { buffer = bufnr, silent = true }

  -- Navigation
  vim.keymap.set("n", "gd", vim.lsp.buf.definition, vim.tbl_extend("force", opts, { desc = "Go to definition" }))
  vim.keymap.set("n", "gD", vim.lsp.buf.declaration, vim.tbl_extend("force", opts, { desc = "Go to declaration" }))
  vim.keymap.set("n", "gi", vim.lsp.buf.implementation, vim.tbl_extend("force", opts, { desc = "Go to implementation" }))
  vim.keymap.set("n", "gr", vim.lsp.buf.references, vim.tbl_extend("force", opts, { desc = "Show references" }))

  -- Information
  vim.keymap.set("n", "K", vim.lsp.buf.hover, vim.tbl_extend("force", opts, { desc = "Hover documentation" }))
  vim.keymap.set("n", "<C-k>", vim.lsp.buf.signature_help, vim.tbl_extend("force", opts, { desc = "Signature help" }))

  -- Actions
  vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, vim.tbl_extend("force", opts, { desc = "Code action" }))
  vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, vim.tbl_extend("force", opts, { desc = "Rename symbol" }))

  -- Formatting
  vim.keymap.set("n", "<leader>f", function()
    vim.lsp.buf.format({ async = true })
  end, vim.tbl_extend("force", opts, { desc = "Format buffer" }))

  -- Diagnostics
  vim.keymap.set("n", "[d", vim.diagnostic.goto_prev, vim.tbl_extend("force", opts, { desc = "Previous diagnostic" }))
  vim.keymap.set("n", "]d", vim.diagnostic.goto_next, vim.tbl_extend("force", opts, { desc = "Next diagnostic" }))
  vim.keymap.set("n", "<leader>e", vim.diagnostic.open_float, vim.tbl_extend("force", opts, { desc = "Show diagnostic" }))
end

-- Use in server setup
lspconfig.lua_ls.setup({
  on_attach = on_attach,
  capabilities = capabilities,
})
```

## Server-Specific Configurations

### Lua (lua_ls)

```lua
lspconfig.lua_ls.setup({
  on_attach = on_attach,
  capabilities = capabilities,
  settings = {
    Lua = {
      runtime = {
        version = "LuaJIT",
      },
      diagnostics = {
        globals = { "vim", "love" },  -- Add your globals
      },
      workspace = {
        library = vim.api.nvim_get_runtime_file("", true),
        checkThirdParty = false,
      },
      telemetry = {
        enable = false,
      },
    },
  },
})
```

### TypeScript/JavaScript (tsserver)

```lua
lspconfig.tsserver.setup({
  on_attach = function(client, bufnr)
    -- Disable tsserver formatting (use null-ls or conform.nvim instead)
    client.server_capabilities.documentFormattingProvider = false
    client.server_capabilities.documentRangeFormattingProvider = false

    on_attach(client, bufnr)
  end,
  capabilities = capabilities,
  settings = {
    typescript = {
      inlayHints = {
        includeInlayParameterNameHints = "all",
        includeInlayParameterNameHintsWhenArgumentMatchesName = false,
        includeInlayFunctionParameterTypeHints = true,
        includeInlayVariableTypeHints = true,
        includeInlayPropertyDeclarationTypeHints = true,
        includeInlayFunctionLikeReturnTypeHints = true,
        includeInlayEnumMemberValueHints = true,
      },
    },
  },
})
```

### Python (pyright)

```lua
lspconfig.pyright.setup({
  on_attach = on_attach,
  capabilities = capabilities,
  settings = {
    python = {
      analysis = {
        typeCheckingMode = "basic",  -- "off", "basic", "strict"
        diagnosticMode = "workspace",
        inlayHints = {
          variableTypes = true,
          functionReturnTypes = true,
        },
      },
    },
  },
})
```

### Rust (rust_analyzer)

```lua
lspconfig.rust_analyzer.setup({
  on_attach = on_attach,
  capabilities = capabilities,
  settings = {
    ["rust-analyzer"] = {
      checkOnSave = {
        command = "clippy",  -- Use clippy for checks
      },
      cargo = {
        allFeatures = true,
      },
      procMacro = {
        enable = true,
      },
    },
  },
})
```

### Go (gopls)

```lua
lspconfig.gopls.setup({
  on_attach = on_attach,
  capabilities = capabilities,
  settings = {
    gopls = {
      analyses = {
        unusedparams = true,
      },
      staticcheck = true,
      gofumpt = true,
    },
  },
})
```

## Advanced Features

### Inlay Hints (Neovim 0.10+)

Show type hints inline:

```lua
local on_attach = function(client, bufnr)
  -- Enable inlay hints if supported
  if client.server_capabilities.inlayHintProvider then
    vim.lsp.inlay_hint.enable(true, { bufnr = bufnr })
  end
end
```

Toggle with keymap:

```lua
vim.keymap.set("n", "<leader>th", function()
  vim.lsp.inlay_hint.enable(not vim.lsp.inlay_hint.is_enabled())
end, { desc = "Toggle inlay hints" })
```

### Diagnostics Configuration

Customize diagnostic display:

```lua
vim.diagnostic.config({
  virtual_text = {
    prefix = "●",
    source = "if_many",  -- Show source if multiple sources
  },
  signs = true,
  underline = true,
  update_in_insert = false,  -- Don't update while typing
  severity_sort = true,      -- Sort by severity
  float = {
    border = "rounded",
    source = "always",
    header = "",
    prefix = "",
  },
})

-- Customize diagnostic signs
local signs = { Error = " ", Warn = " ", Hint = " ", Info = " " }
for type, icon in pairs(signs) do
  local hl = "DiagnosticSign" .. type
  vim.fn.sign_define(hl, { text = icon, texthl = hl, numhl = hl })
end
```

### Formatting

#### Using LSP formatter

```lua
vim.keymap.set("n", "<leader>f", function()
  vim.lsp.buf.format({
    async = true,
    timeout_ms = 2000,
  })
end)
```

#### Auto-format on save

```lua
local format_on_save_group = vim.api.nvim_create_augroup("FormatOnSave", { clear = true })

vim.api.nvim_create_autocmd("BufWritePre", {
  group = format_on_save_group,
  pattern = { "*.lua", "*.ts", "*.tsx", "*.js", "*.jsx", "*.py" },
  callback = function()
    vim.lsp.buf.format({ async = false, timeout_ms = 2000 })
  end,
})
```

#### Using conform.nvim (recommended)

Better formatting control:

```lua
-- lua/plugins/formatting.lua
return {
  "stevearc/conform.nvim",
  config = function()
    require("conform").setup({
      formatters_by_ft = {
        lua = { "stylua" },
        python = { "black", "isort" },
        javascript = { "prettierd", "prettier" },
        typescript = { "prettierd", "prettier" },
        rust = { "rustfmt" },
      },
      format_on_save = {
        timeout_ms = 500,
        lsp_fallback = true,
      },
    })
  end,
}
```

### Code Actions

Enhance code actions with actions-preview.nvim:

```lua
-- lua/plugins/code-actions.lua
return {
  "aznhe21/actions-preview.nvim",
  config = function()
    require("actions-preview").setup({
      telescope = {
        sorting_strategy = "ascending",
        layout_strategy = "vertical",
      },
    })

    vim.keymap.set({ "n", "v" }, "<leader>ca", require("actions-preview").code_actions, {
      desc = "Code actions preview",
    })
  end,
}
```

## Linting

Use nvim-lint for additional linters:

```lua
-- lua/plugins/linting.lua
return {
  "mfussenegger/nvim-lint",
  config = function()
    require("lint").linters_by_ft = {
      javascript = { "eslint" },
      typescript = { "eslint" },
      python = { "pylint", "mypy" },
      lua = { "luacheck" },
    }

    vim.api.nvim_create_autocmd({ "BufWritePost", "BufReadPost", "InsertLeave" }, {
      callback = function()
        require("lint").try_lint()
      end,
    })
  end,
}
```

## Handlers Customization

Customize LSP response handlers:

```lua
-- Hover with border
vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(vim.lsp.handlers.hover, {
  border = "rounded",
})

-- Signature help with border
vim.lsp.handlers["textDocument/signatureHelp"] = vim.lsp.with(vim.lsp.handlers.signature_help, {
  border = "rounded",
})
```

## Workspace Folders

Manage workspace folders for monorepos:

```lua
vim.keymap.set("n", "<leader>wa", vim.lsp.buf.add_workspace_folder, { desc = "Add workspace folder" })
vim.keymap.set("n", "<leader>wr", vim.lsp.buf.remove_workspace_folder, { desc = "Remove workspace folder" })
vim.keymap.set("n", "<leader>wl", function()
  print(vim.inspect(vim.lsp.buf.list_workspace_folders()))
end, { desc = "List workspace folders" })
```

## Performance Optimization

### Disable Semantic Tokens (if slow)

```lua
local on_attach = function(client, bufnr)
  -- Disable semantic tokens if causing performance issues
  client.server_capabilities.semanticTokensProvider = nil
end
```

### Debounce Diagnostics

```lua
vim.diagnostic.config({
  update_in_insert = false,
  virtual_text = {
    spacing = 4,
    prefix = "●",
  },
})
```

## Troubleshooting

### Check LSP Status

```vim
:LspInfo               " Show attached clients
:checkhealth lsp       " Diagnose LSP issues
:lua vim.lsp.buf.server_ready()  " Check if server ready
```

### Enable LSP Logging

```lua
vim.lsp.set_log_level("debug")
-- Log file: ~/.local/state/nvim/lsp.log
```

### Common Issues

**Server not attaching:**
- Check `:LspInfo`
- Verify server installed in Mason
- Check filetype detection: `:set ft?`

**Slow performance:**
- Disable semantic tokens
- Reduce diagnostic update frequency
- Check server-specific settings

**Formatting not working:**
- Verify formatter installed
- Check `client.server_capabilities.documentFormattingProvider`
- Try async formatting

## Complete Example Configuration

```lua
-- lua/plugins/lsp.lua
return {
  "neovim/nvim-lspconfig",
  dependencies = {
    "williamboman/mason.nvim",
    "williamboman/mason-lspconfig.nvim",
    "hrsh7th/cmp-nvim-lsp",
  },
  config = function()
    -- Mason setup
    require("mason").setup({
      ui = { border = "rounded" },
    })

    require("mason-lspconfig").setup({
      ensure_installed = {
        "lua_ls",
        "tsserver",
        "pyright",
        "rust_analyzer",
      },
      automatic_installation = true,
    })

    -- Capabilities
    local capabilities = require("cmp_nvim_lsp").default_capabilities()

    -- On attach
    local on_attach = function(client, bufnr)
      local opts = { buffer = bufnr, silent = true }

      -- Keymaps
      vim.keymap.set("n", "gd", vim.lsp.buf.definition, opts)
      vim.keymap.set("n", "K", vim.lsp.buf.hover, opts)
      vim.keymap.set("n", "<leader>ca", vim.lsp.buf.code_action, opts)
      vim.keymap.set("n", "<leader>rn", vim.lsp.buf.rename, opts)
      vim.keymap.set("n", "<leader>f", function()
        vim.lsp.buf.format({ async = true })
      end, opts)

      -- Enable inlay hints (0.10+)
      if vim.lsp.inlay_hint and client.server_capabilities.inlayHintProvider then
        vim.lsp.inlay_hint.enable(true, { bufnr = bufnr })
      end
    end

    -- Diagnostic config
    vim.diagnostic.config({
      virtual_text = { prefix = "●" },
      signs = true,
      underline = true,
      update_in_insert = false,
      severity_sort = true,
      float = { border = "rounded" },
    })

    -- Handlers
    vim.lsp.handlers["textDocument/hover"] = vim.lsp.with(vim.lsp.handlers.hover, {
      border = "rounded",
    })

    -- Server configs
    local lspconfig = require("lspconfig")

    lspconfig.lua_ls.setup({
      on_attach = on_attach,
      capabilities = capabilities,
      settings = {
        Lua = {
          diagnostics = { globals = { "vim" } },
          workspace = { library = vim.api.nvim_get_runtime_file("", true) },
          telemetry = { enable = false },
        },
      },
    })

    lspconfig.tsserver.setup({
      on_attach = on_attach,
      capabilities = capabilities,
    })

    lspconfig.pyright.setup({
      on_attach = on_attach,
      capabilities = capabilities,
    })
  end,
}
```

## LSP Servers by Language

### Web Development
- **TypeScript/JavaScript**: tsserver, denols (Deno)
- **HTML**: html
- **CSS**: cssls, tailwindcss
- **Vue**: volar
- **Svelte**: svelte

### Systems Programming
- **Rust**: rust_analyzer
- **Go**: gopls
- **C/C++**: clangd, ccls
- **Zig**: zls

### Scripting
- **Python**: pyright, pylsp
- **Lua**: lua_ls
- **Ruby**: solargraph
- **PHP**: intelephense

### JVM
- **Java**: jdtls
- **Kotlin**: kotlin_language_server
- **Scala**: metals

### Other
- **JSON**: jsonls
- **YAML**: yamlls
- **TOML**: taplo
- **Markdown**: marksman
- **Bash**: bashls

Install via Mason: `:Mason`

## Next Steps

1. Install language servers for your stack
2. Configure keybindings
3. Set up formatters (conform.nvim)
4. Add linters (nvim-lint)
5. Configure diagnostics display
6. Optimize performance if needed

For more details, see nvim-lspconfig documentation and individual server docs.
