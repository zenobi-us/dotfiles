local buffers    = require "core.buffers"

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
                scratchpad = {
                    -- How to open the scratchpad buffer,
                    -- 'current' for current window, 'float'
                    -- for floating window
                    view = 'float',
                    -- How to show the results of evaluated Lua code.
                    -- 'print' for `print(result)`, 'float' for a floating window.
                    results_view = 'float',
                    -- Border style for floating windows related to the scratchpad
                    float_border = 'rounded',
                    -- Whether to restore scratchpad contents from a cache file
                    keep_contents = true,
                },
            }
        })
    end,
}

return PluginSpec
