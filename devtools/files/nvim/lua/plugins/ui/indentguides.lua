-- local PluginSpec = {
--     -- Indent guidelines
--     "lukas-reineke/indent-blankline.nvim",

--     config = function()
--         vim.opt.list = true
--         vim.opt.listchars:append "space:."
--         vim.opt.listchars:append "eol:↴"

--         require("indent_blankline").setup {
--             show_current_context = true,
--             show_current_context_start = true,
--             show_end_of_line = true,
--             space_char_blankline = " ",
--         }
--     end
-- }
-- return PluginSpec

return {
	"lukas-reineke/indent-blankline.nvim",
	event = { "BufReadPost", "BufNewFile" },
	opts = {
		-- char = "▏",
		char = "│",
		filetype_exclude = { "help", "alpha", "dashboard", "neo-tree", "Trouble", "lazy" },
		show_trailing_blankline_indent = false,
		show_current_context = true,
        show_current_context_start = true,
        show_end_of_line = true,
        space_char_blankline = " ",
	},
}
