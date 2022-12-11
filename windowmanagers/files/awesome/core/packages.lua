local function execute(cmd)
    local f = assert(io.popen(cmd, 'r'))
    local output = assert(f:read('*a'))
    f:close()
    output = string.gsub(output, '^%s+', '')
    output = string.gsub(output, '%s+$', '')
    output = string.gsub(output, '[\n\r]+', ' ')

    return output
end

local function set_package_path(luapath)
    package.cpath = package.cpath .. ';' ..
        luapath .. '/lib/lua/5.3/?.so' ..
        luapath .. '/luarocks/lib/lua/5.3/?.so'

    package.path = package.path .. ';' ..
        luapath .. '/share/lua/5.3/?.lua;' ..
        luapath .. '/share/lua/5.3/?/init.lua;' ..
        luapath .. '/luarocks/share/lua/5.3/?.lua;' ..
        luapath .. '/luarocks/share/lua/5.3/?/init.lua'
end


local function init()
    set_package_path(execute('asdf where lua'))
    
    -- If LuaRocks is installed, make sure that packages installed through it are
    -- found (e.g. lgi). If LuaRocks is not installed, do nothing.
    pcall(require, "luarocks.loader")
end

return {
    set_package_path = set_package_path,
    init = init
}