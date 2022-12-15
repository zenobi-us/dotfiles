local hotkeys_popup = require("awful.hotkeys_popup")
local awful = require("awful")
local themes = require('themes')
local naughty = require('naughty')

local my_constants = require('my.constants')
local my_settings = require('my.settings')


local mainitems = {
    { "open terminal", my_constants.terminal }
}


local systemitems = {
    { "Help", function() hotkeys_popup.show_help(nil, awful.screen.focused()) end },
    { "Docs", my_constants.terminal .. " -e man awesome" },
    { "Config", 'code ' .. awesome.conffile },
    { "Reload", awesome.restart },
    { "Logout", function() awesome.quit() end },
}

local themeitems = {}
for key, _ in pairs(themes) do
    table.insert(themeitems, {
        key,
        function ()
            my_settings.store.awesome.theme = key
            my_settings.save()
            awesome.restart()
        end
    })
end

local text = {}
for key, value in pairs(themes) do
	table.insert(text, key .. ":"..value)
end

naughty.notify({
	preset = naughty.config.presets.critical,
	title = "Themes!",
	text = tostring(table.concat(text, '\n'))
})


local desktopitems = {
    { "Set Wallpaper", 'nitrogen' },
    { "Displays", 'arandr' },
    { "Themes: [ ".. #themeitems .. " ]", awful.menu({
        items = themeitems
    })}
}


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
