local PluginSpec = {
    'sindrets/diffview.nvim',
    dependencies = {
        "nvim-lua/plenary.nvim"
    },
    config = function()
        -- set fillchars+=diff:╱
        -- require('git-conflict').setup()
        vim.keymap.set(
            "n", "gR", "<cmd>TroubleToggle lsp_references<cr>",
            { silent = true, noremap = true }
        )
    end
}

return PluginSpec
