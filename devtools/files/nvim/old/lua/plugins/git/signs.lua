local PluginSpec = {
    'lewis6991/gitsigns.nvim',
    config = function ()
        require("gitsigns").setup({})
    end
}

return PluginSpec