local function keymap(mode, lhs, rhs, opts)
    opts = opts or {}
    -- opts

    vim.keymap.set(mode, lhs, rhs, opts)
end

return {
    keymap = keymap
}
