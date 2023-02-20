local lsp = require("lsp-zero")
-- local keymap = require('core.keys').keymap

lsp.preset("recommended")
lsp.ensure_installed({
    'tsserver',
    'eslint',
    'sumneko_lua',
    'rust_analyzer',
})

-- local cmp = require('cmp')
-- local cmp_select = { behavior = cmp.SelectBehavior.Select }
-- local cmp_mappings = lsp.defaults.cmp_mappings({
--     ['<C-Up>'] = cmp.mapping.select_prev_item(cmp_select),
--     ['<C-Down>'] = cmp.mapping.select_next_item(cmp_select),
--     ['<C-Enter>'] = cmp.mapping.confirm({ select = true }),
--     ["<C-Space>"] = cmp.mapping.complete(),
-- })


lsp.setup_nvim_cmp({
    mapping = cmp_mappings
})

-- lsp.on_attach(function(_, bufnr)
--     local opts = { buffer = bufnr, remap = false }

--     keymap("n", "<C-Leftmouse>", function() vim.lsp.buf.definition() end, opts)
--     keymap("n", "<A-Leftmouse>", function() vim.lsp.buf.declaration() end, opts)

--     keymap("n", "K", function() vim.lsp.buf.hover() end, opts)
--     keymap("n", "<leader>vws", function() vim.lsp.buf.workspace_symbol() end, opts)
--     keymap("n", "<leader>vd", function() vim.diagnostic.open_float() end, opts)
--     keymap("n", "[d", function() vim.diagnostic.goto_next() end, opts)
--     keymap("n", "]d", function() vim.diagnostic.goto_prev() end, opts)
--     keymap("n", "<leader>vca", function() vim.lsp.buf.code_action() end, opts)
--     keymap("n", "<leader>vrr", function() vim.lsp.buf.references() end, opts)
--     keymap("n", "<F2>", function() vim.lsp.buf.rename() end, opts)
--     keymap("i", "<F2>", function() vim.lsp.buf.rename() end, opts)
--     keymap("i", "<C-h>", function() vim.lsp.buf.signature_help() end, opts)

-- end)

lsp.nvim_workspace()
lsp.setup()
