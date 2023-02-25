return {
    -- snippets
    {
        "L3MON4D3/LuaSnip",
        dependencies = {
            "rafamadriz/friendly-snippets",
            config = function()
                require("luasnip.loaders.from_vscode").lazy_load()
            end,
        },
        config = function()
            require('luasnip').setup(
                {
                    history = true,
                    delete_check_events = "TextChanged",
                }
            )
            local next_slot = function() require("luasnip").jump( -1) end
            local previous_slot = function() require("luasnip").jump(1) end
            local insert_snippet = function()
                return require("luasnip").jumpable(1) and "<Plug>luasnip-jump-next" or "<tab>"
            end
            require('legendary').keymaps({
                {
                    "<tab>",
                    { i = insert_snippet },
                    description = "Snippets: Insert Snippet"
                },
                {
                    "<tab>",
                    { s = next_slot },
                    description = "Snippets: Jump to next slot"
                },
                {
                    "<s-tab>",
                    { i = previous_slot, s = previous_slot },
                    description = "Snippets: Jump to previous slot"
                },
            })
        end,

    }

}
