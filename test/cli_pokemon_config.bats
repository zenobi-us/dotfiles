#!/usr/bin/env bats

SCRIPT="/mnt/Store/Projects/Mine/Github/Dotfiles/shells/files/zsh/modules/pokemon__config.zsh"
DOTFILE_ROOT_PATH="/mnt/Store/Projects/Mine/Github/Dotfiles/shells/files/zsh"

@test "pokemon__config.zsh can be executed standalone in a PTY without DOTFILE_ROOT" {
  run env -u DOTFILE_ROOT python -c 'import os, pty, sys
cmd=[sys.argv[1], "glalie"]
pid, fd = pty.fork()
if pid == 0:
    os.execv(cmd[0], cmd)
chunks=[]
while True:
    try:
        data=os.read(fd, 1024)
        if not data:
            break
        chunks.append(data)
    except OSError:
        break
os.close(fd)
out=b"".join(chunks)
sys.stdout.write(out.decode("utf-8", "replace"))' "$SCRIPT"
  [ "$status" -eq 0 ]
  [ -n "$output" ]
}

@test "pokemon__config.zsh can be sourced in a non-interactive shell" {
  run env DOTFILE_ROOT="$DOTFILE_ROOT_PATH" zsh -c 'source "$1"' -- "$SCRIPT"
  [ "$status" -eq 0 ]
  [ -z "$output" ]
}
