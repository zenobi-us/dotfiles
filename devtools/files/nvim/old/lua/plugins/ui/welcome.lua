return {
	-- Startup
	"echasnovski/mini.starter",
	branch = "stable",
	config = function()
        
		local starter = require("mini.starter")
		starter.setup({
            contenthooks = {
                starter.gen_hook.adding_bullet(),
				starter.gen_hook.aligning("center", "center"),
                hook_top_pad_10
			},
			evaluate_single = true,
			footer = os.date(),
			header = table.concat({
				[[⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⠂⠰⣤⣀⠀⠀⢀⣦⣈⠙⠇⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⢠⣤⡀⠀⣼⣦⣄⡙⠳⢦⣈⠙⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⠀⠙⢀⡈⠻⢿⣿⣿⣶⣄⡉⣷⣦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠲⣤⣈⠛⠿⣿⣿⣿⣿⣿⣷⡦⢀⡀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣦⣄⡉⠳⢶⣿⣿⣿⣿⣿⠏⢠⡞⢁⣤⡀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⣿⣶⣄⡉⠻⠿⠟⠃⢰⠏⢠⣾⣿⣿⣄⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣿⣶⠈⠙⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠻⠆⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⠀⢀⣾⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⠀⣠⣿⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⠀⠀⣴⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠀⢀⣾⣿⣿⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⢀⣾⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀]],
				[[⠀⠀⠛⠛⠛⠀⠀⠀⠀⠀]],
			}, "\n"),
			queryupdaters = [[abcdefghilmoqrstuvwxyz0123456789-, ABCDEFGHIJKLMOQRSTUVWXYZ]],
			items = {
				{
					action = "tab G",
					name = "G: Fugitive",
					section = "Git",
				},
				{
					action = "Lazy",
					name = "U: Update Plugins",
					section = "Plugins",
				},
				{
					action = "enew",
					name = "E: New Buffer",
					section = "Builtin actions",
				},
				{
					action = "qall!",
					name = "Q: Quit Neovim",
					section = "Builtin actions",
				},

				starter.sections.telescope(),
				starter.sections.builtin_actions(),
				starter.sections.recent_files(10, false),
				starter.sections.recent_files(10, true),
				-- Use this if you set up 'mini.sessions'
				starter.sections.sessions(5, true),
			},
		})
		-- vim.cmd([[ augroup MiniStarterJK au! au User MiniStarterOpened nmap <buffer> j <Cmd>lua MiniStarter.update_current_item('next')<CR> au User MiniStarterOpened nmap <buffer> k <Cmd>lua MiniStarter.update_current_item('prev')<CR> au User MiniStarterOpened nmap <buffer> <C-p> <Cmd>Telescope find_files<CR> au User MiniStarterOpened nmap <buffer> <C-n> <Cmd>Telescope file_browser<CR> augroup END ]])
	end,
}
