-- Highlight current word
local PluginSpec = {
    'echasnovski/mini.cursorword',
    branch = 'stable',
    config = function()
        require("mini.cursorword").setup()
    end
}
return PluginSpec
