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

-- keyboard
config.enable_kitty_keyboard = true
config.disable_default_key_bindings = true
config.debug_key_events = true
config.enable_csi_u_key_encoding = true
config.keys = {
	{ key = "p", mods = "CTRL|SHIFT", action = wezterm.action({ SendString = "\x1b[80;6u" }) },
	{ key = "P", mods = "CTRL|SHIFT", action = wezterm.action({ SendString = "\x1b[80;6u" }) },
	{ key = "v", mods = "CTRL", action = wezterm.action.PasteFrom("Clipboard") },
	{ key = "c", mods = "CTRL|SHIFT", action = wezterm.action.CopyTo("Clipboard") },
	{ key = "v", mods = "CTRL|SHIFT", action = wezterm.action.PasteFrom("Clipboard") },
}
-- config.color_scheme = "Rosé Pine (base16)"
-- config.color_scheme = "Royal"
config.color_scheme = "Catppuccin Mocha"

return config
