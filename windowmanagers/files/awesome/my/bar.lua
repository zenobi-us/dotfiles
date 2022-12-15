local awful = require("awful")
local beautiful = require("beautiful")
local wibox = require("wibox")
local gears = require("gears")
local radical = require("radical")

local core_workspaces = require('my.core.workspaces')
local my_menus = require('my.menus')
local my_constants = require('my.constants')
local my_commands = require('my.commands')


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
-- TagList
--

local function createTagList(screen)

    local buttons = gears.table.join(
        awful.button({}, 1, core_workspaces.moveAllScreensToTag),
        awful.button({ my_constants.modkey }, 1, function(t)
            if client.focus then
                client.focus:move_to_tag(t)
            end
        end),
        awful.button({}, 3, awful.tag.viewtoggle),
        awful.button({ my_constants.modkey }, 3, function(t)
            if client.focus then
                client.focus:toggle_tag(t)
            end
        end),
        awful.button({}, 4, function(t) awful.tag.viewnext(t.screen) end),
        awful.button({}, 5, function(t) awful.tag.viewprev(t.screen) end)
    )

    local taglist = awful.widget.taglist({
        screen = screen,
        filter = awful.widget.taglist.filter.all,
        buttons = buttons,
    })

    return taglist
end

--
-- A Launcher
--
-- local function createLauncher(options)
--     local icon = options.icon
--     local leftclick = options.leftclick

--     local launcher = awful.widget.launcher({
--         image = icon,
--         menu = leftclick
--     })

--     return launcher
-- end

--
-- A Button
--
local function createButton(options)
    options = options or {}
    local icon = options.icon
    local leftclick = options.leftclick
    local middleclick = options.middleclick
    local rightclick = options.rightclick


    local button = awful.widget.button({
        image = icon
    })

    button:buttons(gears.table.join(
        button:buttons(),
        awful.button({}, 1, nil, leftclick),
        awful.button({}, 2, nil, middleclick),
        awful.button({}, 3, nil, rightclick)
    ))
    return button
end

--
-- A Text Button
--
local function createMenuBar(options)
    options = options or {}
    local text = options.text
    local menu = options.menu

    -- local bar_menu, bar_widget = radical.bar({
    --     item_style           = radical.item.style.rounded,
    -- })
    
    local button = wibox.widget.textbox(text)
    button:set_menu(menu, "button::pressed", 1)

    -- bar_menu:add_item(button)
    
    return button
end

--
-- Tiling Style
--
-- Create an imagebox widget which will contain an icon indicating which layout we're using.
-- We need one layoutbox per screen.
-- local function createLayoutControl(screen)
--     local box = awful.widget.layoutbox(screen)
--     box:buttons(gears.table.join(
--         awful.button({}, 1, function() awful.layout.inc(1) end),
--         awful.button({}, 3, function() awful.layout.inc(-1) end)
--     ))
--     return box
-- end


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

    local systemMenu = my_menus.createSystemMenu({ screen = screen })

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
            
            wibox.widget.systray({
                height = 48
            }),

            wibox.widget.imagebox(beautiful.spr5px),

            wibox.widget.textclock(),

            wibox.widget.imagebox(beautiful.spr5px),

            createMenuBar({
                text = "System",
                menu = my_menus.createSystemMenu({ screen = screen })
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
