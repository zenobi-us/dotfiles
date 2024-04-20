local my_core_config = require('my.core.config')
local my_core_project = require('my.core.project')

local settings = my_core_config.YamlFileStore:new(my_core_project.root .. '/settings.yml')

return settings
