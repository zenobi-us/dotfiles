return {
    "",
    config = function()
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
                [[<C-\>]],
                {},
                description = "Terminal: Toggle terminal window",
                opts = {
                    noremap = true
                }
            },
            {
                '<leader>gu',
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
