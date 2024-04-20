--
-- Psuedo Class
--
-- @example
--
--   local Thing = {}
--   local ThingMt = Class(Thing)
--
--   function Thing:new(...)
--     local thing = setmetatable({
--          -- put your instance properties here
--          name: 'A Thing'
--     }, ThingMt)
--
--      -- thing.methods available now
--      thing:aMethod("George")
--      -- prints
--      --
--      -- A Thing : George
--
--     return thing
--   end
--
--   function Thing:aMethod(name) print(self.name .. " : " .. name) end
--   return ThingMt
--
function Class(members)
    members = members or {}
    local mt = {
        __metatable = members;
        __index     = members;
    }
    local function new(_, init)
        return setmetatable(init or {}, mt)
    end

    local function copy(obj, ...)
        local newobj = obj:new(unpack(arg))
        for n, v in pairs(obj) do newobj[n] = v end
        return newobj
    end

    members.new  = members.new or new
    members.copy = members.copy or copy
    return mt
end

return Class

