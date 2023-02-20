local PluginSpec = {
    'tpope/vim-commentary',
    config = function()
        require('legendary').keymaps({

            {
                -- C-_ actually maps to Ctr + /
                '<C-_>',
                {
                    i = '<C-O>:Commentary<CR>',
                    n = ':Commentary<CR>',
                    v = ':Commentary<CR>',
                    s = '<C-O>:Commentary<CR>',
                },
                description = "Comment line/selection"

            }
        })
    end
}

return PluginSpec
