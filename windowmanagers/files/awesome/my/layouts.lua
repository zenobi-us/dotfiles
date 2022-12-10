local awful = require("awful")

local layouts = {
    floating = awful.layout.suit.floating,
    tile = awful.layout.suit.tile,
}

awful.layout.layouts = {layouts.floating, layouts.tile}

--
-- Exports
--
return {
    layouts = layouts,
}