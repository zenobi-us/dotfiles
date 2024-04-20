local beautiful = require("beautiful")
local awful = require("awful")

local gapTable = {4, 10, 20, 0}
local gapIndex = 1

local function moveAllScreensToPreviousTag()
    for i = 1, screen.count() do
        awful.tag.viewprev(i)
    end
end

local function moveAllScreensToNextTag()
        for i = 1, screen.count() do
            awful.tag.viewnext(i)
        end
end

local function moveAllScreensToTag(tagName)
    local tagIndex = awful.tag.getidx(tagName)
    for screen = 1, screen.count() do
        local tag = awful.tag.gettags(screen)[tagIndex]
        if tag then
            awful.tag.viewonly(tag)
        end
    end
end

local function pinScreenToTag(screen, tag) end

local function setGap(amount)
    beautiful.useless_gap = amount
    
    awful.screen.connect_for_each_screen(function(screen)
        awful.layout.arrange(screen)
    end)

end

local function getNextGap()
    if gapIndex < 4 then
        gapIndex = gapIndex + 1
    else
        gapIndex = 1
    end
    return gapTable[gapIndex]
end

local function getPreviousGap()
    if gapIndex > 1 then
        gapIndex = gapIndex - 1
    else
        gapIndex = 4
    end
    return gapTable[gapIndex]
end

local function increaseGapOnAllTags()
    local amount = getNextGap()
    setGap(amount)
    return amount
end

local function decreseGapOnAllTags()
    local amount = getPreviousGap()
    setGap(amount)
    return amount
end

return {
    increaseGapOnAllTags = increaseGapOnAllTags,
    decreseGapOnAllTags = decreseGapOnAllTags,
    pinScreenToTag = pinScreenToTag,
    moveAllScreensToTag = moveAllScreensToTag,
    moveAllScreensToPreviousTag = moveAllScreensToPreviousTag,
    moveAllScreensToNextTag = moveAllScreensToNextTag
}
