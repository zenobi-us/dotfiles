local Class = require('core.class')
local lyaml = require('lyaml')
local naughty = require("naughty")
-- local lodash = require('core.lodash')

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

    naughty.notify({
        preset = naughty.config.presets.info,
        title = "Loaded",
        text = self.filepath
    })

    handle:close()
end

function YamlFileStore:save()
    local handle = assert(io.open(self.filepath, 'w'), 'Problem opening ' .. self.filepath .. 'for saving')
    local contents = assert(lyaml.dump({ self.store }), 'Problem stringifying config')
    assert(handle:write(contents), 'Problem saving config to ' .. self.filepath)
    handle:close()

    naughty.notify({
        preset = naughty.config.presets.info,
        title = "Saved: " .. self.filepath,
    })

end

-- ---Set a value and save
-- ---@param path string
-- ---@param value any
-- function YamlFileStore:set(path, value)
--     lodash.set(self.store, path, value)
--     self:save()
-- end

-- ---Get a value
-- ---@param path string
-- ---@param value any
-- function YamlFileStore:get(path, value)
--     return lodash.get(self.store, path, value)
-- end

return {
    YamlFileStore = YamlFileStore
}
