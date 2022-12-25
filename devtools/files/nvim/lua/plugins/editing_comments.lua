local PluginSpec = {
    'tpope/vim-commentary',
    config = function()
        local keymap = require('core.keys').keymap
        local opts = { remap = true }

        -- C-_ actually maps to Ctr + /
        keymap('i', '<C-_>', '<C-O>:Commentary<CR>', opts)
        keymap('n', '<C-_>', ':Commentary<CR>', opts)
        keymap('v', '<C-_>', ':Commentary<CR>', opts)
        keymap('s', '<C-_>', '<C-O>:Commentary<CR>', opts)

    end
}

return PluginSpec
