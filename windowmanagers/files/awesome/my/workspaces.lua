local awful = require("awful")
local gears = require("gears")

local my_wallpaper = require('my.wallpaper')
local my_bar = require('my.bar')
local my_menu = require('my.menu')
local my_constants = require('my.constants')
local my_layouts = require('my.layouts')


root.buttons(gears.table.join(
    awful.button({}, 3, function() my_menu.mainmenu:toggle() end),
    awful.button({}, 4, awful.tag.viewnext),
    awful.button({}, 5, awful.tag.viewprev)
))

awful.screen.connect_for_each_screen(function(screen)
    my_wallpaper.set_wallpaper(screen)

    awful.tag(my_constants.tag_labels, screen, my_layouts.layouts.tile)
    screen.bar = my_bar.create(screen)
end)

