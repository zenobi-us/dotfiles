return {
	-- themes
	{ import = "plugins.themes.awesome" },
	{ import = "plugins.themes.github" },
	{ import = "plugins.themes.rosepine" },
	{ import = "plugins.themes.onedarkpro" },
	{ import = "plugins.themes.nightfox" },
	{ import = "plugins.themes.oxcarbon" },

	-- keymaps
	{ import = "plugins.keymaps.commandpalette" },

	-- ui
	{ import = "plugins.ui.core" },
	{ import = "plugins.ui.notify" },
	{ import = "plugins.ui.welcome" },
	{ import = "plugins.ui.sessions" },
	{ import = "plugins.ui.statusline" },
	{ import = "plugins.ui.errorlens" },
	{ import = "plugins.ui.filemanager" },
	{ import = "plugins.ui.codefolding" },
	{ import = "plugins.ui.scrollbars" },
	{ import = "plugins.ui.search" },
	{ import = "plugins.ui.terminal" },
	{ import = "plugins.ui.symbol_breadcrumbs" },
	{ import = "plugins.ui.tabs.barbar" },
	{ import = "plugins.ui.indentguides" },

	-- git
	{ import = "plugins.git.fugitive" },
	{ import = "plugins.git.graph" },
	{ import = "plugins.git.mergeconflicts" },
	{ import = "plugins.git.signs" },

	-- languages
	{ import = "plugins.languages.lsp" },
	{ import = "plugins.languages.hover" },

	-- editing
	{ import = "plugins.editing.treesitter" },
	{ import = "plugins.editing.autopairs" },
	{ import = "plugins.editing.comments" },
	{ import = "plugins.editing.highlight_selected" },
	{ import = "plugins.editing.markdown_links" },
	{ import = "plugins.editing.markdown_preview" },
	{ import = "plugins.editing.markdown" },
	{ import = "plugins.editing.move_text" },
	{ import = "plugins.editing.rename_symbol" },
	{ import = "plugins.editing.trailingspaces" },
	{ import = "plugins.editing.findreplace" },
	-- { import = "plugins.editing.multiple_cursors"},
	-- { import = "plugins.editing.undotree" }
}
