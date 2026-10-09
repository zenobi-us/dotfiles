[[ -n "$WSL_DISTRO_NAME" ]] && export MISE_ENV=wsl2

# appendWindowsPath is disabled in /etc/wsl.conf, so add just the Windows
# interop binaries some tools shell out to (wsl.exe, cmd.exe, powershell.exe)
# instead of the full Windows PATH.
if [[ -n "$WSL_DISTRO_NAME" ]]; then
	[[ -d /mnt/c/Windows/System32 ]] && path+=("/mnt/c/Windows/System32")
	[[ -d /mnt/c/Windows/System32/WindowsPowerShell/v1.0 ]] && path+=("/mnt/c/Windows/System32/WindowsPowerShell/v1.0")
fi
