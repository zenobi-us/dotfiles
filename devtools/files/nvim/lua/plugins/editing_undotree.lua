local PluginSpec = {
    'mbbill/undotree',
    config = function()
        require('legendary').keymaps({
            {
                "<leader>u",
                vim.cmd.UndotreeToggle,
                description = 'Toggle Undo'
            }
        })
    end
}

return PluginSpec
