-- https://awesomewm.org/doc/api/index.html

local function execute(cmd)
    local f = assert(io.popen(cmd, 'r'))
    local output = assert(f:read('*a'))
    f:close()
    output = string.gsub(output, '^%s+', '')
    output = string.gsub(output, '%s+$', '')
    output = string.gsub(output, '[\n\r]+', ' ')

    return output
end

local function set_path(luapath)
    package.cpath = package.cpath .. ';' ..
        luapath .. '/lib/lua/5.3/?.so' ..
        luapath .. '/luarocks/lib/lua/5.3/?.so'

    package.path = package.path .. ';' ..
        luapath .. '/share/lua/5.3/?.lua;' ..
        luapath .. '/share/lua/5.3/?/init.lua;' ..
        luapath .. '/luarocks/share/lua/5.3/?.lua;' ..
        luapath .. '/luarocks/share/lua/5.3/?/init.lua'
end

set_path(execute('asdf where lua'))

require('core.errors')
require('core.packages')

require("awful.autofocus")
require("awful.hotkeys_popup.keys")

require('my.notify')
require('my.layouts')
require('my.keybinds')
require('my.theme')
require('my.wallpaper')
require('my.workspaces')
require('my.windows')

require('my.display')
