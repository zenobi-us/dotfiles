local naughty = require("naughty")
local beautiful = require("beautiful")
local gears = require("gears")
local themes = require('packages.themes')
local my_settings = require('my.settings')
local nice = require("nice")


beautiful.useless_gap = my_settings.gap
beautiful.init(themes.zenburn)
nice()

for s = 1, screen.count() do
	gears.wallpaper.maximized(beautiful.wallpaper, s, true)
end
