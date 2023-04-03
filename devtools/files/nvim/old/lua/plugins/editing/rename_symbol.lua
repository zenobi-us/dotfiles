-- LSP rename Symbol
local PluginSpec = {
    'filipdutescu/renamer.nvim',
    branch = 'master',
    dependencies = {
        { 'nvim-lua/plenary.nvim' }
    },
    config = function()
        require('renamer').setup({
            title = "Refactor: rename symbol",
            show_refs = true
        })
        require('legendary').keymaps({
            {
                '<F2>',
                function() require("renamer").rename({ empty = false }) end,
                description = "Refactor: Rename Symbol",
            }
        })
    end
}

return PluginSpec
