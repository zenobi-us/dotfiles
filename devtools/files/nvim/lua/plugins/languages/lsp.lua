return {
    "neovim/nvim-lspconfig",
	dependencies = {

        { "folke/neoconf.nvim", cmd = "Neoconf", config = true },
		{ "folke/neodev.nvim", opts = { experimental = { pathStrict = true } } },

        { "williamboman/mason.nvim" },
		{ "williamboman/mason-lspconfig.nvim" },

        -- Autocomplete
		{ "hrsh7th/nvim-cmp" },
		{ "hrsh7th/cmp-nvim-lua" },
		{ "hrsh7th/cmp-nvim-lsp" },
		{ "hrsh7th/cmp-buffer" },
		{ "hrsh7th/cmp-path" },
		{ "hrsh7th/cmp-emoji" },
		{ "hrsh7th/cmp-nvim-lsp-signature-help" },
		{ "hrsh7th/cmp-cmdline" },

        -- Signature UI
		{ "ray-x/lsp_signature.nvim" },

        -- Code Actions
        { "weilbith/nvim-code-action-menu" },

		-- Snippets
		{ "L3MON4D3/LuaSnip" },
		{ "rafamadriz/friendly-snippets" },
	},
    opts = {
			-- options for vim.diagnostic.config()
			diagnostics = {
				underline = true,
				update_in_insert = false,
				virtual_text = { spacing = 4, prefix = "●" },
				severity_sort = true,
			},
			-- Automatically format on save
			autoformat = true,
			-- options for vim.lsp.buf.format
			-- `bufnr` and `filter` is handled by the LazyVim formatter,
			-- but can be also overridden when specified
			format = {
				formatting_options = nil,
				timeout_ms = nil,
			},
			-- LSP Server Settings
			---@type lspconfig.options
			servers = {
				jsonls = {},
				lua_ls = {
					-- mason = false, -- set to false if you don't want this server to be installed with mason
					settings = {
						Lua = {
							workspace = {
								checkThirdParty = false,
							},
							completion = {
								callSnippet = "Replace",
							},
						},
					},
				},
			},
			-- you can do any additional lsp server setup here
			-- return true if you don't want this server to be setup with lspconfig
			---@type table<string, fun(server:string, opts:_.lspconfig.options):boolean?>
			setup = {
				-- example to setup with typescript.nvim
				-- tsserver = function(_, opts)
				--   require("typescript").setup({ server = opts })
				--   return true
				-- end,
				-- Specify * to use this function as a fallback for any server
				-- ["*"] = function(server, opts) end,
			},
		},
	config = function(lspoptions)

        --
        -- AutoFormat
        --

        require("lazyvim.plugins.lsp.format").autoformat = lspoptions.autoformat
        -- setup formatting and keymaps
        require("lazyvim.util").on_attach(function(client, buffer)
            require("lazyvim.plugins.lsp.format").on_attach(client, buffer)
            require("lazyvim.plugins.lsp.keymaps").on_attach(client, buffer)
        end)
        -- diagnostics
        for name, icon in pairs(require("lazyvim.config").icons.diagnostics) do
            name = "DiagnosticSign" .. name
            vim.fn.sign_define(name, { text = icon, texthl = name, numhl = "" })
        end
        vim.diagnostic.config(lspoptions.diagnostics)


        --
        -- Plugin Manager
        --

        require("mason").setup()
		require("mason-lspconfig").setup({
			ensure_installed = require("plugins.languages.ensure_installed"),
		})

        require('legendary').keymaps({

            {

            }
        })

        --
        -- Autocomplete
        --

        local cmp = require("cmp")
		cmp.setup({
			window = {
				completion = cmp.config.window.bordered(),
				documentation = cmp.config.window.bordered(),
			},

			snippet = {
				expand = function(args)
					-- vim.fn["vsnip#anonymous"](args.body) -- For `vsnip` users.
					require("luasnip").lsp_expand(args.body) -- For `luasnip` users.
					-- require('snippy').expand_snippet(args.body) -- For `snippy` users.
					-- vim.fn["UltiSnips#Anon"](args.body) -- For `ultisnips` users.
				end,
			},

			sources = cmp.config.sources({
				{ name = "nvim_lsp" },
				{ name = "nvim_lsp_signature_help" },
				{ name = "emoji" },
			}, {
				{ name = "buffer" },
			}),

			mapping = cmp.mapping.preset.insert({
				["<C-Space>"] = cmp.mapping.complete(),
				["<Esc>"] = cmp.mapping.abort(),

				-- Accept currently selected item. Set `select` to `false` to only confirm explicitly selected items.
				["<CR>"] = cmp.mapping.confirm({ select = true }),
			}),
		})


        --
        -- Individual Language Server Setup
        --

		local lsp_capabilities = require("cmp_nvim_lsp").default_capabilities()
		local lsp_attach = function(client, bufnr)
			-- Creiate your keybindings here...
			-- require
		end
		local lspconfig = require("lspconfig")
		require("mason-lspconfig").setup_handlers({
			function(server_name)
				lspconfig[server_name].setup({
					on_attach = lsp_attach,
					capabilities = lsp_capabilities,
				})
			end,
		})
	end,
}
