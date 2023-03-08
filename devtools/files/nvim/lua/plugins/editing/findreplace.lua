-- search/replace in multiple files
return {
    "windwp/nvim-spectre",
    -- stylua: ignore
    config = function()
        require('legendary').keymaps({
            {
                "<leader>sr",
                { n = function() require("spectre").open() end },
                description = "Replace in files (Spectre)"
            },
        })
    end
}

