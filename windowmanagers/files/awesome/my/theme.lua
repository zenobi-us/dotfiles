local beautiful = require("beautiful")
local awful = require("awful")
local gears = require("gears")
local themes = require('themes')
local my_settings = require('my.settings')

beautiful.init(themes[my_settings.store.awesome.theme])

beautiful.useless_gap = my_settings.store.awesome.gap

awful.screen.connect_for_each_screen(function(screen)
	-- beautiful.xresources.set_dpi(screen.dpi, screen)

	gears.wallpaper.maximized(beautiful.wallpaper, screen, true)
end)
