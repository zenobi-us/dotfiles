return {
    "lewis6991/hover.nvim",
    config = function()
        require("hover").setup {
            init = function()
                -- Require providers
                require("hover.providers.lsp")
                require('hover.providers.gh')
                require('hover.providers.gh_user')
                -- require('hover.providers.jira')
                require('hover.providers.man')
                require('hover.providers.dictionary')
            end,
            preview_opts = {
                border = nil
            },
            -- Whether the contents of a currently open hover window should be moved
            -- to a :h preview-window when pressing the hover keymap.
            preview_window = false,
            title = true
        }


        -- TODO: Reveal hover information when mouse rest and holding Ctrl
        --
        require("legendary").keymaps({
            {
                "<C-LeftMouse>",
                {
                    n = require('hover').hover,
                    i = require('hover').hover
                },
                description = "Reveal information"
            },
            {
                "k",
                {
                    n = require('hover').hover,
                },
                description = "Reveal information"
            },
            {
                "gK",
                {
                    n = require('hover').hover_select,
                },
                description = "Reveal information"
            }


        })
                 -- local hover_time = 500
                 -- local hover_timer = nil
                 -- local mouse_position = nil

                 -- vim.o.mousemoveevent = true
                 -- vim.on_key(function(key)
                 --     print("key: %s", key)
                 -- end)

                 -- vim.keymap.set({ '', 'i' }, '<MouseMove>', function()
                 --     if hover_timer then
                 --         hover_timer:close()
                 --     end
                 --     hover_timer = vim.defer_fn(function()
                 --         local modifier = vim.fn.getcharmod()


                 --         mouse_position = vim.fn.getmousepos()
                 --         hover_timer = nil
                 --         local row, col = unpack(vim.api.nvim_win_get_cursor(0))

                 --         print(string.format(
                 --             "keyboard [ %d/%d ] mouse [ %d/%d win: %d/%d screen: %d/%d ] keys: %s",
                 --             row, col,
                 --             mouse_position.line, mouse_position.column,
                 --             mouse_position.winrow, mouse_position.wincol,
                 --             mouse_position.screenrow, mouse_position.screencol,
                 --             modifier
                 --         ))
                 --         vim.lsp.buf_request(0,
                 --             "textDocument/hover",
                 --             {
                 --                 textDocument = vim.lsp.util.make_text_document_params(
                 --                     vim.api.nvim_win_get_buf(0)
                 --                 ),
                 --                 position = {
                 --                     line =  mouse_position.line - 1,
                 --                     character = mouse_position.column
                 --                 }
                 --             }
                 --         )
                 --     end, hover_time)
                 --     return '<MouseMove>'
                 -- end, { expr = true })
    end
}
