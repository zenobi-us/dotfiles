local function keymap(mode, lhs, rhs, opts)
    opts = opts or {}
    vim.keymap.set(mode, lhs, rhs, opts)
end

return {
    keymap = keymap
}
