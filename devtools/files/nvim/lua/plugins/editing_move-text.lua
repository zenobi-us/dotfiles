local PluginSpec = {
        'fedepujol/move.nvim',
        config = function()
            local keys = vim.keymap.set

            keys('i', '<A-S-Up>', '<C-O>:MoveLine(-1)<CR>', {})
            keys('n', '<A-S-Down>', '<C-O>:MoveLine(1)<CR>', {})
            keys('n', '<A-S-Up>', ':MoveLine(-1)<CR>', {})
            keys('n', '<A-S-Down>', ':MoveLine(1)<CR>', {})
            keys('v', '<A-S-Up>', ':MoveBlock(-1)<CR>', {})
            keys('v', '<A-S-Down>', ':MoveBlock(1)<CR>', {})

        end
}

return PluginSpec
