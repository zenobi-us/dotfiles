local naughty = require("naughty")

local _ = {
    _VERSION = '0.02'
}

---
-- Checks if value is classified as a table primitive.
-- @usage _.print(_.isTable({'1'}))
-- --> true
-- _.print(_.isString(1))
-- --> false
--
-- @param value the value to check
-- @return Returns true if value is correctly classified, else false.
_.isTable = function(value)
    return type(value) == 'table'
end

---
-- Checks if value is classified as a nil primitive.
-- @usage _.print(_.isNil(variable)
-- --> true
-- variable = 1
-- _.print(_.isNil(variable))
-- --> false
--
-- @param value the value to check
-- @return Returns true if value is correctly classified, else false.
_.isNil = function(value)
    return type(value) == 'nil'
end

---
-- Checks if value is classified as a string primitive.
-- @usage _.print(_.isString('1'))
-- --> true
-- _.print(_.isString(1))
-- --> false
--
-- @param value the value to check
-- @return Returns true if value is correctly classified, else false.
_.isString = function(value)
    return type(value) == 'string'
end

---
-- Gets the property value at path of object. If the resolved value
-- is nil the defaultValue is used in its place.
-- @usage local object = {a={b={c={d=5}}}}
-- _.print(_.get(object, 'a.b.c.d'))
-- --> 5
--
-- @param object The object to query.
-- @param path The path of the property to get.
-- @param[opt=nil] defaultValue The value returned if the resolved value is nil.
-- @return Returns the resolved value.
_.get = function(object, path, defaultValue)
    local address = _.address(path)
    if _.isTable(object) then
        local value = object
        local c = 1
        while not _.isNil(address[c]) do
            if not _.isTable(value) then return defaultValue end
            value = value[address[c]]
            c = c + 1
        end
        return value or defaultValue
    elseif _.isString(object) then
        local index = address[1]
        return object:sub(index, index)
    end
end

---
-- Sets the property value at path of object. If the resolved value
-- is nil the defaultValue is used in its place.
-- @usage local object = {a={b={c={d=5}}}}
-- _.print(_.get(object, 'a.b.c.d'))
-- --> 5
--
-- @param object The object to query.
-- @param path The path of the property to get.
-- @param[opt=nil] defaultValue The value returned if the resolved value is nil.
-- @return nil
_.set = function(object, path, value)
    local address = _.address(path)
    local target = table.remove(address, #address)

    local branch = object
    local c = 1

    while not _.isNil(address[c]) do
        assert(_.isTable(branch) , 'lodash.set method only works with tables')

        branch = branch[address[c]]

        c = c + 1
    end


    branch[target] = value
end

_.address = function(inputstr)
    local t = {}
    for str in string.gmatch(inputstr, "([^.]+)") do
        table.insert(t, str)
    end
    return t
end


return _