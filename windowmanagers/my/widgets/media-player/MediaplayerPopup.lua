local beautiful = require("beautiful")
local awful = require("awful")
local watch = require("awful.widget.watch")
local wibox = require("wibox")
local gears = require("gears")

local Class = require('my.core.class')


local MediaplayerPopup = {}
local MediaplayerPopupMt = Class(MediaplayerPopup)


function MediaplayerPopup:new()
    local widget = setmetatable({
        player = '',
        players = {},
        popup = nil,
        is_open = false
    }, MediaplayerPopupMt)

    widget:render()

    return widget
end

function MediaplayerPopup:render()

    self.popup = awful.popup {
        bg = beautiful.bg_normal,
        ontop = true,
        visible = false,
        shape = gears.shape.rounded_rect,
        border_width = 1,
        border_color = beautiful.bg_focus,
        maximum_width = 400,
        offset = { y = 5 },
        widget = {}
    }
    self.popup.visible = false

end

function MediaplayerPopup:toggle()
    if self.is_open == true then
        self:close()
    else
        self:open()
    end
end

function MediaplayerPopup:close()
    self.popup.visible = false
    self.is_open = false
end

function MediaplayerPopup:open()
    self.popup:move_next_to(mouse.current_widget_geometry)
    self.popup.visible = true
    self.is_open = true
end

function MediaplayerPopup:create_player_row(player_name)

    local checkbox = wibox.widget {
        {
            checked       = player_name == self.player,
            color         = beautiful.bg_normal,
            paddings      = 2,
            shape         = gears.shape.circle,
            forced_width  = 20,
            forced_height = 20,
            check_color   = beautiful.fg_urgent,
            widget        = wibox.widget.checkbox
        },
        valign = 'center',
        layout = wibox.container.place,
    }

    checkbox:connect_signal("button::press", function()
        self.player = player_name
        self:update(self.players, self.player)
    end)

    local player = wibox.widget({
        {
            {
                checkbox,
                {
                    {
                        text = player_name,
                        align = 'left',
                        widget = wibox.widget.textbox
                    },
                    left = 10,
                    layout = wibox.container.margin
                },
                spacing = 8,
                layout = wibox.layout.align.horizontal
            },
            margins = 4,
            layout = wibox.container.margin
        },
        bg = beautiful.bg_normal,
        widget = wibox.container.background
    })

    return player

end

function MediaplayerPopup:update(players, selected_player)
    self.players = players or {}
    self.player = selected_player

    local rows = { layout = wibox.layout.fixed.vertical }

    for _, player_name in pairs(players) do
        table.insert(rows, self:create_player_row(player_name))
    end

    self.popup:setup(rows)
end

return MediaplayerPopup
