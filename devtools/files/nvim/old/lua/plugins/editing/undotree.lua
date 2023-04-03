local PluginSpec = {
    'mbbill/undotree',
    config = function()
        require('legendary').keymaps({
            {
                "<leader>u",
                { n = vim.cmd.UndotreeToggle },
                description = 'Undo: Toggle Undo Tree'
            }
        })
    end
}

return PluginSpec
