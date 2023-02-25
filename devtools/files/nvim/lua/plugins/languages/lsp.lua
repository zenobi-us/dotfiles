return {
    "VonHeikemen/lsp-zero.nvim",
    dependencies = {

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
        local lsp = require('lsp-zero').preset({
            name = 'minimal',
            set_lsp_keymaps = true,
            manage_nvim_cmp = true,
            suggest_lsp_servers = true,
        })

        lsp.ensure_installed({
            'tsserver',
            'rust_analyzer',
        })

        local languages_path = debug.getinfo(2, 'S').source:sub(2)

        print("languages_path: %s", languages_path)
        vim.loop.fs_readdir(languages_path, function (file)
             print('file')
        end)

        lsp.configure('tsserver', require('plugins.languages.typescript'))

        lsp.nvim_workspace()
        lsp.setup()
    end
}
