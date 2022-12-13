local gears = require("gears")
local awful = require("awful")
local naughty = require("naughty")
local hotkeys_popup = require("awful.hotkeys_popup")

local my_constants = require('my.constants')
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
        my_commands.previous_desktop,
        { description = "view previous workspace", group = "Workspace" }
    ),
    awful.key(
        { my_constants.modkey, "Control" }, "Right",
        my_commands.next_desktop,
        { description = "view next workspace", group = "Workspace" }
    ),

    --
    -- Gap Size
    --
    awful.key(
        { my_constants.modkey, }, "=",
        my_commands.increase_window_gap,
        { description = "increase gap", group = "Windows" }
    ),
    awful.key(
        { my_constants.modkey, "Shift" }, "=",
        my_commands.decrease_window_gap,
        { description = "decrease gap", group = "Windows" }
    ),

    --
    -- Terminal
    --
    awful.key(
        { my_constants.modkey, }, "Return",
        my_commands.launch_terminal,
        { description = "open a terminal", group = "Applications" }
    ),

    --
    -- Emojis
    --
    -- rofi -modi "emoji: rofimoji" -show emoji

    awful.key(
        { 'Control', 'Shift' }, "\\",
        my_commands.rofi_emoji,
        { description = "Emoji Picker", group = "Applications" }
    ),

    --
    -- Prompt
    --
    awful.key(
        { my_constants.modkey }, "r",
        my_commands.rofi_runner,
        { description = "run prompt", group = "System" }
    ),

    --
    -- Launcher
    --
    awful.key(
        { my_constants.modkey }, "`",
        my_commands.rofi_launcher,
        { description = "show the app launcher", group = "System" }
    ),

    --
    -- Power Menu
    --
    awful.key(
        {  }, "XF86Eject",
        my_commands.rofi_powermenu,
        { description = "show the power menu", group = "System" }
    ),

    --
    -- Window List
    --
    awful.key(
        { 'Control' }, "Tab",
        my_commands.rofi_switcher,
        { description = "show the window switcher", group = "Windows" }
    ),
    
    --
    -- Screenlock
    --
    awful.key(
        { my_constants.modkey }, "l",
        my_commands.lock_screen,
        { description = "Lock the screen", group = "System" }
    ),
    
    --
    -- Screenshot/cast
    --
    awful.key(
        {  }, "XF86Launch6",
        my_commands.lock_screen,
        { description = "Take a screenshot", group = "Applications" }
    )

--
-- MediaKeys
--
-- awful.key({}, "XF86AudioRaiseVolume", function() os.execute("pactl set-sink-volume 0 +5%") end),
-- awful.key({}, "XF86AudioLowerVolume", function() os.execute("pactl set-sink-volume 0 -5%") end),
-- awful.key({}, "XF86AudioMute", function() os.execute("pactl set-sink-mute 0 toggle") end)

))
