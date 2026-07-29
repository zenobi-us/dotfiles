# servitor

Small Windows tray application that checks real keyboard/mouse inactivity with `GetLastInputInfo`. After the configured idle period it sends a one-pixel mouse movement and immediately moves back.

## Build and install from WSL

```sh
mise run install-servitor
```

The task cross-compiles the Windows executable, copies it to:

```text
C:\Users\<Windows user>\bin\servitor.exe
```

It also creates or replaces `Servitor.lnk` in the current Windows user's Startup folder, then starts the tray application. No administrator rights are required.

## Tray menu

- Current active/paused status
- Pause/resume
- Idle thresholds: 1, 3, 10, or 30 minutes
- Quit

Tray changes apply to the running process. A restart returns to the command-line/default idle threshold.

## Usage

```powershell
servitor.exe
servitor.exe -idle 10m -poll 5s
```

Defaults: `-idle 4m30s`, `-poll 5s`, `-distance 1`.

The installed build hides its console window. Build without `-H=windowsgui` when console help or verbose diagnostics are needed. Stop the installed application from the tray menu. This first version supports Windows only.