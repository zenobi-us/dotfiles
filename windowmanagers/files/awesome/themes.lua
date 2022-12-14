local gears = require('gears')
local naughty = require('naughty')

local tables = require('my.core.tables')
local project = require('my.core.project')


local function collect(themedir)
	local items = {}
	project.walkdir(themedir, function(item)
		local dir = project.path_join(themedir, item, 'theme.lua')
		items[item] = dir
	end)
	return items
end


local themes = tables.merge(
	collect(gears.filesystem.get_themes_dir()),
	collect(project.root .. 'themes')
)

return themes