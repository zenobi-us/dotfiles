local hotkeys_popup = require("awful.hotkeys_popup")
local awful = require("awful")
local beautiful = require("beautiful")

local constants = require('my.constants')

local function createSystemMenuItems()
    return {
        { "hotkeys", function() hotkeys_popup.show_help(nil, awful.screen.focused()) end },
        { "manual", constants.terminal .. " -e man awesome" },
        { "edit config", constants.editor_cmd .. " " .. awesome.conffile },
        { "restart", awesome.restart },
        { "quit", function() awesome.quit() end },
    }
end

local function createMenu()
    local menu = awful.menu({
        items = {
            { "System", createSystemMenuItems(), beautiful.awesome_icon },
            { "open terminal", constants.terminal }
        }
    })
    return menu
end

local mainmenu = createMenu()

return {
    createSystemMenuItems = createSystemMenuItems,
    createMenu = createMenu,
    mainmenu = mainmenu
}
