return {
    "VonHeikemen/lsp-zero.nvim",
    dependencies = {

        { 'neovim/nvim-lspconfig' },
        { 'jose-elias-alvarez/null-ls.nvim' },
        { 'williamboman/mason.nvim' },
        { 'williamboman/mason-lspconfig.nvim' },
        -- Autocompletion
        { 'hrsh7th/nvim-cmp' },
        { 'hrsh7th/cmp-buffer' },
        { 'hrsh7th/cmp-path' },
        { 'saadparwaiz1/cmp_luasnip' },
        { 'hrsh7th/cmp-nvim-lsp' },
        { 'hrsh7th/cmp-nvim-lua' },
        { 'ray-x/lsp_signature.nvim' },
        { 'weilbith/nvim-code-action-menu' },

        -- Snippets
        { 'L3MON4D3/LuaSnip' },
        { 'rafamadriz/friendly-snippets' },

    },
    config = function()
        --
        -- Initial LSP Setup
        --
        local lsp = require('lsp-zero').preset({
            name = 'minimal',
            manage_nvim_cmp = false,
            set_lsp_keymaps = false,
            suggest_lsp_servers = true,
        })

        local null_ls = require('null-ls')
        local null_opts = lsp.build_options('null-ls', {
            on_attach = function(client)
                if client.server_capabilities.document_formatting then
                    vim.api.nvim_create_autocmd("BufWritePre", {
                        desc = "Auto format before save",
                        pattern = "<buffer>",
                        callback = vim.lsp.buf.formatting_sync,
                    })
                end
            end
        })

        --
        -- Required Language Servers
        --
        lsp.ensure_installed({
            'eslint',
            'cssls',
            'sumenko_lua',
            'html',
            'tsserver',
            'rust_analyzer',
        })

        --
        -- Autocomplete / Snippets
        --
        local cmp = require('cmp')
        cmp.setup(lsp.defaults.cmp_config({
            mapping = lsp.defaults.cmp_mappings(),
            window = {
                completion = cmp.config.window.bordered()
            }
        }))

        --
        -- Language Server Setup
        --
        -- Create a file in plugins/languages/providers/<LANGUAGE_NAME>.lua
        --
        --
        --
        require('core.require_glob')
            .glob_packages("plugins.languages.providers", function(provider)
                local package = require(provider)
                for name, setup in pairs(package) do
                    lsp.configure(name, setup)
                end
            end)

        --
        -- AutoFormat / Fixup
        --
        null_ls.setup({
            on_attach = null_opts.on_attach,
            sources = {
                null_ls.builtins.formatting.prettier,
                null_ls.builtins.diagnostics.eslint,
            }
        })

        -- setup signature hover higlighter
        --
        --  It highlights the part of the definition that the cursor is
        --  directly focusing on instead of just the whole definition.
        require('lsp_signature').setup({})


        -- keymaps
        require('legendary').keymaps({
            {
                "<Leader>ca",
                { n = vim.lsp.buf.code_action },
                description = "LSP: code action"
            }
        })

        require('legendary').commands({
            {
                ":LspZeroFormat",
                description = "Format: document"
            },
            {
                ":Mason",
                description = "LSP: plugin manager"
            }
        })

        lsp.nvim_workspace()
        lsp.setup()
    end
}
