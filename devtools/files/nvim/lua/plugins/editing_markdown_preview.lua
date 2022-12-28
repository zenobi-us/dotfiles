local PluginSpec = {
    "ellisonleao/glow.nvim",
    config = function()
        require('glow').setup({
            style = 'dark'
        })
    end
}
return PluginSpec
