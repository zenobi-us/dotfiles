local awful = require("awful")
local beautiful = require("beautiful")
local wibox = require("wibox")
local gears = require("gears")
local radical = require("radical")

local core_workspaces = require('my.core.workspaces')
local my_menus = require('my.menus')
local my_constants = require('my.constants')
local my_commands = require('my.commands')
local media_player = require("my.widgets.media-player")
local volume = require('my.widgets.volume-widget')



local module = {}

--
-- Tasklist
--
local function createTaskListButtons()
    local buttons = gears.table.join(
        awful.button({}, 1, function(c)
            if c == client.focus then
                c.minimized = true
            else
                c:emit_signal(
                    "request::activate",
                    "tasklist",
                    { raise = true }
                )
            end
        end),
        awful.button({}, 3, function()
            awful.menu.client_list({ theme = { width = 250 } })
        end),
        awful.button({}, 4, function()
            awful.client.focus.byidx(1)
        end),
        awful.button({}, 5, function()
            awful.client.focus.byidx(-1)
        end))
    return buttons
end

local function createTaskList(screen)
    local tasklist = awful.widget.tasklist({
        screen  = screen,
        filter  = awful.widget.tasklist.filter.currenttags,
        buttons = createTaskListButtons()
    })

    return tasklist
end

--
-- Media Player
--
local function createMediaPlayer(sreen)
    local player = media_player.Widget:new()

    return player.widget
end

--
-- TagList
--
local function createTagList(screen)

    local buttons = gears.table.join(
        awful.button({}, 1, core_workspaces.moveAllScreensToTag),
        awful.button({ my_constants.modkey }, 1, function(tag) core_workspaces.pinScreenToTag(screen, tag) end)
    )

    local taglist = awful.widget.taglist({
        screen = screen,
        filter = awful.widget.taglist.filter.all,
        buttons = buttons,
    })

    return taglist
end

--
-- A Clock
--

local function createTextClock(screen)

    local month_calendar = awful.widget.calendar_popup.month({
        position = "tr",
        screen = screen,
        margin = 5,
        spacing = 10,
        week_numbers = true,
        start_sunday = true,
    })

    local clock = wibox.widget.textclock()

    clock:connect_signal("button::press", function(x, y, button, mods, widget)
        month_calendar.screen = screen
        month_calendar:toggle()
    end)

    local widget = wibox.widget({
        {
            id = "system-clock",
            clock,
            spacing = 2,
            layout = wibox.layout.align.horizontal
        },
        bg = "#333333",
        widget = wibox.container.background
    })

    return widget
end

local function createVolumeControl(screen)
    return volume.widget({ widget_type = volume.types.icon })
end

local function createSystray(screen)
    local tray = wibox.widget.systray()
    tray.base_size = 20

    return tray
end

--
-- A Text Button
--
local function createMenuBar(options)
    options = options or {}
    local text = options.text
    local menu = options.menu

    local bar_menu, bar_widget = radical.bar({
        item_style = radical.item.style.rounded,
        sub_menu_on = 1
    })

    bar_menu:add_item({ text = text, sub_menu = menu })

    return bar_widget
end

--
-- Main
--
local function new(screen)
    local bar = awful.wibar({
        position = "top",
        screen = screen,
        height = 22,
        bg = beautiful.panel,
        fg = beautiful.fg_normal
    })

    bar:setup {
        layout = wibox.layout.align.horizontal,

        { -- Left widgets
            layout = wibox.layout.fixed.horizontal,

            wibox.widget.imagebox(beautiful.spr5px),
            createTagList(screen),
            wibox.widget.imagebox(beautiful.spr5px),
        },

        createTaskList(screen),

        { -- Right widgets
            layout = wibox.layout.fixed.horizontal,
            spacing = 2,

            createMediaPlayer(screen),
            wibox.widget.imagebox(beautiful.spr5px),

            createSystray(screen),
            wibox.widget.imagebox(beautiful.spr5px),

            createVolumeControl(),

            wibox.widget.imagebox(beautiful.spr5px),

            createTextClock(screen),

            wibox.widget.imagebox(beautiful.spr5px),

            createMenuBar({
                text = "System",
                menu = my_menus.createSessionMenu({ screen = screen })
            }),

            wibox.widget.imagebox(beautiful.spr5px),

        },

    }

    return bar
end

--
-- Exports
--

return setmetatable(module, { __call = function(_, ...) return new(...) end })
