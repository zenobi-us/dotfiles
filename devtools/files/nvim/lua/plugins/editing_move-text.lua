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

        --        --
        --        -- Tab indenting
        --        --
        --        keymap('n', '<Tab>', '>>_', {})
        --        keymap('n', '<S-Tab>', '<<_', {})

        --        keymap('i', '<Tab>', '<C-O>>>_', {})
        --        keymap('i', '<S-Tab>', '<C-O><<_', {})

        --        keymap('v', '<Tab>', '<C-C>>gv', {})
        --        keymap('v', '<S-Tab>', '<C-C><gv', {})

    end
}

return PluginSpec
