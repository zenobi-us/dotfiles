local beautiful = require("beautiful")
local gears = require("gears")
local themes = require('packages.themes')
local my_settings = require('my.settings')

beautiful.useless_gap = my_settings.gap or 0
beautiful.init(themes.zenburn)

for s = 1, screen.count() do
	gears.wallpaper.maximized(beautiful.wallpaper, s, true)
end
