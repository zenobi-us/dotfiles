return {
    'williamboman/mason.nvim',
    dependencies = {
        { 'hrsh7th/nvim-cmp' },
        { 'hrsh7th/cmp-nvim-lua' },
        { 'hrsh7th/cmp-nvim-lsp' },
        { 'hrsh7th/cmp-nvim-buffer' },
        { 'hrsh7th/cmp-nvim-path' },
        { 'williamboman/mason-lspconfig.nvim' },
        { 'neovim/nvim-lspconfig' },
        { 'ray-x/lsp_signature.nvim' },
        { 'weilbith/nvim-code-action-menu' },
    },
    config = function()
        require('mason').setup()
        require('mason-lspconfig').setup({
            ensure_installed = require("plugins.languages.ensure_installed")
        })

--         local lsp_capabilities = require('cmp_nvim_lsp').default_capabilities()
--         local lsp_attach = function(client, bufnr)
--             -- Creiate your keybindings here...
--         end

--         local lspconfig = require('lspconfig')

--         require('mason-lspconfig').setup_handlers({
--             function(server_name)
--                 lspconfig[server_name].setup({
--                     on_attach = lsp_attach,
--                     capabilities = lsp_capabilities,
--                 })
--             end,
--         })
    end
}
