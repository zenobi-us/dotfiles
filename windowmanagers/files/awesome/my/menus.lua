local hotkeys_popup = require("awful.hotkeys_popup")
local awful = require("awful")
local themes = require('themes')
local radical = require('radical')
local placement = require("awful.placement")

local my_constants = require('my.constants')
local my_settings = require('my.settings')

local capi = { client = client, mouse = mouse, screen = screen }


local systemitems = {
    { "Help", function() hotkeys_popup.show_help(nil, awful.screen.focused()) end },
    { "Docs", my_constants.terminal .. " -e man awesome" },
    { "Config", 'code ' .. awesome.conffile },
    { "Reload", awesome.restart },
    { "Logout", function() awesome.quit() end },
}

local function createDesktopMenu(options)
    local options = options or {}
    local screen = options.screen

    local menu = radical.context({ screen = screen })

    return menu
end

local function createThemesMenu()
    local menu = radical.context {}

    for key, _ in pairs(themes) do
        menu:add_item {
            text = key,
            button1 = function()
                my_settings.store.awesome.theme = key
                my_settings:save()
                awesome:restart()
            end
        }
    end
    return menu
end

local function createSystemMenu(options)
    local options = options or {}
    local screen = options.screen


    local menu = radical.context({})

    menu.wibox.screen = screen
    menu.wibox.placement = placement.under_mouse + placement.no_offscreen

    menu:add_item({
        text = "Themes",
        sub_menu = createThemesMenu()
    })

    for i_, item in pairs(systemitems) do
        menu:add_item {
            text = item[1],
            button1 = item[2]
        }
    end

    return menu
end

return {
    createSystemMenu = createSystemMenu,
    createDesktopMenu = createDesktopMenu,
}
