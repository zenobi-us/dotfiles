local gears = require('gears')
local tables = require('my.core.tables')
local project = require('my.core.project')

local function create_theme_table(themedir)
	local items = {}
	project.walkdir(themedir, function(item)
		local dir = project.path_join(themedir, item, 'theme.lua')
		items[item] = dir
	end)
	return items
end

local themes = tables.merge(
	{},
	create_theme_table(gears.filesystem.get_themes_dir()),
	create_theme_table(project.path_join(gears.filesystem.get_configuration_dir(), "themes"))
)

local text = {}
for key, value in pairs(themes) do
	table.insert(text, key .. " : " .. value)
end


return themes
