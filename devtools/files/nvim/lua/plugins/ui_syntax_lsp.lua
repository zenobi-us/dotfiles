local PluginSpec = {

    'VonHeikemen/lsp-zero.nvim',
    dependencies = {

        -- LSP Support
        { 'neovim/nvim-lspconfig' },
        { 'williamboman/mason.nvim' },
        { 'williamboman/mason-lspconfig.nvim' },

        -- Autocompletion
        { 'hrsh7th/nvim-cmp' },
        { 'hrsh7th/cmp-buffer' },
        { 'hrsh7th/cmp-path' },
        { 'saadparwaiz1/cmp_luasnip' },
        { 'hrsh7th/cmp-nvim-lsp' },
        { 'hrsh7th/cmp-nvim-lua' },

        -- Snippets
        { 'L3MON4D3/LuaSnip' },
        { 'rafamadriz/friendly-snippets' },
    },
    config = function()
        local lsp = require("lsp-zero")

        lsp.preset("recommended")

        lsp.ensure_installed({
            'tsserver',
            'eslint',
            'sumneko_lua',
            'rust_analyzer',
        })

        local cmp = require('cmp')
        local cmp_select = { behavior = cmp.SelectBehavior.Select }
        local cmp_mappings = lsp.defaults.cmp_mappings({
            ['<C-p>'] = cmp.mapping.select_prev_item(cmp_select),
            ['<C-n>'] = cmp.mapping.select_next_item(cmp_select),
            ['<C-y>'] = cmp.mapping.confirm({ select = true }),
            ["<C-Space>"] = cmp.mapping.complete(),
        })

        lsp.set_preferences({
            sign_icons = {}
        })

        lsp.setup_nvim_cmp({
            mapping = cmp_mappings
        })

        lsp.on_attach(function(client, bufnr)
            local opts = { buffer = bufnr, remap = false }

            vim.keymap.set("n", "gd", function() vim.lsp.buf.definition() end, opts)
            vim.keymap.set("n", "K", function() vim.lsp.buf.hover() end, opts)
            vim.keymap.set("n", "<leader>vws", function() vim.lsp.buf.workspace_symbol() end, opts)
            vim.keymap.set("n", "<leader>vd", function() vim.diagnostic.open_float() end, opts)
            vim.keymap.set("n", "[d", function() vim.diagnostic.goto_next() end, opts)
            vim.keymap.set("n", "]d", function() vim.diagnostic.goto_prev() end, opts)
            vim.keymap.set("n", "<leader>vca", function() vim.lsp.buf.code_action() end, opts)
            vim.keymap.set("n", "<leader>vrr", function() vim.lsp.buf.references() end, opts)
            vim.keymap.set("n", "<leader>vrn", function() vim.lsp.buf.rename() end, opts)
            vim.keymap.set("i", "<C-h>", function() vim.lsp.buf.signature_help() end, opts)
        end)


        lsp.nvim_workspace()
        lsp.setup()

        -- https://neovim.discourse.group/t/lsp-formatting-doesnt-always-work/1884/21
        -- START COPYPASTA https://github.com/neovim/neovim/commit/5b04e46d23b65413d934d812d61d8720b815eb1c
        local util = require 'vim.lsp.util'
        --- Formats a buffer using the attached (and optionally filtered) language
        --- server clients.
        ---
        --- @param options table|nil Optional table which holds the following optional fields:
        ---     - formatting_options (table|nil):
        ---         Can be used to specify FormattingOptions. Some unspecified options will be
        ---         automatically derived from the current Neovim options.
        ---         @see https://microsoft.github.io/language-server-protocol/specification#textDocument_formatting
        ---     - timeout_ms (integer|nil, default 1000):
        ---         Time in milliseconds to block for formatting requests. Formatting requests are current
        ---         synchronous to prevent editing of the buffer.
        ---     - bufnr (number|nil):
        ---         Restrict formatting to the clients attached to the given buffer, defaults to the current
        ---         buffer (0).
        ---     - filter (function|nil):
        ---         Predicate to filter clients used for formatting. Receives the list of clients attached
        ---         to bufnr as the argument and must return the list of clients on which to request
        ---         formatting. Example:
        ---
        ---         <pre>
        ---         -- Never request typescript-language-server for formatting
        ---         vim.lsp.buf.format {
        ---           filter = function(clients)
        ---             return vim.tbl_filter(
        ---               function(client) return client.name ~= "tsserver" end,
        ---               clients
        ---             )
        ---           end
        ---         }
        ---         </pre>
        ---
        ---     - id (number|nil):
        ---         Restrict formatting to the client with ID (client.id) matching this field.
        ---     - name (string|nil):
        ---         Restrict formatting to the client with name (client.name) matching this field.
        vim.lsp.buf.format = function(options)
            options = options or {}
            local bufnr = options.bufnr or vim.api.nvim_get_current_buf()
            local clients = vim.lsp.buf_get_clients(bufnr)

            if options.filter then
                clients = options.filter(clients)
            elseif options.id then
                clients = vim.tbl_filter(
                    function(client) return client.id == options.id end,
                    clients
                )
            elseif options.name then
                clients = vim.tbl_filter(
                    function(client) return client.name == options.name end,
                    clients
                )
            end

            clients = vim.tbl_filter(
                function(client) return client.supports_method 'textDocument/formatting' end,
                clients
            )

            if #clients == 0 then
                vim.notify '[LSP] Format request failed, no matching language servers.'
            end

            local timeout_ms = options.timeout_ms or 1000
            for _, client in pairs(clients) do
                local params = util.make_formatting_params(options.formatting_options)
                local result, err = client.request_sync('textDocument/formatting', params, timeout_ms, bufnr)
                if result and result.result then
                    util.apply_text_edits(result.result, bufnr, client.offset_encoding)
                elseif err then
                    vim.notify(string.format('[LSP][%s] %s', client.name, err), vim.log.levels.WARN)
                end
            end
        end
        -- END COPYPASTA


        vim.api.nvim_create_augroup('LspFormatting', { clear = true })
        vim.api.nvim_create_autocmd('BufWritePre', {
            pattern = '*',
            group = 'LspFormatting',
            callback = function()
                vim.lsp.buf.format {
                    timeout_ms = 2000,
                    filter = function(clients)
                        return vim.tbl_filter(function(client)
                            return pcall(function(_client)
                                return _client.config.settings.autoFixOnSave or false
                            end, client) or false
                        end, clients)
                    end
                }
            end
        })



        require('mason').setup({
            ui = {
                icons = {
                    package_installed = "✓",
                    package_pending = "➜",
                    package_uninstalled = "✗"
                },
                keymaps = {
                    -- Keymap to expand a package
                    toggle_package_expand = "<CR>",
                    -- Keymap to install the package under the current cursor position
                    install_package = "i",
                    -- Keymap to reinstall/update the package under the current cursor position
                    update_package = "u",
                    -- Keymap to check for new version for the package under the current cursor position
                    check_package_version = "c",
                    -- Keymap to update all installed packages
                    update_all_packages = "U",
                    -- Keymap to check which installed packages are outdated
                    check_outdated_packages = "C",
                    -- Keymap to uninstall a package
                    uninstall_package = "X",
                    -- Keymap to cancel a package installation
                    cancel_installation = "<C-c>",
                    -- Keymap to apply language filter
                    apply_language_filter = "<C-f>",
                },
            }
        })

        vim.keymap.set("n", "<leader>m", ":Mason<CR>")
        vim.keymap.set("v", "<leader>m", "<C-C>:Mason<CR>")

    end
}

return PluginSpec
