-- https://github.com/fedepujol/move.nvim

return {
	"fedepujol/move.nvim",
	config = function()
		require("legendary").keymaps({
			{
				"<A-S-Down>",
				{
					i = "<C-O>:MoveLine(1)<CR>",
					n = ":MoveLine(1)<CR>",
					v = ":MoveLine(1)<CR>",
				},
				description = "Move line down",
			},
			{
				"<a-s-up>",
				{
					i = "<C-O>:Moveline(-1)<CR>",
					n = ":MoveLine(-1)<CR>",
					v = ":MoveLine(-1)<CR>",
				},
				description = "Move Line Up",
			},
		})
	end,
}
