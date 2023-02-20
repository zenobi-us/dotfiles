local PluginSpec = {
    'mrjones2014/legendary.nvim',
    dependencies = {
        'kkharji/sqlite.lua'
    },
    config = function()
        -- -- https://github.com/kkharji/sqlite.lua#windows
        -- if jit.os == 'Windows' then
        --     vim.g.sqlite_clib_path = stdpath('config') .. 'binaries/sqlite3.dll'
        -- end

        local legendary = require('legendary')
        legendary.setup({
            which_key = {
                auto_register = true
            },
            keymaps = {
                { "<C-p>", ":Legendary<CR>" }
            }
        })
    end
}


return PluginSpec
