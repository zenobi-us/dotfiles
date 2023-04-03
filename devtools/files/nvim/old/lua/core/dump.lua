local function dump(...)
    vim.pretty_print(...);
end

return {
    dump = dump
}
