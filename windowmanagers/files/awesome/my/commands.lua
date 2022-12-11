local awful = require('awful')

local core_workspaces = require('core.workspaces')
local my_constants = require('my.constants')
local my_settings = require('my.settings')


local rofi_emoji_cmd = my_constants.home ..
    '/.config/rofi/launchers/launcher.sh ' ..
    my_settings.store.rofi.runner.type .. -- type-3
    ' ' ..
    my_settings.store.rofi.runner.style .. -- style-2
    ' ' ..
    my_settings.store.rofi.runner.theme .. -- onedark
    ' ' ..
    '-modi "emoji:rofimoji --action copy" -show emoji'

local rofi_runner_cmd = my_constants.home ..
    '/.config/rofi/launchers/launcher.sh ' ..
    my_settings.store.rofi.runner.type .. -- type-3
    ' ' ..
    my_settings.store.rofi.runner.style .. -- style-2
    ' ' ..
    my_settings.store.rofi.runner.theme .. -- onedark
    ' ' ..
    '-show run'
local rofi_launcher_cmd = my_constants.home ..
    '/.config/rofi/launchers/launcher.sh ' ..
    my_settings.store.rofi.launcher.type .. -- type-3
    ' ' ..
    my_settings.store.rofi.launcher.style .. -- style-2
    ' ' ..
    my_settings.store.rofi.launcher.theme .. -- onedark
    ' ' ..
    '-show drun'

local rofi_powermenu_cmd = my_constants.home ..
    '/.config/rofi/launchers/launcher.sh' ..
    my_settings.store.rofi.powermenu.type .. -- type-3
    ' ' ..
    my_settings.store.rofi.powermenu.style .. -- style-2
    ' ' ..
    my_settings.store.rofi.powermenu.theme .. -- onedark
    ' ' ..
    '-show window'

local rofi_switcher_cmd = my_constants.home ..
    '/.config/rofi/launchers/launcher.sh' ..
    my_settings.store.rofi.switcher.type .. -- type-3
    ' ' ..
    my_settings.store.rofi.switcher.style .. -- style-2
    ' ' ..
    my_settings.store.rofi.switcher.theme .. -- onedark
    ' ' ..
    '-show window'



local function rofi_emoji() awful.spawn(rofi_emoji_cmd) end
local function rofi_runner() awful.spawn(rofi_runner_cmd) end
local function rofi_launcher() awful.spawn(rofi_launcher_cmd) end
local function rofi_switcher() awful.spawn(rofi_switcher_cmd) end
local function rofi_powermenu() awful.spawn(rofi_powermenu_cmd) end

local function lock_screen()
    awful.spawn("sync")
    awful.spawn("xautolock -locknow -nowlocker i3lock")
end

local function increase_window_gap()
    local gap = core_workspaces.increaseGapOnAllTags()
    my_settings.store.awesome.gap = gap
    my_settings:save()
end

local function decrease_window_gap()
    local gap = core_workspaces.decreseGapOnAllTags()
    my_settings.store.awesome.gap = gap
    my_settings:save()
end

local function launch_terminal () awful.spawn(my_constants.terminal) end

return {
    rofi_emoji = rofi_emoji,
    rofi_runner = rofi_runner,
    rofi_launcher = rofi_launcher,
    rofi_switcher = rofi_switcher,
    rofi_powermenu = rofi_powermenu,
    lock_screen = lock_screen,
    launch_terminal = launch_terminal,
    decrease_window_gap = decrease_window_gap,
    increase_window_gap = increase_window_gap,
}
