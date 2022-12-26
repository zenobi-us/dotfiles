-- https://github.com/fedepujol/move.nvim

local PluginSpec = {
    'fedepujol/move.nvim',
    config = function()
        local keymap = require('core.keys').keymap

        keymap('i', '<A-S-Up>', '<C-O>:MoveLine(-1)<CR>')

        keymap('n', '<A-S-Down>', '<C-O>:MoveLine(1)<CR>')
        keymap('n', '<A-S-Up>', ':MoveLine(-1)<CR>')
        keymap('n', '<A-S-Down>', ':MoveLine(1)<CR>')

        keymap('v', '<A-S-Up>', ':MoveBlock(-1)<CR>')
        keymap('v', '<A-S-Down>', ':MoveBlock(1)<CR>')


    end
}

return PluginSpec
