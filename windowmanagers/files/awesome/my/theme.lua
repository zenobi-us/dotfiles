local naughty = require("naughty")
local beautiful = require("beautiful")
local gears = require("gears")

local project = require('core.project')

-- {{{ Variable definitions
-- Themes define colours, icons, font and wallpapers.
local themes = {
	default = gears.filesystem.get_themes_dir() .. "default/theme.lua",
	gtk = gears.filesystem.get_themes_dir() .. "gtk/theme.lua",
	sky = gears.filesystem.get_themes_dir() .. "sky/theme.lua",
	xresources = gears.filesystem.get_themes_dir() .. "xresources/theme.lua",
	zenburn = gears.filesystem.get_themes_dir() .. "zenburn/theme.lua",
	bit6theme = project.root .. "themes/bit6theme.lua",
	blackburn = project.root .. "themes/blackburn/theme.lua",
	copland = project.root .. "themes/copland/theme.lua",
	dremora = project.root .. "themes/dremora/theme.lua",
	holo = project.root .. "themes/holo/theme.lua",
	multicolor = project.root .. "themes/multicolor/theme.lua",
	powerarrow = project.root .. "themes/powerarrow/theme.lua",
	powerarrowdark = project.root .. "themes/powerarrow-dark/theme.lua",
	rainbow = project.root .. "themes/rainbow/theme.lua",
	steamburn = project.root .. "themes/steamburn/theme.lua",
	vertex = project.root .. "themes/vertex/theme.lua",
}

beautiful.init(themes.zenburn)
beautiful.useless_gap = 0

for s = 1, screen.count() do
	gears.wallpaper.maximized(beautiful.wallpaper, s, true)
end
