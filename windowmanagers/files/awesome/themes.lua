local gears = require('gears')
local tables = require('core.tables')
local project = require('core.project')


local function collect(themeDir)
	
end

return tables.merge(
	-- default = gears.filesystem.get_themes_dir() .. "default/theme.lua",
	-- gtk = gears.filesystem.get_themes_dir() .. "gtk/theme.lua",
	-- sky = gears.filesystem.get_themes_dir() .. "sky/theme.lua",
	-- xresources = gears.filesystem.get_themes_dir() .. "xresources/theme.lua",
	-- zenburn = gears.filesystem.get_themes_dir() .. "zenburn/theme.lua",
	collect(gears.filesystem.get_themes_dir()),
	collect(project.root .. 'awesome-copycats/themes'),
	collect(project.root .. 'awesome-pro/themes')
)