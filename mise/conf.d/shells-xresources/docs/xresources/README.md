# X11 resources and themes

<!-- Add a real screenshot with descriptive alt text and a caption, or a redacted terminal capture/diagram for this headless capability. -->

Load terminal X resources and a selected bundled color theme.

For Dotfiles users. Updated 2026-11-27.

The module links ~/.Xresources and ~/.XresourceThemes. .Xresources includes a Dracula theme, XTerm UTF-8 settings, and URxvt fonts, tabs, and clickable URLs. xresources.bootstrap merges resources only when DISPLAY, xrdb, and the file exist. Native Wayland terminals may ignore X resources.

## Complete a task

[Merge X resources into an X11 session](HOWTO.md)

## Source files

- **Source:** [mise.unix.toml](../../mise.unix.toml)
- **Source:** [.Xresources](../../.Xresources)
- **Source:** [.XresourceThemes](../../.XresourceThemes)

[Module overview](../../README.md)
