local hotkeys_popup = require("awful.hotkeys_popup")
local awful = require("awful")
local wibox = require("wibox")

local my_constants = require('my.constants')

local desktopitems = {
    { "Set Wallpaper", 'nitrogen' },
    { "Displays", 'arandr' }
}

local mainitems = {
    { "open terminal", my_constants.terminal }
}


local systemitems = {
    { "hotkeys", function() hotkeys_popup.show_help(nil, awful.screen.focused()) end },
    { "manual", my_constants.terminal .. " -e man awesome" },
    { "edit config", 'code ' .. awesome.conffile },
    { "Reload", awesome.restart },
    { "Logout", function() awesome.quit() end },
}

local themeitems = {}

return {
    mainmenu = awful.menu({
        items = mainitems
    }),
    desktopmenu = awful.menu({
        items = desktopitems
    }),
    systemmenu = awful.menu({
        items = systemitems
    })
}
