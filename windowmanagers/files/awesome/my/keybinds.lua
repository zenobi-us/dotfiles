local gears = require("gears")
local awful = require("awful")
local hotkeys_popup = require("awful.hotkeys_popup")
local menubar = require("menubar")

local core_windows = require('core.windows')
local core_workspaces = require('core.workspaces')
local my_constants = require('my.constants')


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
        function() core_workspaces.increaseGapOnAllTags() end,
        { description = "increase gap", group = "layout" }
    ),
    awful.key(
        { my_constants.modkey, "Shift" }, "=",
        function() core_workspaces.decreseGapOnAllTags() end,
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
        function() awful.util.spawn('rofi -show run') end,
        { description = "run prompt", group = "launcher" }
    ),

    --
    -- Launcher
    --
    awful.key(
        { my_constants.modkey }, "space",
        function() awful.util.spawn('rofi -show drun') end,
        { description = "show the menubar", group = "launcher" }
    ),

    --
    -- Window List
    --
    awful.key(
        { my_constants.modkey , "Tab"}, "",
        function() awful.util.spawn('rofi -show window') end,
        { description = "show the menubar", group = "launcher" }
    ),

    --
    -- Screenlock
    --
    awful.key(
        { my_constants.modkey }, "l",
        function ()
            awful.util.spawn("sync")
            awful.util.spawn("xautolock -locknow -nowlocker i3lock")
        end
    )

--
-- MediaKeys
--
-- awful.key({}, "XF86AudioRaiseVolume", function() os.execute("pactl set-sink-volume 0 +5%") end),
-- awful.key({}, "XF86AudioLowerVolume", function() os.execute("pactl set-sink-volume 0 -5%") end),
-- awful.key({}, "XF86AudioMute", function() os.execute("pactl set-sink-mute 0 toggle") end)

))
