local PluginSpec = {
    'akinsho/git-conflict.nvim',
    config = function()
        require('git-conflict').setup()
    end
}

return PluginSpec
