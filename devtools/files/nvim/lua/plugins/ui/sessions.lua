local PluginSpec = {
	{
		-- "olimorris/persisted.nvim",
		-- config = function()
		--     vim.o.sessionoptions = "buffers,curdir,folds,winpos,winsize"

		--     local persisted = require('persisted')

		--     persisted.setup({
		--         save_dir = vim.fn.expand(vim.fn.stdpath("data") .. "/sessions/"), -- directory where session files are saved
		--         command = "VimLeavePre", -- the autocommand for which the session is saved
		--         use_git_branch = false, -- create session files based on the branch of the git enabled repository
		--         autosave = true, -- automatically save session files when exiting Neovim
		--         autoload = true, -- automatically load the session for the cwd on Neovim startup
		--         allowed_dirs = nil, -- table of dirs that the plugin will auto-save and auto-load from
		--         ignored_dirs = nil, -- table of dirs that are ignored when auto-saving and auto-loading
		--         before_save = nil, -- function to run before the session is saved to disk
		--         after_save = nil, -- function to run after the session is saved to disk
		--         after_source = nil, -- function to run after the session is sourced
		--         telescope = { -- options for the telescope extension
		--             before_source = function()
		--                 -- Close all open buffers
		--                 -- Thanks to https://github.com/avently
		--                 vim.api.nvim_input("<ESC>:%bd<CR>")
		--             end,
		--             after_source = function(session)
		--                 print("Loaded session " .. session.name)
		--             end,
		--         },
		--     })
		-- end
	},
    { 'echasnovski/mini.sessions', version = '*' },

}

return PluginSpec
