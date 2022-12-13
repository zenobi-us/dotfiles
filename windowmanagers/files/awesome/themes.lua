local gears = require('gears')
local tables = require('core.tables')
local project = require('core.project')


local function collect(themedir)
	local items = {}
	project.walkdir(themedir, function(item)
		items[item] = project.path_join(themedir, item, 'theme.lua')
	end)
	return items
end

local themes = tables.merge(
	collect(gears.filesystem.get_themes_dir()),
	collect(project.root .. 'themes')
)

return themes