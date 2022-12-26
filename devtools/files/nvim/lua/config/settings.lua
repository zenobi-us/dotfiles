local options = {
    swapfile = false, -- creates a swapfile
    backup = false, -- creates a backup file
    writebackup = false,

    clipboard = "unnamedplus", -- allows neovim to access the system clipboard
    autoread = true, -- when file changed, autoread it
    completeopt = { "menuone", "noselect" }, -- mostly just for cmp
    fileencoding = "utf-8", -- the encoding written to a file

    --
    -- Search
    --
    hlsearch = true, -- highlight all matches on previous search pattern
    incsearch = true, -- enable incsearch
    ignorecase = true, -- ignore case in search patterns

    --
    -- Mouse
    --
    mouse = "a", -- allow the mouse to be used in neovim
    mousemodel = 'popup_setpos',

    --
    -- UI
    --
    pumheight = 10, -- pop up menu height
    showmode = false, -- we don't need to see things like -- INSERT -- anymore
    showtabline = 2, -- always show tabs
    termguicolors = true, -- set term gui colors (most terminals support this)
    conceallevel = 0, -- so that `` is visible in markdown files


    --
    -- Buffer Behaviour
    --
    splitbelow = true, -- force all horizontal splits to go below current window
    splitright = true, -- force all vertical splits to go to the right of current window
    colorcolumn = '80',
    wrap = false,

    --
    -- Commands
    --
    cmdheight = 2, -- more space in the neovim command line for displaying messages
    timeoutlen = 1000, -- time to wait for a mapped sequence to complete (in milliseconds)

    --
    -- History
    --
    undofile = true, -- enable persistent undo
    updatetime = 300, -- faster completion (4000ms default)
    -- if a file is being edited by another program
    -- (or was written to file while editing with another program), it is not allowed to be edited

    --
    -- Indenting
    --
    smartcase = true, -- smart case
    smartindent = true, -- make indenting smarter again
    expandtab = true, -- convert tabs to spaces
    shiftwidth = 4, -- the number of spaces inserted for each indentation
    softtabstop = 4,
    tabstop = 4, -- insert 2 spaces for a tab

    cursorline = true, -- highlight the current line

    --
    -- Gutter
    --
    number = true, -- set numbered lines
    relativenumber = false, -- set relative numbered lines
    numberwidth = 4, -- set number column width to 2 {default 4}
    signcolumn = "yes", -- always show the sign column, otherwise it would shift the text each time


    scrolloff = 8, -- is one of my fav
    sidescrolloff = 8,
    errorbells = false, -- no error bells

    --
    -- Window Title
    --
    title = true, -- show title in terminal header

    --
    -- Auxillary Characters
    --

    fillchars = {
        diff = "╱", g
        fold = " ",
        eob = " ",
        foldopen = "",
        foldsep = " ",
        foldclose = ""
    }
}

vim.opt.isfname:append("@-@")
vim.opt.shortmess:append "c"

for k, v in pairs(options) do
    vim.opt[k] = v
end
