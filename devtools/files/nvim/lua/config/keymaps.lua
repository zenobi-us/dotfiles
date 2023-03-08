-- Keymaps are automatically loaded on the VeryLazy event
-- Default keymaps that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/keymaps.lua
-- Add any additional keymaps here

require("legendary").keymaps({
    {
        "<leader>theme",
        { n = ":Telescope colorscheme<cr>" },
        description = "Theme: switch colorscheme",
    },

    -- Open legendary
    { "<C-p>", ":Legendary<CR>" },

    -- Insert on Click
    -- {
    --     "<LeftMouse>",
    --     {
    --         n = function()
    --             local isEditable = buffers.isEditableBuffer(vim.api.nvim_get_current_buf())
    --             local isInNormalMode = buffers.isInMode("n")
    --             local isInTerminalMode = buffers.isFileType("terminal")
    --             local isInFileTree = buffers.isFileType("neo-tree")

    --             print(string.format(
    --                 "isEditable: %s isInNormalMode: %s isInTerminalMode: %s isInFileTree: %s filetype: %s",
    --                 isEditable,
    --                 isInNormalMode,
    --                 isInTerminalMode,
    --                 isInFileTree,
    --                 vim.o.filetype
    --             ))

    --             -- vim.api.nvim_exec("<LeftMouse>i")
    --         end
    --     }
    -- },

    -- Saving
    {
        "<C-s>",
        { i = "<C-O>:update<CR>", n = ":update<CR>" },
        description = "Move up 50 lines",
    },

    -- Moving
    {
        "<PageUp>",
        { i = "<C-O>50k", n = "50k" },
        description = "Move up 50 lines",
    },
    {
        "<PageDown>",
        { i = "<C-O>50j", n = "50j" },
        description = "Move down 50 lines",
    },

    -- Closing
    {
        "<C-w>",
        {
            i = "<C-O>:bd<CR>",
            n = ":bd<CR>",
        },
        description = "Close window",
    },

    -- Clone line
    {
        "<C-d>",
        {
            i = "<C-O>:copy .<CR>",
            n = ":copy .<CR>",
            v = "<C-C>:copy .<CR>",
        },
        description = "Clone line",
    },

    -- New File
    -- {
    --     "<C-n>",
    --     {
    --         i = "<C-O>:enew<CR>",
    --         n = ":enew<CR>",
    --         v = "<C-C>:enew<CR>"
    --     }
    -- },

    -- Tab indenting
    {
        "<Tab>",
        {
            n = ">>_",
            v = "<C-C>gv",
        },
        description = "Indent line/block",
    },

    {
        "<S-Tab>",
        {
            n = "<<_",
            i = "<<_",
            v = "<C-C>gv<",
        },
        description = "Unindent line/block",
    },
})
