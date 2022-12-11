local awful = require('awful')

awful.screen.set_auto_dpi_enabled(true)

awful.spawn.with_shell('pidof -x picom || picom')