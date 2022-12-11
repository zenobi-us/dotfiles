local gears = require("gears")
local awful = require("awful")
local naughty = require("naughty")
local hotkeys_popup = require("awful.hotkeys_popup")

local core_windows = require('core.windows')
local core_workspaces = require('core.workspaces')

local my_constants = require('my.constants')
local my_settings = require('my.settings')
local my_commands = require('my.commands')

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
        { description = "view previous workspace", group = "tag" }
    ),
    awful.key(
        { my_constants.modkey, "Control" }, "Right",
        core_windows.moveAllScreensToNextTag,
        { description = "view next workspace", group = "tag" }
    ),

    --
    -- Gap Size
    --
    awful.key(
        { my_constants.modkey, }, "=",
        my_commands.increase_window_gap,
        { description = "increase gap", group = "layout" }
    ),
    awful.key(
        { my_constants.modkey, "Shift" }, "=",
        my_commands.decrease_window_gap,
        { description = "decrease gap", group = "layout" }
    ),

    --
    -- Terminal
    --
    awful.key(
        { my_constants.modkey, }, "Return",
        my_commands.launch_terminal,
        { description = "open a terminal", group = "launcher" }
    ),

    --
    -- Emojis
    --
    -- rofi -modi "emoji: rofimoji" -show emoji

    awful.key(
        { 'Control', 'Shift' }, "\\",
        my_commands.rofi_emoji,
        { description = "Emoji Picker", group = "launcher" }
    ),

    --
    -- Prompt
    --
    awful.key(
        { my_constants.modkey }, "r",
        my_commands.rofi_runner,
        { description = "run prompt", group = "launcher" }
    ),

    --
    -- Launcher
    --
    awful.key(
        { 'Control' }, "space",
        my_commands.rofi_launcher,
        { description = "show the app launcher", group = "launcher" }
    ),

    --
    -- Power Menu
    --
    awful.key(
        { 'any' }, "XF86Eject",
        my_commands.rofi_powermenu,
        { description = "show the power menu", group = "launcher" }
    ),

    --
    -- Window List
    --
    awful.key(
        { 'Control' }, "Tab",
        my_commands.rofi_switcher,
        { description = "show the window switcher", group = "launcher" }
    ),
    
    --
    -- Screenlock
    --
    awful.key(
        { my_constants.modkey }, "l",
        my_commands.lock_screen,
        { description = "Lock the screen", group = "launcher" }
    )

--
-- MediaKeys
--
-- awful.key({}, "XF86AudioRaiseVolume", function() os.execute("pactl set-sink-volume 0 +5%") end),
-- awful.key({}, "XF86AudioLowerVolume", function() os.execute("pactl set-sink-volume 0 -5%") end),
-- awful.key({}, "XF86AudioMute", function() os.execute("pactl set-sink-mute 0 toggle") end)

))
