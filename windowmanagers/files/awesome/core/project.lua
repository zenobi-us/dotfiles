local function dirname(sourcepath)
    local real = io.popen("realpath '" .. sourcepath .. "'", 'r'):read('a')
    real = real:gsub('[\n\r]*$', '')

    local dirname, _ = real:match('^(.*/)([^/]-)$')
    dirname = dirname or ''

    return dirname
end

local root = dirname(dirname(debug.getinfo(1, "S").source:sub(2)))

return {
    root = root
}
