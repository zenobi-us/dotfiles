local PluginSpec = {
    -- Terminal
    "akinsho/toggleterm.nvim",
    dependencies = {

    },
    version = '*',
    config = function()
        require("toggleterm").setup({
            size = 20,
            open_mapping = [[<c-\>]],
            hide_numbers = true,
            shade_filetypes = {},
            shade_terminals = true,
            shading_factor = 2,
            start_in_insert = true,
            insert_mappings = true,
            persist_size = true,
            direction = "float",
            close_on_exit = true,
            shell = vim.o.shell,
            float_opts = {
                border = "single",
                winblend = 0,
                highlights = {
                    border = "Normal",
                    background = "Normal",
                },
            },
        })

        --
        -- Create a Git Interface with LazyGit
        --
        local Terminal = require('toggleterm.terminal').Terminal

        local lazygit  = Terminal:new({
            cmd = "lazygit",
            hidden = true,
            direction = 'float',
            float_opts = {
                border = "double"
            }
        })

        require('legendary').keymaps({
            {
                '<leader>term',
                {
                    n = ":ToggleTerm<CR>",
                    i = "<C-O>:ToggleTerm<CR>"
                },
                description = "Terminal: Toggle terminal window"
            },
            {
                '<leader>git',
                {
                    n = function()
                        lazygit:toggle()
                    end
                },
                description = "Git: Toggle git ui"
            }
        })
    end
}

return PluginSpec
