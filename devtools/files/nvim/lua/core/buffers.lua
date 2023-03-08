local M = {}

--- @param buffer Buffer
function M.isEditableBuffer(buffer)
    -- :help buftype
    -- :help nvim_buf_get_var
    local buftype = vim.api.nvim_buf_get_option(buffer, "buftype")
    local modifiable = vim.api.nvim_buf_get_option(buffer, "modifiable")
    local readonly = vim.api.nvim_buf_get_option(buffer, "readonly")

    if buftype == "nofile" or not modifiable or readonly then
        return false
    end

    return true
end

--- @param mode string "n" | "i" | "t" | "x" | "s" | "v"
function M.isInMode(mode)
    local current_mode = vim.api.nvim_get_mode()
    return current_mode == mode
end

--- @param filetype string
--- @return boolean
function M.isFileType(filetype)
    local actual_type = vim.o.filetype

    return filetype == actual_type
end

return M
