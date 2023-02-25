-- https://github.com/fedepujol/move.nvim

local PluginSpec = {
    'fedepujol/move.nvim',
    config = function()
        require('legendary').keymaps({
            {
                '<A-S-Down>',
                {
                    i = '<C-O>:MoveLine(1)<CR>',
                    n = ':MoveLine(1)<CR>',
                    v = ':MoveLine(1)<CR>'
                },
                description = "Move line down"
            },
            {
                '<A-S-Up>',
                {
                    i = '<C-O>:MoveLine(-1)<CR>',
                    n = ':MoveLine(-1)<CR>',
                    v = ':MoveLine(-1)<CR>'
                },
                description = "Move line up"

            }
        })
    end
}

return PluginSpec
