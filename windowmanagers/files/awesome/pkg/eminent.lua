----------------------------------------------------------------
-- Effortless wmii-style dynamic tagging.
----------------------------------------------------------------
-- Lucas de Vries <lucas@glacicle.org>
-- Licensed under the WTFPL version 2
--   * http://sam.zoy.org/wtfpl/COPYING
----------------------------------------------------------------
-- To use this module add:
--   require("eminent")
-- to the top of your rc.lua. 
--
-- That's it. Through magical monkey-patching, all you need to
-- do to start dynamic tagging is loading it.
--
-- Use awesome like you normally would, you don't need to
-- change a thing.
----------------------------------------------------------------

-- Grab environment
local ipairs = ipairs
local pairs = pairs
local ascreen = require("awful.screen")
local awful = require("awful")
local util = require("awful.util")
local table = table
local capi = {
    tag = tag,
    mouse = mouse,
    client = client,
    screen = screen,
}

local tag = require("awful.tag")


-- Eminent: Effortless wmii-style dynamic tagging
local eminent = {}

--- Create new tag when scrolling right from the last tag
eminent.create_new_tag = true

-- simply change the behavior of the filter will do the trick
awful.widget.taglist.filter.all = awful.widget.taglist.filter.noempty

-- However it still need to replace the original awful.tag.viewidx to only loop in the 
-- set of the non-empty tags
--
-- Return tags with stuff on them
local function gettags(screen)
    local tags = {}

    if type(screen.selected_tag) == 'tag' then
        for k, t in ipairs(screen.tags) do
            if t.selected or #t:clients() > 0 then
                table.insert(tags, t)
            end
        end

    else
        for k, t in ipairs(tag.gettags(screen)) do
            if t.selected or #t:clients() > 0 then
                table.insert(tags, t)
            end
        end

    end

    return tags
end

awful.tag.viewidx = function (i, screen)
    local screen
    if type(ascreen.focused) == "function" then 
        screen = screen or ascreen.focused() 
    else
        screen =screen or capi.mouse.screen
    end

    local tags = gettags(screen)
    local full_tags


    if type(screen.selected_tag) == 'tag' then
        full_tags = screen.tags
    else
        full_tags = tag.gettags(screen)
    end

    local showntags = {}
    for k, t in ipairs(tags) do
        if not tag.getproperty(t, "hide") then
            table.insert(showntags, t)
        end
    end
    local sel 
    if type(screen.selected_tag) == 'tag' then
        sel = screen.selected_tag
    else
        sel = tag.selected(screen)
    end

    local tagidx = util.table.hasitem(tags, sel)
    tag.viewnone(screen)

    if eminent.create_new_tag and #tags < tagidx+1 and #sel:clients() ~= 0 and i == 1 then
        for k, t in ipairs(full_tags) do
            if t == sel then
                full_tags[util.cycle(#full_tags, k + i)].selected = true
            end
        end
    else
        for k, t in ipairs(showntags) do
            if t == sel then
                showntags[util.cycle(#showntags, k + i)].selected = true
            end
        end
    end

    capi.screen[screen]:emit_signal("tag::history::update")

end

return eminent