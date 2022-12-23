local PluginSpec = {
    -- File Tree
    "nvim-neo-tree/neo-tree.nvim",
    dependencies = {
        "nvim-lua/plenary.nvim",
        "MunifTanjim/nui.nvim",
    },
    
    config = function()

        require('neo-tree').setup({
            popup_border_style = "rounded",
            enable_git_status = true,
            enable_diagnostics = true,
            default_component_configs = {
                git_status = {
                    symbols = {
                        -- Change type
                        added     = "+", -- or "✚", but this is redundant info if you use git_status_colors on the name
                        modified  = "m", -- or "", but this is redundant info if you use git_status_colors on the name
                        deleted   = "d", -- this can only be used in the git_status source
                        renamed   = "r", -- this can only be used in the git_status source
                        -- Status type
                        untracked = "u",
                        ignored   = "i",
                        unstaged  = "",
                        staged    = "✅",
                        conflict  = "",
                    }
                },
            },
            filesystem = {
                filtered_items = {
                    hide_dotfiles = true,
                    hide_gitignored = true,
                }
            }
        })

        vim.keymap.set('i', '<C-b>', '<C-O>:Neotree filesystem reveal left toggle<CR>')
        vim.keymap.set('n', '<C-b>', ':Neotree filesystem reveal left toggle<CR>')

    end
}

return PluginSpec
