local PluginSpec = {
    'VonHeikemen/lsp-zero.nvim',
    dependencies = {

        -- LSP Support
        { 'williamboman/mason.nvim' },
        { 'williamboman/mason-lspconfig.nvim' },
        { 'neovim/nvim-lspconfig' },
        { 'jose-elias-alvarez/null-ls.nvim' },
        -- { 'antoinemadec/FixCursorHold.nvim' },

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
        require('plugins.lsp.zero')
        require('plugins.lsp.auto_format')
        require('plugins.lsp.mason')
        require('plugins.lsp.handlers').setup()
    end
}

return PluginSpec
