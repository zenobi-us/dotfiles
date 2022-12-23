local PluginSpec = {

        -- Terminal
        "akinsho/toggleterm.nvim",
        version = '*',
        config = function()
            require("toggleterm").setup({})
            local keymap   = vim.api.nvim_set_keymap
            local Terminal = require('toggleterm.terminal').Terminal
            local lazygit  = Terminal:new({
                cmd = "lazygit",
                hidden = true,
                direction = 'float',
                float_opts = {
                    border = "double"
                }
            })

            vim.keymap.set(
                "n",
                "<leader>g",
                function() lazygit:toggle() end
            )

            keymap('n', '<C-~>', ":ToggleTerm<CR>", {})
            keymap('i', '<C-~>', "<C-O>:ToggleTerm<CR>", {})

        end

}

return PluginSpec
