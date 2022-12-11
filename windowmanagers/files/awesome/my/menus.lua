local hotkeys_popup = require("awful.hotkeys_popup")
local awful = require("awful")
local themes = require('themes')

local my_constants = require('my.constants')
local my_settings = require('my.settings')

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
for key, _ in ipairs(themes) do
    themeitems[key] = function ()
        my_settings.store.awesome.theme = key
    end
end

return {
    mainmenu = awful.menu({
        items = mainitems
    }),
    thememenu = awful.menu({
        items = themeitems
    }),
    desktopmenu = awful.menu({
        items = desktopitems
    }),
    systemmenu = awful.menu({
        items = systemitems
    })
}
