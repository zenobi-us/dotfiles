local gears = require("gears")
local awful = require("awful")
local naughty = require("naughty")
local hotkeys_popup = require("awful.hotkeys_popup")

local core_windows = require('core.windows')
local core_workspaces = require('core.workspaces')

local my_constants = require('my.constants')
local my_settings = require('my.settings')

root.keys(gears.table.join(
    awful.key(
        { my_constants.modkey, }, "s",
        hotkeys_popup.show_help,
        { description = "show help", group = "awesome" }
    ),
    
    awful.key(
        { my_constants.modkey, "Control" }, "r",
        awesome.restart,
        { description = "reload awesome", group = "awesome" }
    ),

    --
    -- Workspace Switching
    --
    awful.key(
        { my_constants.modkey, "Control" }, "Left",
        core_windows.moveAllScreensToPreviousTag,
        { description = "view previous", group = "tag" }
    ),
    awful.key(
        { my_constants.modkey, "Control" }, "Right",
        core_windows.moveAllScreensToNextTag,
        { description = "view next", group = "tag" }
    ),

    --
    -- Gap Size
    --
    awful.key(
        { my_constants.modkey, }, "=",
        function()
            local gap = core_workspaces.increaseGapOnAllTags()
            my_settings.store.awesome.gap = gap
            my_settings:save()
        end,
        { description = "increase gap", group = "layout" }
    ),
    awful.key(
        { my_constants.modkey, "Shift" }, "=",
        function()
            local gap = core_workspaces.decreseGapOnAllTags()
            my_settings.store.awesome.gap = gap
            my_settings:save()
        end,
        { description = "decrease gap", group = "layout" }
    ),

    --
    -- Terminal
    --
    awful.key(
        { my_constants.modkey, }, "Return",
        function() awful.spawn(my_constants.terminal) end,
        { description = "open a terminal", group = "launcher" }
    ),

    --
    -- Prompt
    --
    awful.key(
        { my_constants.modkey }, "r",
        function() awful.spawn(
            my_constants.home .. 
            '/.config/rofi/launchers/launcher.sh ' .. 
            my_settings.store.rofi.runner.type ..  -- type-3
            ' ' ..
            my_settings.store.rofi.runner.style ..  -- style-2
            ' ' ..
            my_settings.store.rofi.runner.theme ..  -- onedark
            ' ' ..
            'run'
        ) end,
        { description = "run prompt", group = "launcher" }
    ),

    --
    -- Launcher
    --
    awful.key(
        { 'Control' }, "space",
        function() awful.spawn(
            my_constants.home .. 
            '/.config/rofi/launchers/launcher.sh ' .. 
            my_settings.store.rofi.launcher.type ..  -- type-3
            ' ' ..
            my_settings.store.rofi.launcher.style ..  -- style-2
            ' ' ..
            my_settings.store.rofi.launcher.theme ..  -- onedark
            ' ' ..
            'drun'
        ) end,
        { description = "show the menubar", group = "launcher" }
    ),

    --
    -- Power Menu
    --
    awful.key(
        {  }, "XF86Eject",
        function() awful.spawn(
            my_constants.home ..
            '/.config/rofi/launchers/launcher.sh' ..
            my_settings.store.rofi.powermenu.type ..  -- type-3
            ' ' ..
            my_settings.store.rofi.powermenu.style ..  -- style-2
            ' ' ..
            my_settings.store.rofi.powermenu.theme ..  -- onedark
            ' ' ..
            'window'
        ) end,
        { description = "show the menubar", group = "launcher" }
    ),

    --
    -- Window List
    --
    awful.key(
        { 'Control' }, "Tab",
        function() awful.spawn(
            my_constants.home ..
            '/.config/rofi/launchers/launcher.sh' ..
            my_settings.store.rofi.switcher .type ..  -- type-3
            ' ' ..
            my_settings.store.rofi.switcher .style ..  -- style-2
            ' ' ..
            my_settings.store.rofi.switcher .theme ..  -- onedark
            ' ' ..
            'window'
        ) end,
        { description = "show the menubar", group = "launcher" }
    ),
    
    --
    -- Screenlock
    --
    awful.key(
        { my_constants.modkey }, "l",
        function ()
            awful.spawn("sync")
            awful.spawn("xautolock -locknow -nowlocker i3lock")
        end
    )

--
-- MediaKeys
--
-- awful.key({}, "XF86AudioRaiseVolume", function() os.execute("pactl set-sink-volume 0 +5%") end),
-- awful.key({}, "XF86AudioLowerVolume", function() os.execute("pactl set-sink-volume 0 -5%") end),
-- awful.key({}, "XF86AudioMute", function() os.execute("pactl set-sink-mute 0 toggle") end)

))