local PluginSpec = {
    -- Terminal
    "akinsho/toggleterm.nvim",
    version = '*',
    config = function()
        require("toggleterm").setup({
            size = 20,
            open_mapping = [[<c-\>]],
            hide_numbers = true,
            shade_filetypes = {},
            shade_terminals = true,
            shading_factor = 2,
            start_in_insert = true,
            persist_mode = true,
            insert_mappings = true,
            persist_size = true,
            direction = "horizontal",
            close_on_exit = true,
            shell = vim.o.shell,
            float_opts = {
                border = "single",
                winblend = 0,
                height = 40,
                highlights = {
                    border = "Normal",
                    background = "Normal",
                },
            },
            winbar = {
                enabled = false,
                name_formatter = function(term) --  term: Terminal
                    return term.name
                end
            },
        })

        --
        -- Create a Git Interface with LazyGit
        --

        -- Always make sure we're in insert mode when in a terminal
        vim.api.nvim_create_autocmd({
            "BufEnter"
        }, {
            pattern = { "term://*toggleterm#*" },
            callback = function()
                vim.cmd("startinsert!")
            end
        })
    end
}

return PluginSpec
