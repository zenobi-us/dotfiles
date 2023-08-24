# DotFiles

- zsh
- powershell
- [comtrya](https://github.com/comtrya/comtrya)

# Install

## From Web

you can just let the web install do its thing...

**linux**

```bash
curl -fsSL https://get.comtrya.dev | sh
comtrya -d https://github.com/airtonix/dotfiles apply
```

**macos**

```bash
curl -fsSL https://get.comtrya.dev | sh
comtrya -d https://github.com/airtonix/dotfiles apply
```

**windows**

```powershell
iwr "https://get.comtrya.dev/ps" -UseBasicParsing | iex
comtrya -d https://github.com/airtonix/dotfiles apply
```

### Intermediary Setup

Above would be useful if comtrya was perfect. However you may instead need to install individual parts: 

```sh
$env:PATH+=";$env:USERPROFILE\.comtrya"
cd C:\Users\zeno.jiricek\AppData\Local\comtrya\manifests\git\githubcomairtonixdotfiles
comtrya apply -m manifest.dot.notated.path.instead.of.slash.notated.paths
```
