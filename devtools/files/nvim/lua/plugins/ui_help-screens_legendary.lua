local PluginSpec = {
    'mrjones2014/legendary.nvim',
    dependencies = {
        'kkharji/sqlite.lua'
    },
    config = function()
        local legendary = require('legendary')
        -- https://github.com/kkharji/sqlite.lua#windows
        if jit.os == 'Windows' then
            vim.g.sqlite_clib_path = stdpath('config') .. 'binaries/sqlite3.dll'
        end

        legendary.setup({})
    end
}


return PluginSpec
