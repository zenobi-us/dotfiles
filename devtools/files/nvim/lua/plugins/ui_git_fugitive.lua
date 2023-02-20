local PluginSpec = {
    --
    -- Git
    --
    'tpope/vim-fugitive',
    config = function()
        require('legendary').keymaps({
            {
                '<leader>gl',
                { n = ':Gdiffsplit<CR>', i = "<C-O>:Gdiffsplit<CR>" },
                description = "Git: View file change Log"
            },

        })
    end
}

return PluginSpec
