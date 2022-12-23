return function(pluginName, fn)
	local present, plugin = pcall(require, pluginName)
	if not present then
		print(string.format("Could not load %q", pluginName))
		return
	end

	fn(plugin)

end
