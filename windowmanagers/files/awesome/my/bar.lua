local awful = require("awful")
local beautiful = require("beautiful")
local wibox = require("wibox")
local gears = require("gears")

local my_menus = require('my.menus')
local my_constants = require('my.constants')


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
local function createTagListButtons()
    local buttons = gears.table.join(
        awful.button({}, 1, function(tag)
            local i = awful.tag.getidx(tag)
            for screen = 1, screen.count() do
                local tag = awful.tag.gettags(screen)[i]
                if tag then
                    awful.tag.viewonly(tag)
                end
            end
        end),
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
    return buttons
end

local function createTagList(screen)
    local taglist = awful.widget.taglist({
        screen = screen,
        filter = awful.widget.taglist.filter.all,
        buttons = createTagListButtons()
    })
    return taglist
end

--
-- Launcher
--
local function createLauncher(icon, menu)
    local launcher = awful.widget.launcher({
        image = icon,
        menu = menu
    })
    return launcher
end

--
-- Tiling Style
--
-- Create an imagebox widget which will contain an icon indicating which layout we're using.
-- We need one layoutbox per screen.
local function createLayoutControl(screen)
    local box = awful.widget.layoutbox(screen)
    box:buttons(gears.table.join(
        awful.button({}, 1, function() awful.layout.inc(1) end),
        awful.button({}, 3, function() awful.layout.inc(-1) end),
        awful.button({}, 4, function() awful.layout.inc(1) end),
        awful.button({}, 5, function() awful.layout.inc(-1) end)
    ))
    return box
end

--
-- Main
--
local function create(screen)
    local bar = awful.wibar({ position = "top", screen = screen })
    
    bar:setup {
        layout = wibox.layout.align.horizontal,

        { -- Left widgets
            layout = wibox.layout.fixed.horizontal,

            createLauncher(beautiful.awesome_icon, my_menus.mainmenu),
            createTagList(screen),
        },

        createTaskList(screen),

        { -- Right widgets
            layout = wibox.layout.fixed.horizontal,
            wibox.widget.systray({
                height = 48
            }),
            wibox.widget.textclock(),
            createLauncher(beautiful.awesome_icon, my_menus.systemmenu),
            createLayoutControl()
        },

    }

    return bar
end

--
-- Exports
--
return {
    createTagList = createTagList,
    createTagListButtons = createTagListButtons,
    createTaskList = createTaskList,
    createTaskListButtons = createTaskListButtons,
    createLauncher = createLauncher,
    createLayoutControl = createLayoutControl,
    create = create,
}
