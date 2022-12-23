local PluginSpec = {
    -- Tab bar
    'noib3/nvim-cokeline',
    dependencies = {
        'nvim-tree/nvim-web-devicons',
    },
    config = function()
        local get_hex = require('cokeline/utils').get_hex
        local cokeline = require('cokeline')

        cokeline.setup({

            show_if_buffers_are_at_least = 1,

            mappings = {
                cycle_prev_next = true,
            },

            default_hl = {
                fg = function(buffer)
                    -- return buffer.is_focused and colors.purple or colors.gray
                end,
                bg = "NONE",
                style = function(buffer)
                    return buffer.is_focused and "bold" or nil
                end,
            },
            sidebar = {
                filetype = 'neo-tree',
                components = {
                    {
                        text = 'Files',
                        -- fg = yellow,
                        bg = get_hex('NvimTreeNormal', 'bg'),
                        style = 'bold',
                    },
                }
            },
            components = {
                { text = " " },

                {
                    text = function(buffer)
                        return buffer.unique_prefix or " "
                    end,
                    style = "italic",
                },

                {
                    text = function(buffer)
                        return buffer.filename
                    end,
                    style = function(buffer)
                        return buffer.is_focused and "bold" or nil
                    end,
                },

                { text = " " },
                {
                    text = function(buffer)
                        return buffer.is_modified and "●" or " "
                    end,
                    fg = function(buffer)
                        -- return buffer.is_focused and colors.red
                    end,
                },
                { text = " " },

                {
                    text = '',
                    delete_buffer_on_left_click = true,
                },
                { text = " " },
            },
        })


    end
}
return PluginSpec
