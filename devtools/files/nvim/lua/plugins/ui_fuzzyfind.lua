local PluginSpec = {
    -- Lists of things
    'nvim-telescope/telescope.nvim', version = '0.1.0',
    dependencies = {
        { 'nvim-lua/plenary.nvim' },
        { 'airtonix/telescope-fzf-native.nvim',
            branch = 'feature/69-prebuilt-release-binaries',
            build = function()
                require('telescope-fzf-native').download_library()
            end
        }
    },
    config = function()
        -- You dont need to set any of these options. These are the default ones. Only
        -- the loading is important
        local telescope = require('telescope')
        local telescope_builtin = require("telescope.builtin")

        telescope.setup {
            extensions = {
                fzf = {
                    fuzzy = true, -- false will only do exact matching
                    override_generic_sorter = true, -- override the generic sorter
                    override_file_sorter = true, -- override the file sorter
                    case_mode = "smart_case", -- or "ignore_case" or "respect_case"
                    -- the default case_mode is "smart_case"
                }
            }
        }
        -- To get fzf loaded and working with telescope, you need to call
        -- load_extension, somewhere after setup function:
        telescope.load_extension('fzf')


        -- vim.keymap.set('n', '<C-f>', telescope_builtin.find_files, {})
        -- vim.keymap.set('n', '<A-f>', telescope_builtin.git_files, {})
        -- vim.keymap.set('n', '<leader>ps', function()
        --     telescope_builtin.grep_string({ search = vim.fn.input("Grep > ") });
        -- end)
        vim.keymap.set('n', '<C-p>', telescope_builtin.commands, {})

        vim.keymap.set('n', '<leader>ff', telescope_builtin.find_files, {})
        vim.keymap.set('n', '<leader>fg', telescope_builtin.live_grep, {})
        vim.keymap.set('n', '<leader>fb', telescope_builtin.buffers, {})
        vim.keymap.set('n', '<leader>fh', telescope_builtin.help_tags, {})

    end

}


return PluginSpec
