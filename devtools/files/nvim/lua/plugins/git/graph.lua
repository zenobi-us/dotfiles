return {
    {
        "rbong/vim-flog",
        opts = {

        },
        config = function()
            require('legendary').keymaps({
                {
                    "<leader>gg",
                    {
                        n = ":Flog<CR>",
                        v = "<C-C>:Flog<CR>"
                    },
                    description = "Git: Graph: view git graph"
                }
            })
        end
    }
}
