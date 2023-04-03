local M = {}

-- Checks if running under Windows.
function M.is_win()
    if vim.loop.os_uname().version:match('Windows') then
        return true
    else
        return false
    end
end


-- Function equivalent to basename in POSIX systems.
-- @param str the path string.
function M.basename(str)
  return string.gsub(str, "(.*/)(.*)", "%2")
end

--  return the separator for the os_uname
function M.separator()
    return M.is_win() and '\\' or '/'
end

-- Contatenates given paths with correct separator.
-- @param: var args of string paths to joon.
function M.join_paths(...)
    local path_sep  = M.separator()
    local result = table.concat({ ... }, path_sep)
    return result
end

local _base_lua_path = M.join_paths(vim.fn.stdpath('config'), 'lua')

-- Loads all modules from the given package.
-- @param package: name of the package in lua folder.
function M.glob_packages(import_path, fn)
    local glob_path = M.join_paths(
      import_path:gsub('%.', M.separator()),
      '*.lua'
    )

    M.glob(glob_path, function(path)
        -- convert absolute filename to relative
        -- ~/.config/nvim/lua/<package>/<module>.lua => <package>/foo
        local relfilename = path
            :gsub(_base_lua_path, "")
            :gsub(".lua", "")
            :sub(2)

        local basename = M.basename(relfilename)
        -- skip `init` and files starting with underscore.
        if (basename ~= 'init' and basename:sub(1, 1) ~= '_') then
            fn(relfilename:gsub(M.separator(), '.'))
        end
    end)

end

--
function M.glob(target_path, fn)
    local glob_path = M.join_paths(
      _base_lua_path,
      target_path
    )

    for index, path in pairs(vim.split(vim.fn.glob(glob_path), '\n')) do
        fn(path)
    end
end

return M
