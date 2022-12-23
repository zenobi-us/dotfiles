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
local Icons = require('my.widgets.media-player.icons')

local MediaplayerWidget = {}
local MediaplayerWidgetMt = Class(MediaplayerWidget)

local DEFAULT_PLAYERCTLCMD_GETMETADATA = "playerctl -p %q -f '{{status}};{{xesam:artist}};{{xesam:album}};{{xesam:title}};{{mpris:arturl}}' metadata"
local DEFAULT_PLAYERCTLCMD_PLAYPAUSESONG = "playerctl play-pause"
local DEFAULT_PLAYERCTLCMD_NEXTSONG = "playerctl next"
local DEFAULT_PLAYERCTLCMD_PREVIOUSSONG = "playerctl previous"
local DEFAULT_PLAYERCTLCMD_LISTSOURCES = "playerctl -l"


function MediaplayerWidget:new(options)
    local options = options or {}

    local mediaplayer = setmetatable({
        get_song_command = options.get_song_command or DEFAULT_PLAYERCTLCMD_GETMETADATA,
        pause_song_command = options.pause_song_command or DEFAULT_PLAYERCTLCMD_PLAYPAUSESONG,
        next_song_command = options.next_song_command or DEFAULT_PLAYERCTLCMD_NEXTSONG,
        previous_song_command = options.previous_song_command or DEFAULT_PLAYERCTLCMD_PREVIOUSSONG,
        list_players_command = options.list_players_command or DEFAULT_PLAYERCTLCMD_LISTSOURCES,
        icons = {
            pause = options.pause_icon or Icons.PauseIcon,
            play = options.play_icon or Icons.PlayIcon,
            stop = options.stop_icon or Icons.StopIcon,
            library = options.library_icon or Icons.LibraryIcon,
        },
        glyphs = {
            pause = options.pause_glyph or '||',
            play = options.play_glyph or '>',
            stop = options.stop_glyph or '[]',
            library = options.library_glyph or '::',
        },
        player = options.player or "",
        players = {},
        size = options.size or 18,
        metadata_interval = 1
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

    watch(command, self.metadata_interval, function(_, stdout)
        local status, artist, album, track, arturl = self:parse_song_data(stdout)
        self:update(status, artist, album, track, arturl)
    end)

end

--
-- Update the displayed information
--
function MediaplayerWidget:update(status, artist, album, track, arturl)

    if player_status == "Playing" then
        -- self:set_icon(self.play_icon)
        self:set_text(self.glyphs.play, artist, album, track, arturl)
        self.widget.colors = { beautiful.widget_main_color }

    elseif player_status == "Paused" then
        -- self:set_icon(self.pause_icon)
        self:set_text(self.glyphs.pause, artist, album, track, arturl)
        self.widget.colors = { beautiful.widget_main_color }

    elseif player_status == "Stopped" then
        -- self.set_icon(self.stop_icon)
        self:set_text(self.glyphs.stop)

    else -- no player is running
        -- self.set_icon(self.library_icon)
        self:set_text(self.glyphs.library)
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

function MediaplayerWidget:set_text(status, artist, album, track, arturl)
    local text = self.widget.get_children_by_id('text')[1]

    text:set_text(
        string.format("[%s] %s - %s : %s",
            status,
            artist or 'None',
            album or 'None',
            track or 'None'
        )
    )
end

function MediaplayerWidget:set_icon(icon)
    self.widget.get_children_by_id('icon')[1]:set_image(icon)
end

--
-- Render initial widget display
--
function MediaplayerWidget:render()

    self.popup = MediaplayerPopup:new()

    self.widget = wibox.widget {
        -- {
        --     id = "icon",
        --     image = '',
        --     widget = wibox.widget.imagebox
        -- },

        {
            id = 'text',
            widget = wibox.widget.textbox,
        },

        spacing = 2,
        layout = wibox.layout.align.horizontal,
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
    current_albub = words[3]
    current_track = words[4]
    current_arturl = words[5]

    if current_song ~= nil then
        if string.len(current_song) > 18 then
            current_track = string.sub(current_song, 0, 9) .. ".."
        end
    end

    return player_status, current_artist, current_track
end

return MediaplayerWidget
