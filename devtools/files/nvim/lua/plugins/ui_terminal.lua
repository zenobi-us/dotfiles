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
        local keymap = require('core.keys').keymap

        keymap('n', '<leader>t', ":ToggleTerm<CR>", {})
        -- keymap('i', '<leader>t', "<C-O>:ToggleTerm<CR>", {})

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

        keymap('n', '<leader>g', function() lazygit:toggle() end)


    end

}

return PluginSpec
