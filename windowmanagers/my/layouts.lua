local awful = require("awful")

local layouts = {
    tile = awful.layout.suit.tile,
    horizontal = awful.layout.suit.fair.horizontal,
    floating = awful.layout.suit.floating,
}

awful.layout.layouts = {
    layouts.tile,
    layouts.horizontal,
    layouts.floating,
}

--
-- Exports
--
return {
    layouts = layouts,
}