local Class = require('my.core.class')
local lyaml = require('lyaml')

local YamlFileStore = {}

local YamlFileStoreMT = Class(YamlFileStore)

--- A Yaml Config YamlFileStore
--- Load from file and save to file.
---@param filepath string
---@return table
function YamlFileStore:new(filepath)
    local store = setmetatable({
        store = {},
        filepath = filepath,
    }, YamlFileStoreMT)

    store:load()

    return store
end

function YamlFileStore:load()
    local handle = assert(io.open(self.filepath, 'r'), 'Problem opening' .. self.filepath .. 'for loading')
    local contents = handle:read("a")
    local store = assert(lyaml.load(contents), 'Problem parsing yaml from ' .. self.filepath)
    self.store = store

    handle:close()
end

function YamlFileStore:save()
    local handle = assert(io.open(self.filepath, 'w'), 'Problem opening ' .. self.filepath .. 'for saving')
    local contents = assert(lyaml.dump({ self.store }), 'Problem stringifying config')
    assert(handle:write(contents), 'Problem saving config to ' .. self.filepath)
    handle:close()
end

return {
    YamlFileStore = YamlFileStore
}
