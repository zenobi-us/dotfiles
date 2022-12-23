local gears = require('gears')
local awful = require('awful')
local wibox = require('wibox')
local beautiful = require('beautiful')

local my_constants = require('my.constants')
local my_commands = require('my.commands')


local function createWindowEvents()
    local buttons = gears.table.join(
        awful.button({}, 1, function(c)
            c:emit_signal("request::activate", "mouse_click", { raise = true })
        end),
        awful.button({ my_constants.modkey }, 1, function(c)
            c:emit_signal("request::activate", "mouse_click", { raise = true })
            awful.mouse.client.move(c)
        end),
        awful.button({ my_constants.modkey }, 3, function(c)
            c:emit_signal("request::activate", "mouse_click", { raise = true })
            awful.mouse.client.resize(c)
        end)
    )
    return buttons
end

local function createWindowTitleBarButton(window)
    -- buttons for the titlebar
    local buttons = gears.table.join(
        awful.button({}, 1, function()
            window:emit_signal("request::activate", "titlebar", { raise = true })
            awful.mouse.client.move(window)
        end),
        awful.button({}, 3, function()
            window:emit_signal("request::activate", "titlebar", { raise = true })
            awful.mouse.client.resize(window)
        end)
    )
    return buttons
end

local function createWindowTitleBar(window)
    local buttons = createWindowTitleBarButton(window)

    return {
        layout = wibox.layout.align.horizontal,
        
        { -- Left
            layout = wibox.layout.fixed.horizontal,

            awful.titlebar.widget.iconwidget(window),
            buttons = buttons,
        },

        { -- Middle
            layout = wibox.layout.flex.horizontal,

            { -- Title
                align  = "center",
                widget = awful.titlebar.widget.titlewidget(window),
            },
            buttons = buttons,
        },

        { -- Right
            layout = wibox.layout.fixed.horizontal(),

            awful.titlebar.widget.floatingbutton(window),
            awful.titlebar.widget.maximizedbutton(window),
            -- awful.titlebar.widget.stickybutton(window),
            -- awful.titlebar.widget.ontopbutton(window),
            awful.titlebar.widget.closebutton(window),
        },
    }
end

local function createWindowKeybinds()
    local keybinds = gears.table.join(

        awful.key(
            { my_constants.modkey, "Control" }, "space",
            awful.client.floating.toggle,
            { description = "toggle floating", group = "client" }
        ),

        awful.key(
            { my_constants.modkey, }, "Up",
            function(c)
                c.maximized = not c.maximized
                c:raise()
            end,
            { description = "(un)maximize", group = "client" }
        ),

        awful.key({ my_constants.modkey, "Control", "Shift" }, "Left",
            my_commands.move_window_previous_desktop,
            { description = "move client to previous tag and switch to it", group = "layout" }
        ),

        awful.key({ my_constants.modkey, "Control", "Shift" }, "Right",
            my_commands.move_window_next_desktop,
            { description = "move client to next tag and switch to it", group = "layout" }
        )

    )
    return keybinds
end

--
-- Events
--

-- Add a titlebar if titlebars_enabled is set to true in the rules.
client.connect_signal("request::titlebars", function(window)
    local titlebar = createWindowTitleBar(window)
    awful.titlebar(window):setup(titlebar)
end)

client.connect_signal("mouse::enter", function(c)
    c:emit_signal("request::activate", "mouse_enter", { raise = false })
end)

client.connect_signal("manage", function(c)
    -- Set the windows at the slave,
    -- i.e. put it at the end of others instead of setting it master.
    -- if not awesome.startup then awful.client.setslave(c) end

    if awesome.startup
        and not c.size_hints.user_position
        and not c.size_hints.program_position then
        -- Prevent clients from being unreachable after screen count changes.
        awful.placement.no_offscreen(c)
    end
end)

client.connect_signal("focus", function(c)
    c.border_color = beautiful.border_focus or ""
end)
client.connect_signal("unfocus", function(c)
    c.border_color = beautiful.border_normal or ""
end)

--
-- Rules
--
awful.rules.rules = {
    -- All clients will match this rule.
    {
        properties = {
            border_width = beautiful.border_width,
            border_color = beautiful.border_normal,
            focus = awful.client.focus.filter,
            raise = true,
            keys = createWindowKeybinds(),
            buttons = createWindowEvents(),
            screen = awful.screen.preferred,
            placement = awful.placement.no_overlap + awful.placement.no_offscreen,
            size_hint_honor = false
        },
        rule = {},
    },

    -- Floating clients.
    {
        properties = { floating = true },
        rule_any = {
            instance = {
                "pinentry",
            },
            class = {
                "Arandr",
                "Blueman-manager",
                "Gpick",
                "Wpa_gui",
            },

            -- Note that the name property shown in xprop might be set slightly after creation of the client
            -- and the name shown there might not match defined rules here.
            name = {
                "Event Tester", -- xev.
            },

            role = {
                "AlarmWindow", -- Thunderbird's calendar.
                "ConfigManager", -- Thunderbird's about:config.
                "pop-up", -- e.g. Google Chrome's (detached) Developer Tools.
            }
        }
    },

    -- Add titlebars to normal clients and dialogs
    {
        properties = { titlebars_enabled = true },
        rule_any = {
            type = { "normal", "dialog" }
        }
    },

    --
    -- No Titlebars For Term
    --
    {
        properties = { titlebars_enabled = false, border_width = 0 },
        rule_any = {
            class = { "URxvt"}
        }
    },

    --
    -- No Titlebars For Term
    --
    {
        properties = { titlebars_enabled = false, border_width = 0 },
        rule_any = {
            class = { "Alacritty"}
        }
    },

    --
    -- No Titlebars For VSCode
    --
    {
        properties = { titlebars_enabled = false, border_width = 0 },
        rule_any = {
            class = { "Code" , 'code'}
        }
    },

    --
    -- No Titlebars For Chrome Apps
    --
    {
        properties = {
            titlebars_enabled = false,
            border_width = 0,
            placement = awful.placement.no_overlap + awful.placement.no_offscreen,
            floating = false
        },
        rule_any = {
            class = { "chrome-app", "Google-chrome" }
        }
    },

    --
    -- Plank
    --
    {
        properties = {
            border_width = 0,
            floating = true,
            sticky = true,
            ontop = true,
            focusable = false,
            below = false
        },
        rule = {
            class = "Plank"
        }
    }

    -- Set Firefox to always map on the tag named "2" on screen 1.
    -- { rule = { class = "Firefox" },
    --   properties = { screen = 1, tag = "2" } },
}
