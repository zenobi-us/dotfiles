local gears = require('gears')

return {
	default = gears.filesystem.get_themes_dir() .. "default/theme.lua",
	gtk = gears.filesystem.get_themes_dir() .. "gtk/theme.lua",
	sky = gears.filesystem.get_themes_dir() .. "sky/theme.lua",
	xresources = gears.filesystem.get_themes_dir() .. "xresources/theme.lua",
	zenburn = gears.filesystem.get_themes_dir() .. "zenburn/theme.lua",
}