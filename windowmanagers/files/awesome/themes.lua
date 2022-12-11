local gears = require('gears')
local tables = require('core.tables')
local project = require('core.project')
local lfs = require('lfs')

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

return tables.merge(
	collect(gears.filesystem.get_themes_dir()),
	collect(project.root .. 'themes')
)