local PluginSpec = {
    'tpope/vim-commentary',
    config = function()
        local keymap = vim.api.nvim_set_keymap

        -- C-_ actually maps to Ctr + /
        keymap('i', '<C-_>', '<C-O>:Commentary<CR>', {})
        keymap('n', '<C-_>', ':Commentary<CR>', {})
        keymap('v', '<C-_>', ':Commentary<CR>', {})
        keymap('s', '<C-_>', '<C-O>:Commentary<CR>', {})

    end
}

return PluginSpec
