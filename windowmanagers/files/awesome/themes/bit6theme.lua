-------------------------------
-- bit6tream's awesome theme --
-------------------------------

local theme_assets = require("beautiful.theme_assets")
local xresources = require("beautiful.xresources")
local naughty = require("naughty")
local gears = require("gears")
local dpi = xresources.apply_dpi

local gfs = require("gears.filesystem")
local themes_path = gfs.get_themes_dir()

local theme = {}

theme.font          = "xos4 Terminus 8"

theme.bg_normal     = "#0c0d12"
theme.bg_focus      = "#0c0d12"
theme.bg_urgent     = "#e31a1c"
theme.bg_minimize   = "#444444"

theme.fg_normal     = "#b7b8b9"
theme.fg_focus      = "#756bb1"
theme.fg_urgent     = "#0c0d12"
theme.fg_minimize   = "#ffffff"

theme.useless_gap   = dpi(0)
theme.border_width  = dpi(0)
theme.border_normal = theme.bg_normal
theme.border_focus  = theme.bg_focus
theme.border_marked = theme.bg_urgent

-- There are other variable sets
-- overriding the default one when
-- defined, the sets are:
-- taglist_[bg|fg]_[focus|urgent|occupied|empty|volatile]
-- tasklist_[bg|fg]_[focus|urgent]
-- titlebar_[bg|fg]_[normal|focus]
-- tooltip_[font|opacity|fg_color|bg_color|border_width|border_color]
-- mouse_finder_[color|timeout|animate_timeout|radius|factor]
-- prompt_[fg|bg|fg_cursor|bg_cursor|font]
-- hotkeys_[bg|fg|border_width|border_color|shape|opacity|modifiers_fg|label_bg|label_fg|group_margin|font|description_font]
-- Example:
--theme.taglist_bg_focus = "#ff0000"

theme.taglist_spacing = 2
theme.taglist_fg_occupied = "#fcfdfe"

-- Variables set for theming notifications:
-- notification_font
-- notification_[bg|fg]
-- notification_[width|height|margin]
-- notification_[border_color|border_width|shape|opacity]
theme.notification_font              = "xos4 Terminus 12"
theme.notification_bg                = theme.bg_normal
theme.notification_opacity           = 0.9
theme.notification_width             = dpi(300)
naughty.config.defaults.border_width = theme.border_width
naughty.config.defaults.margin       = dpi(14)
naughty.config.defaults.timeout      = 15

-- You can add as many variables as
-- you wish and access them by using
-- beautiful.variable in your rc.lua
theme.bg_widget = theme.bg_normal

return theme

-- vim: filetype=lua:expandtab:shiftwidth=4:tabstop=8:softtabstop=4:textwidth=80
