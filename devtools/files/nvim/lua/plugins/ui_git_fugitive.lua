local PluginSpec = {
    --
    -- Git
    --
    'tpope/vim-fugitive',

    config = function()
        local keymap = require('core.keys').keymap

        keymap('n', '<leader>gh', ':Gdiffsplit')
    end
}

return PluginSpec

