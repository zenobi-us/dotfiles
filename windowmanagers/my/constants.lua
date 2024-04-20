local constants = {}

constants.home = os.getenv( "HOME" )

-- This is used later as the default terminal and editor to run.
constants.terminal = "urxvt"
constants.editor = os.getenv("EDITOR") or "micro"
constants.editor_cmd = constants.terminal .. " -e " .. constants.editor

-- Default modkey.
-- Usually, Mod4 is the key with a logo between Control and Alt.
-- If you do not like this or do not have such a key,
-- I suggest you to remap Mod4 to another key using xmodmap or other tools.
-- However, you can use another modifier like Mod1, but it may interact with others.
constants.modkey = "Mod4"

constants.total_tags = 4
constants.tag_labels = {}
for i=1, constants.total_tags do
    constants.tag_labels[i] = tostring(i)
end

return constants