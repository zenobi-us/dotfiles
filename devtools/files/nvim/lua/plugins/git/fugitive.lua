local PluginSpec = {
    --
    -- Git
    --
    'tpope/vim-fugitive',
    config = function()
        require('legendary').keymaps({
            {
                '<leader>gl',
                {
                    n = ':Gdiffsplit<CR>',
                    i = "<C-O>:Gdiffsplit<CR>"
                },
                description = "Git: Log: view file change Log"
            },
        })
    end
}

return PluginSpec
