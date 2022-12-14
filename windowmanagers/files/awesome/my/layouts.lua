local awful = require("awful")

local layouts = {
    floating = awful.layout.suit.floating,
    tile = awful.layout.suit.tile,
    horizontal = awful.layout.suit.fair.horizontal,
}

awful.layout.layouts = {
    layouts.floating,
    layouts.tile,
    layouts.horizontal,
}

--
-- Exports
--
return {
    layouts = layouts,
}