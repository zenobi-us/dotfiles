local lgi = require('lgi')
local Gtk = lgi.require("Gtk", "3.0")



return {
    PlayIcon = Gtk.Image({ visible = true, icon_name = "gtk-media-play-ltr", pixel_size = 16 }),
    PauseIcon = Gtk.Image({ visible = true, icon_name = "gtk-media-pause-ltr", pixel_size = 16 }),
    StopIcon = Gtk.Image({ visible = true, icon_name = "gtk-media-stop", pixel_size = 16 }),
    NextIcon = Gtk.Image({ visible = true, icon_name = "gtk-media-next-ltr", pixel_size = 16 }),
    PreviousIcon = Gtk.Image({ visible = true, icon_name = "gtk-media-previous-ltr", pixel_size = 16 }),
    LibraryIcon = Gtk.Image({ visible = true, icon_name = "folder", pixel_size = 16 }),
}
