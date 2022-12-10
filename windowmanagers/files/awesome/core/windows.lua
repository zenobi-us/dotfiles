local awful = require("awful")

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


return {
    moveAllScreensToPreviousTag = moveAllScreensToPreviousTag,
    moveAllScreensToNextTag = moveAllScreensToNextTag
}