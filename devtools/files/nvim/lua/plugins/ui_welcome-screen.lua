local PluginSpec = {
    -- Startup
    'echasnovski/mini.nvim',
    branch = 'stable',
    config = function ()
        require("mini.starter").setup({})
    end
}
return PluginSpec
