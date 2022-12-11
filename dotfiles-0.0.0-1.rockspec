version = "0.0.0-1"

rockspec_format = "3.0"

source = {
  url = 'https://github.com/airtonix/dotfiles'
}

package = 'dotfiles'

build = {
  type = "none"
}

dependencies = {
  "path",
  "luafilesystem",
  "power_widget",
  "lgi",
  "lcpz/awesome-freedesktop",
  "awesome-autostart"
}