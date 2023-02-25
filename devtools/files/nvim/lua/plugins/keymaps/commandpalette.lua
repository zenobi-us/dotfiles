local PluginSpec = {
    "mrjones2014/legendary.nvim",
    dependencies = {
        { "folke/which-key.nvim",
            config = function()
                require('which-key').setup({})
            end
        },
        "kkharji/sqlite.lua",
    },
    config = function()
        -- -- https://github.com/kkharji/sqlite.lua#windows
        -- if jit.os == 'Windows' then
        --     vim.g.sqlite_clib_path = stdpath('config') .. 'binaries/sqlite3.dll'
        -- end

        local legendary = require("legendary")
        legendary.setup({
            which_key = {
                auto_register = true,
            },
            keymaps = {
                -- Open legendary
                { "<C-p>", ":Legendary<CR>" },


                -- Moving
                {
                    "<PageUp>",
                    { i = "<C-O>50k", n = "50k" },
                    description = "Move up 50 lines",
                },
                {
                    "<PageDown>",
                    { i = "<C-O>50j", n = "50j" },
                    description = "Move down 50 lines",
                },

                -- Closing
                {
                    "<C-w>",
                    {
                        i = "<C-O>:bd<CR>",
                        n = ":bd<CR>",
                    },
                    description = "Close window",
                },

                -- Clone line
                {
                    "<C-d>",
                    {
                        i = "<C-O>:copy .<CR>",
                        n = ":copy .<CR>",
                        v = "<C-C>:copy .<CR>",
                    },
                    description = "Clone line",
                },

                -- New File
                {
                    "<C-n>",
                    {
                        i = "<C-O>:enew<CR>",
                        n = ":enew<CR>",
                        v = "<C-C>:enew<CR>"
                    }
                },

                -- Tab indenting
                {
                    "<Tab>",
                    {
                        n = ">>_",
                        v = "<C-C>gv",
                    },
                    description = "Indent line/block",
                },

                {
                    "<S-Tab>",
                    {
                        n = "<<_",
                        i = "<<_",
                        v = "<C-C>gv<",
                    },
                    description = "Unindent line/block",
                },
            },
        })
    end,
}

return PluginSpec
