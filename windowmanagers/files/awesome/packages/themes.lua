local gears = require('gears')

local dirname = require('core.project').dirname

local heredir = dirname(dirname(debug.getinfo(1, "S").source:sub(2)))

-- {{{ Variable definitions
-- Themes define colours, icons, font and wallpapers.
return {
	default = gears.filesystem.get_themes_dir() .. "default/theme.lua",
	gtk = gears.filesystem.get_themes_dir() .. "gtk/theme.lua",
	sky = gears.filesystem.get_themes_dir() .. "sky/theme.lua",
	xresources = gears.filesystem.get_themes_dir() .. "xresources/theme.lua",
	zenburn = gears.filesystem.get_themes_dir() .. "zenburn/theme.lua",
	bit6theme = heredir .. "themes/bit6theme.lua",
	blackburn = heredir .. "themes/blackburn/theme.lua",
	copland = heredir .. "themes/copland/theme.lua",
	dremora = heredir .. "themes/dremora/theme.lua",
	holo = heredir .. "themes/holo/theme.lua",
	multicolor = heredir .. "themes/multicolor/theme.lua",
	powerarrow = heredir .. "themes/powerarrow/theme.lua",
	powerarrowdark = heredir .. "themes/powerarrow-dark/theme.lua",
	rainbow = heredir .. "themes/rainbow/theme.lua",
	steamburn = heredir .. "themes/steamburn/theme.lua",
	vertex = heredir .. "themes/vertex/theme.lua",
}