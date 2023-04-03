return {
	"ThePrimeagen/git-worktree.nvim",
	config = function()
		require("telescope").load_extension("git_worktree")
		require("legendary").keymaps({

			{
				"<leader>gws",
				{
					n = function()
						require("telescope").extensions.git_worktree.git_worktrees()
					end,
				},
				description = "Git Worktrees: Switch",
			},
			{
				"<leader>gwc",
				{
					n = function()
						require("telescope").extensions.git_worktree.create_git_worktree()
					end,
				},
			},
		})
	end,
}
