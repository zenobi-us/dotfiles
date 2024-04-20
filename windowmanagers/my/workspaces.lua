local awful = require("awful")
local gears = require("gears")

local my_bar = require('my.bar')
local my_menus = require('my.menus')
local my_constants = require('my.constants')
local my_layouts = require('my.layouts')

awful.screen.connect_for_each_screen(function(screen)
    awful.tag(my_constants.tag_labels, screen, my_layouts.layouts.tile)
    screen.bar = my_bar(screen)
end)