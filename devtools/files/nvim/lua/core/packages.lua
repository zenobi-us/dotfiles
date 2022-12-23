local function reload_all_modules()
    for name, _ in pairs(package.loaded) do
        if name:match("^config")
            or name:match("^core")
            or name:match("^plugins")
            or name:match("^init")
        then
            package.loaded[name] = nil
        end
    end

    dofile(vim.env.MYVIMRC)
end

local function reload_module(module)
    for name, _ in pairs(package.loaded) do
        if name:match("^" .. module) then
            package.loaded[name] = nil
            require(name)
            return
        end
    end
end

return {
    reload_all_modules = reload_all_modules,
    reload_module = reload_module
}
