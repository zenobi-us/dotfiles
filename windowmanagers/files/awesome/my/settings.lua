local core_config = require('core.config')
local core_project = require('core.project')

local settings = core_config.YamlFileStore:new(core_project.root .. '/settings.yml')

return settings
