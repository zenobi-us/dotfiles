local PluginSpec = {
	-- File Tree
	"nvim-neo-tree/neo-tree.nvim",
	
    dependencies = {
		"nvim-lua/plenary.nvim",
		"MunifTanjim/nui.nvim",
	},

	deactivate = function()
		vim.cmd([[Neotree close]])
	end,

	init = function()
		vim.g.neo_tree_remove_legacy_commands = 1
		if vim.fn.argc() == 1 then
			local stat = vim.loop.fs_stat(vim.fn.argv(0))
			if stat and stat.type == "directory" then
				require("neo-tree")
			end
		end
	end,

	config = function()
		local events = require("neo-tree.events")

		require("neo-tree").setup({
			source_selector = {
				winbar = true,
			},
			popup_border_style = "rounded",
			enable_git_status = true,
			enable_diagnostics = true,
			default_component_configs = {
				git_status = {
					symbols = {
						-- Change type
						added = "+", -- or "✚", but this is redundant info if you use git_status_colors on the name
						modified = "m", -- or "", but this is redundant info if you use git_status_colors on the name
						deleted = "d", -- this can only be used in the git_status source
						renamed = "r", -- this can only be used in the git_status source
						-- Status type
						untracked = "u",
						ignored = "i",
						unstaged = "",
						staged = "s",
						conflict = "",
					},
				},
			},

            window = {
                mappings = {
                    ["<space>"] = "none",
                },
            },

			filesystem = {
                bind_to_cwd = false,
                follow_current_file = true,    
				filtered_items = {
					hide_dotfiles = false,
					hide_gitignored = false,
				},
			},
			--
			-- Forces Normal Mode
			-- When entering a NeoTree buffear
			--
			event_handlers = {
				{
					event = events.NEO_TREE_BUFFER_ENTER,
					handler = function()
						vim.cmd("stopinsert")
					end,
				},
			},
		})

		local toggleCommand = ":Neotree source=filesystem reveal=true position=left toggle=true action=show"
		require("legendary").keymaps({
			{
				"<C-b>",
				{
					i = string.format("<C-O>%s<CR>", toggleCommand),
					n = string.format("%s<CR>", toggleCommand),
				},
				description = "FileManager: Toggle sidebar",
			},
		})
	end,
}

return PluginSpec
