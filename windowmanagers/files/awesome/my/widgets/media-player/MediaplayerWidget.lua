-------------------------------------------------
-- mpris based Arc Widget for Awesome Window Manager
-- Modelled after Pavel Makhov's work
-- @author Mohammed Gaber
-- requires - playerctl
-- @copyright 2020
-------------------------------------------------
local awful = require("awful")
local beautiful = require("beautiful")
local watch = require("awful.widget.watch")
local wibox = require("wibox")
local gears = require("gears")
local naughty = require("naughty")

local MediaplayerPopup = require('my.widgets.media-player.MediaplayerPopup')

local MediaplayerWidget = {}
local MediaplayerWidgetMt = Class(MediaplayerWidget)

function MediaplayerWidget:new(options)
    local options = options or {}

    local mediaplayer = setmetatable({
        get_song_command = options.get_song_command or
            "playerctl -p %q -f '{{status}};{{xesam:artist}};{{xesam:title}}' metadata",
        pause_song_command = options.pause_song_command or "playerctl play-pause",
        next_song_command = options.next_song_command or "playerctl next",
        previous_song_command = options.previous_song_command or "playerctl previous",
        list_players_command = options.list_players_command or "playerctl -l",
        pause_icon = options.pause_icon or "",
        play_icon = options.play_icon or "",
        stop_icon = options.stop_icon or "",
        library_icon = options.library_icon or "",
        player = options.player or "",
        players = {},
        size = options.size or 18,
        interval = 1
    }, MediaplayerWidgetMt)



    mediaplayer:render()

    mediaplayer:watch()

    return mediaplayer
end

function MediaplayerWidget:fetch_player_data(callback)
    awful.spawn.easy_async(self.list_players_command, function(stdout)
        local output = {}
        for player_name in stdout:gmatch("[^\r\n]+") do
            -- ignore nameless players
            if player_name == '' or player_name == nil then
                goto continue
            end

            table.insert(output, player_name)

            ::continue::
        end

        callback(output, output[1])
    end)
end

function MediaplayerWidget:watch()
    local command = string.format(self.get_song_command, self.player)

    watch(command, self.interval, function(_, stdout)

        local player_status, current_artist, current_track = self:parse_song_data(stdout)

        self:update(player_status, current_artist, current_track)
    end)

end

--
-- Update the displayed information
--
function MediaplayerWidget:update(player_status, current_artist, current_track)

    if player_status == "Playing" then
        self.icon.image = self.play_icon
        self.widget.colors = { beautiful.widget_main_color }
        self.widget:set_text(current_artist, current_track)

    elseif player_status == "Paused" then
        self.icon.image = self.pause_icon
        self.widget.colors = { beautiful.widget_main_color }
        self.widget:set_text(current_artist, current_track)

    elseif player_status == "Stopped" then
        self.icon.image = self.stop_icon

    else -- no player is running
        self.icon.image = self.library_icon
        self.widget.colors = { beautiful.widget_red }
    end
end

function MediaplayerWidget:toggle_popup()

    if self.popup.is_open == true then
        self.popup:close()
    else
        self:fetch_player_data(function(players, selected_player)
            self.popup:update(players, selected_player)
            self.popup:open()
        end)
    end
end

--
-- Render initial widget display
--
function MediaplayerWidget:render()

    self.popup = MediaplayerPopup:new()

    self.icon = wibox.widget {
        id = "icon",
        widget = wibox.widget.imagebox,
        image = self.play_icon
    }

    self.widget = wibox.widget {

        {
            id = 'current_artist',
            widget = wibox.widget.textbox,
        },

        {
            margins = 4,
            layout = wibox.container.margin
        },

        {
            id = 'current_track',
            widget = wibox.widget.textbox
        },

        spacing = 2,
        layout = wibox.layout.align.horizontal,

        set_text = function(self, current_artist, current_track)
            self:get_children_by_id('current_artist')[1]:set_text(current_artist)
            self:get_children_by_id('current_track')[1]:set_text(current_track)
        end
    }

    self.widget:buttons(
        awful.util.table.join(
            awful.button({}, 1, function() self:toggle_popup() end),
            awful.button({}, 3, function() awful.spawn(self.pause_song_command, false) end)
        -- awful.button({}, 4, function() awful.spawn(self.next_song_command, false) end),
        -- awful.button({}, 5, function() awful.spawn(self.previous_song_command, false) end),
        )
    )

end

function MediaplayerWidget:parse_song_data(command_output)
    local words = gears.string.split(command_output, ';')

    player_status = words[1]
    current_artist = words[2]
    current_track = words[3]

    if current_song ~= nil then
        if string.len(current_song) > 18 then
            current_track = string.sub(current_song, 0, 9) .. ".."
        end
    end

    return player_status, current_artist, current_track
end

return MediaplayerWidget
