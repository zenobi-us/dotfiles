local awful = require('awful')

local my_core_workspaces = require('my.core.workspaces')
local my_constants = require('my.constants')
local my_settings = require('my.settings')


local function rofi_emoji_cmd()
    return my_constants.home ..
        '/.config/rofi/launcher.sh ' ..
        my_settings.store.rofi.runner.type .. -- type-3
        ' ' ..
        my_settings.store.rofi.runner.style .. -- style-2
        ' ' ..
        my_settings.store.rofi.runner.theme .. -- onedark
        ' ' ..
        '-modi "emoji:rofimoji --action copy" -show emoji'
end

local function rofi_runner_cmd()
    return my_constants.home ..
        '/.config/rofi/launcher.sh ' ..
        my_settings.store.rofi.runner.type .. -- type-3
        ' ' ..
        my_settings.store.rofi.runner.style .. -- style-2
        ' ' ..
        my_settings.store.rofi.runner.theme .. -- onedark
        ' ' ..
        '-show run'
end

local function rofi_launcher_cmd()
    return my_constants.home ..
        '/.config/rofi/launcher.sh ' ..
        my_settings.store.rofi.launcher.type .. -- type-3
        ' ' ..
        my_settings.store.rofi.launcher.style .. -- style-2
        ' ' ..
        my_settings.store.rofi.launcher.theme .. -- onedark
        ' ' ..
        '-show drun'

end

local function rofi_powermenu_cmd()
    return my_constants.home ..
        '/.config/rofi/powermenu.sh ' ..
        my_settings.store.rofi.powermenu.type .. -- type-3
        ' ' ..
        my_settings.store.rofi.powermenu.style .. -- style-2
        ' ' ..
        my_settings.store.rofi.powermenu.theme .. -- onedark
        ' ' ..
        '-show window'

end

local function rofi_switcher_cmd()
    return my_constants.home ..
        '/.config/rofi/launcher.sh ' ..
        my_settings.store.rofi.switcher.type .. -- type-3
        ' ' ..
        my_settings.store.rofi.switcher.style .. -- style-2
        ' ' ..
        my_settings.store.rofi.switcher.theme .. -- onedark
        ' ' ..
        '-show window'
end

local function rofi_emoji() awful.spawn(rofi_emoji_cmd()) end

local function rofi_runner() awful.spawn(rofi_runner_cmd()) end

local function rofi_launcher() awful.spawn(rofi_launcher_cmd()) end

local function rofi_switcher() awful.spawn(rofi_switcher_cmd()) end

local function rofi_powermenu() awful.spawn(rofi_powermenu_cmd()) end

local function lock_screen()
    awful.spawn("sync")
    awful.spawn("xautolock -locknow -nowlocker i3lock")
end

local function increase_window_gap()
    local gap = my_core_workspaces.increaseGapOnAllTags()
    my_settings.store.awesome.gap = gap
    my_settings:save()
end

local function decrease_window_gap()
    local gap = my_core_workspaces.decreseGapOnAllTags()
    my_settings.store.awesome.gap = gap
    my_settings:save()
end

local function launch_terminal() awful.spawn(my_constants.terminal) end

local function next_desktop()
    local tag = my_core_workspaces.moveAllScreensToNextTag()
    my_settings.store.awesome.tag = tag
    my_settings:save({ quiet = true })
end

local function previous_desktop()
    local tag = my_core_workspaces.moveAllScreensToPreviousTag()
    my_settings.store.awesome.tag = tag
    my_settings:save({ quiet = true })
end

local function get_focused_tag()
    -- get current tag
    local t = client.focus and client.focus.first_tag or nil
    return t
end

local function move_window_previous_desktop()
    local tag = get_focused_tag()
    if tag == nil then
        return
    end

    -- get previous tag (modulo 9 excluding 0 to wrap from 1 to 9)
    local tagId = client.focus.screen.tags[(tag.name - 2) % my_constants.total_tags + 1]
    awful.client.movetotag(tagId)

    previous_desktop()

end

local function move_window_next_desktop()
    local tag = get_focused_tag()
    if tag == nil then
        return
    end
    -- get next tag (modulo 9 excluding 0 to wrap from 9 to 1)
    local tagId = client.focus.screen.tags[(tag.name % my_constants.total_tags) + 1]
    awful.client.movetotag(tagId)
    
    next_desktop()
end


return {
    move_window_next_desktop = move_window_next_desktop,
    move_window_previous_desktop = move_window_previous_desktop,
    next_desktop = next_desktop,
    previous_desktop = previous_desktop,
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
