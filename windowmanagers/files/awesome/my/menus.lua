local hotkeys_popup = require("awful.hotkeys_popup")
local awful = require("awful")
local themes = require('themes')
local radical = require('radical')

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

local function createSystemMenu(options)
    local options = options or {}
    local screen = options.screen

    local menu = radical.context({
        screen = screen,
        position = "right",
        x = 0,
        y = 0
    })

    menu:add_item({
        text = "Themes",
        sub_menu = function()
            local smenu = radical.context {}

            for key, _ in pairs(themes) do
                smenu:add_item {
                    text = key,
                    button1 = function()
                        my_settings.store.awesome.theme = key
                        my_settings.save()
                        awesome.restart()
                    end
                }
            end
            return smenu

        end
    })

    function menu:toggle()
        self.screen = screen
        self.visible = not self.visible
    end

    return menu
end

return {
    createSystemMenu = createSystemMenu,
    createDesktopMenu = createDesktopMenu,
}
