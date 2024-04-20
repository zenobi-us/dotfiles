local hotkeys_popup = require("awful.hotkeys_popup")
local awful         = require("awful")
local themes        = require('themes')
local radical       = require('radical')
local placement     = require("awful.placement")
local shape         = require("gears.shape")

local my_constants = require('my.constants')
local my_settings  = require('my.settings')
local my_commands  = require('my.commands')


local systemitems = {
    { "Help", function() hotkeys_popup.show_help(nil, awful.screen.focused()) end },
    { "Docs", my_constants.terminal .. " -e man awesome" },
    { "Config", 'code ' .. awesome.conffile },
    { "Reload", awesome.restart },
    { "Exit", my_commands.rofi_powermenu },
}

local function createThemesMenu()
    local menu = radical.context {}

    for key, _ in pairs(themes) do
        menu:add_item {
            text = key,
            margins = 3,
            button1 = function()
                my_settings.store.awesome.theme = key
                my_settings:save()
                awesome:restart()
            end
        }
    end
    return menu
end

local function createSessionMenu(options)
    local options = options or {}
    local screen = options.screen


    local menu = radical.context({
        width = 256
    })

    menu:add_widget(
        radical.widgets.header(menu, "Session"),
        { height = 28, width = 196 }
    )
    menu.wibox:set_shape(shape.rounded_rect, 5)
    menu.wibox.screen = screen
    menu.wibox.placement = placement.under_mouse + placement.no_offscreen

    menu:add_item({
        text = "Themes",
        sub_menu = createThemesMenu()
    })

    menu:add_widget(
        radical.widgets.header(menu, "System"),
        { height = 28, width = 196 }
    )
    for i_, item in pairs(systemitems) do
        menu:add_item {
            text = item[1],
            button1 = item[2]
        }
    end

    return menu
end

return {
    createSessionMenu = createSessionMenu,
}
