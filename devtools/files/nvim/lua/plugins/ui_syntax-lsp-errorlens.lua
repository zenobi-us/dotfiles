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

        require('trouble').setup({

        })
        require('legendary').keymaps({
            {
                "<leader>xx",
                "<cmd>TroubleToggle<cr>",
                description = "Problems: toggle panel"
            },
            {
                "<leader>xw",
                "<cmd>TroubleToggle workspace_diagnostics<cr>",
                description = "Problems: toggle panel [workspace]"
            },
            {
                "<leader>xd",
                "<cmd>TroubleToggle document_diagnostics<cr>",
                description = "Problems: toggle panel [document]"
            },
            {
                "<leader>xl",
                "<cmd>TroubleToggle loclist<cr>",
                description = "Problems: toggle panel [location list]"
            },
            {
                "<leader>xq",
                "<cmd>TroubleToggle quickfix<cr>",
                description = "Problems: toggle panel [quickfix]"
            },
            {
                "gR",
                "<cmd>TroubleToggle lsp_references<cr>",
                description = "Problems: toggle panel [lsp references]"
            }
        })
    end
}

return PluginSpec
