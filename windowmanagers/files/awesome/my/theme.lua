local beautiful = require("beautiful")
local gears = require("gears")
local themes = require('packages.themes')
local my_settings = require('my.settings')

beautiful.init(themes[my_settings.store.awesome.theme])

beautiful.useless_gap = my_settings.store.awesome.gap

for s = 1, screen.count() do
	gears.wallpaper.maximized(beautiful.wallpaper, s, true)
end
