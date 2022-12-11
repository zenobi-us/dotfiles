local hotkeys_popup = require("awful.hotkeys_popup")
local awful = require("awful")
local radical  = require("radical")
local beautiful  = require("beautiful")
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

local menu = radical.context{}
menu:add_item {text="Screen 1",button1=function(_menu,item,mods) print("Hello World! ") end}
menu:add_item {text="Screen 9",icon= beautiful.awesome_icon}
menu:add_item {text="Sub Menu",sub_menu = function()
    local smenu = radical.context{}
    smenu:add_item{text="item 1"}
    smenu:add_item{text="item 2"}
    return smenu
end}

-- To add the menu to a widget:
local mytextbox = wibox.widget.textbox()
mytextbox:set_menu(menu, "button::pressed", 3) -- 3 = right mouse button, 1 = left mouse button

-- To add a key binding on a "box" menu (and every other types)
menu:add_key_binding({"Mod4"},",")


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
