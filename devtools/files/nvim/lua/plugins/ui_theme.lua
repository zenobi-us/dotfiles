local PluginSpec = {

    --            'rose-pine/neovim',
    --            name = 'rose-pine',
    --            config = function ()
    --                vim.cmd.colorscheme("rose-pine")
    --            end
    --
    "projekt0n/github-nvim-theme",
    config = function()
        require("github-theme").setup({
            theme_style = "dark",
            -- function_style = "italic",
            comment_style = "italic",
            -- keyword_style = "italic",
            -- variable_style = "italic",
            dark_sidebar = "false"
        })
    end
}

return PluginSpec
