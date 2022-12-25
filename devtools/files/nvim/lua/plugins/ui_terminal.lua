local PluginSpec = {

    -- Terminal
    "akinsho/toggleterm.nvim",
    dependencies = {

    },
    version = '*',
    config = function()
        require("toggleterm").setup({})
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
