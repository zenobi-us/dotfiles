local widget = require('my.widgets.volume-widget.volume')
local type_arc = require('my.widgets.volume-widget.widgets.arc-widget')
local type_horizontal = require('my.widgets.volume-widget.widgets.horizontal-bar-widget')
local type_vertical = require('my.widgets.volume-widget.widgets.vertical-bar-widget')
local type_icon = require('my.widgets.volume-widget.widgets.icon-widget')
local type_icon_text = require('my.widgets.volume-widget.widgets.icon-and-text-widget')

return {
    widget = widget,
    types = {
        arc = type_arc,
        horizontal = type_horizontal,
        vertical = type_vertical,
        icon = type_icon,
        icon_text = type_icon_text
    }
}
