local keymap = require('core.keys').keymap

--
-- LEADER KEY
--
vim.g.mapleader = " "

--
-- Moving
--

keymap('i', '<PageUp>', '<C-O>50k', {})
keymap('n', '<PageUp>', '50k', {})
keymap('i', '<PageDown>', '<C-O>50j', {})
keymap('n', '<PageDown>', '50j', {})


--
-- Closing
--
keymap('i', "<C-w>", "<C-O>:bd<CR>", {})
keymap('n', "<C-w>", ":bd<CR>", {})

-- Clone line
keymap('i', '<C-d>', '<C-O>:copy .<CR>', {})
keymap('n', '<C-d>', ':copy .<CR>', {})
keymap('v', '<C-d>', '<C-C>:copy .<CR>', {})




--
-- Tab indenting
--

-- Doesn't affect selections
keymap('n', '<Tab>', '>>_')
keymap('n', '<S-Tab>', '<<_')

-- affects selections
-- we're using gv here because with behave:mswin we need to avoid insertmode
keymap('v', '<Tab>', '<C-C>gv>')
keymap('v', '<S-Tab>', '<C-C>gv<')
