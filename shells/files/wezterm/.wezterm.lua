local wezterm = require("wezterm")

local config = {}

-- In newer versions of wezterm, use the config_builder which will
-- help provide clearer error messages
if wezterm.config_builder then
	config = wezterm.config_builder()
end

-- font rules
config.font = wezterm.font("JetBrainsMono Nerd Font", { italic = false })
config.font_rules = {}
config.adjust_window_size_when_changing_font_size = false
config.font_size = 9.0
config.warn_about_missing_glyphs = false

-- rendering
config.front_end = "WebGpu"
config.webgpu_power_preference = "HighPerformance"

-- window
config.window_decorations = "NONE"

-- Tabs
config.show_tabs_in_tab_bar = false
config.use_fancy_tab_bar = false
config.show_new_tab_button_in_tab_bar = false
config.hide_tab_bar_if_only_one_tab = true
config.color_scheme = "Catppuccin Mocha"

return config
