local PluginSpec = {
    'folke/trouble.nvim',
    dependencies = {
        'folke/lsp-colors.nvim'
    },
    -- cmd = { 'TroubleToggle', 'TroubleRefresh', 'TodoTrouble' },
    config = function()
        vim.diagnostic.config({
            virtual_text = true
        })

        require('trouble').setup({})

        require('legendary').keymaps({
            {
                "<leader>xx",
                { n = "<cmd>TroubleToggle<cr>" },
                description = "Problems: toggle panel"
            },
            {
                "<leader>xw",
                { n = "<cmd>TroubleToggle workspace_diagnostics<cr>" },
                description = "Problems: toggle panel [workspace]"
            },
            {
                "<leader>xd",
                { n = "<cmd>TroubleToggle document_diagnostics<cr>" },
                description = "Problems: toggle panel [document]"
            },
            {
                "<leader>xl",
                { n = "<cmd>TroubleToggle loclist<cr>" },
                description = "Problems: toggle panel [location list]"
            },
            {
                "<leader>xq",
                { n = "<cmd>TroubleToggle quickfix<cr>" },
                description = "Problems: toggle panel [quickfix]"
            },
            {
                "gR",
                { n = "<cmd>TroubleToggle lsp_references<cr>" },
                description = "Problems: toggle panel [lsp references]"
            }
        })
    end
}

return PluginSpec
