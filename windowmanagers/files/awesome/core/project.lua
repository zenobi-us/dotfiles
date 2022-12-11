local lfs = require('lfs')

local function dirname(sourcepath)
    local real = io.popen("realpath '" .. sourcepath .. "'", 'r'):read('a')
    real = real:gsub('[\n\r]*$', '')

    local dirname, _ = real:match('^(.*/)([^/]-)$')
    dirname = dirname or ''

    return dirname
end


local function path_join(...)
    local pathseparator = package.config:sub(1,1);
    local elements = {...}
    return table.concat(elements, pathseparator)
end

local function collect(themeDir)
	local items = {}
    for entity in lfs.dir(themeDir) do
        if entity=="." or entity==".." then
			goto continue
		end

		items[entity] = path_join(themeDir, entity, 'theme.lua')

		::continue::
	end
	
	return items
end

local root = dirname(dirname(debug.getinfo(1, "S").source:sub(2)))

return {
    collect = collect,
    path_join = path_join,
    dirname = dirname,
    root = root
}
