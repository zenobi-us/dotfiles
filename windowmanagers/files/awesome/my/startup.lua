local awful = require('awful')

local xresources_name = "awesome.started"
local xresources = awful.util.pread("xrdb -query")
if not xresources:match(xresources_name) then
    awful.util.spawn_with_shell("xrdb -merge <<< " .. "'" .. xresources_name .. ":true'")
    -- Execute once for X server
    os.execute("dex --environment Awesome --autostart --search-paths $XDG_CONFIG_HOME/autostart")
end