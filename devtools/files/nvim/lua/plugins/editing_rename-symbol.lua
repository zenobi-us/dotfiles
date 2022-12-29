-- LSP rename Symbol
local PluginSpec = {
    'filipdutescu/renamer.nvim',
    branch = 'master',
    dependencies = {
        { 'nvim-lua/plenary.nvim' }
    },
    config = function()
        local keymap = vim.api.nvim_set_keymap

        keymap('i', '<F2>', '<cmd>lua require("renamer").rename()<cr>',
            { noremap = true, silent = true })
        keymap('n', '<leader>rn', '<cmd>lua require("renamer").rename()<cr>',
            { noremap = true, silent = true })
        keymap('v', '<leader>rn', '<cmd>lua require("renamer").rename()<cr>',
            { noremap = true, silent = true })

    end
}

return PluginSpec
