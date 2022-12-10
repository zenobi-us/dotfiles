local awful = require("awful")
local beautiful = require("beautiful")
local wibox = require("wibox")
local gears = require("gears")

local my_menu = require('my.menu')
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
-- Prompt
--
local function createPrompBox()
    local promptbox = awful.widget.prompt()
    return promptbox
end

--
-- Launcher
--
local function createLauncher(menu)
    local launcher = awful.widget.launcher({
        image = beautiful.awesome_icon,
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
    local promptbox = createPrompBox()
    local taglist = createTagList(screen)
    local launcher = createLauncher(my_menu.mainmenu)
    local layoutcontrol = createLayoutControl()


    bar:setup {
        layout = wibox.layout.align.horizontal,

        { -- Left widgets
            layout = wibox.layout.fixed.horizontal,
            launcher,
            taglist,
            promptbox,
        },

        createTaskList(screen),

        { -- Right widgets
            layout = wibox.layout.fixed.horizontal,
            wibox.widget.systray({
                height = 48
            }),
            wibox.widget.textclock(),
            layoutcontrol
        },

    }

    bar.promptbox = promptbox
    bar.launcher = launcher
    bar.taglist = taglist
    bar.layoutcontrol = layoutcontrol

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
    createPrompBox = createPrompBox,
    createLauncher = createLauncher,
    createLayoutControl = createLayoutControl,
    create = create,
}
