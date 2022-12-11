local gears = require('gears')
local tables = require('core.tables')
local project = require('core.project')


return tables.merge(
	project.collect(gears.filesystem.get_themes_dir()),
	project.collect(project.root .. 'themes')
)