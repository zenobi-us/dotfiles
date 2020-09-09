# DotFiles

- zsh
- powershell

# Install

## From Web

you can just let the web install do its thing...

**unix**

```bash
$ curl -L https://raw.github.com/airtonix/dotfiles/master/install.sh | sh
```

**windows**

```bash
iex ((new-object net.webclient).DownloadString('https://raw.github.com/airtonix/dotfiles/master/install.ps1'))
```

## Manually

1. git clone
2. `chmod +x ./dotfiles/zsh/setup` or `. dotfiles/ps/provision.ps1`

## zsh

1. install zsh
2. set it as your shell `chsh $(which zsh)`
3. log out
4. log in
5. link the configuration files

```console
$ ~/.dotfiles/zsh/setup
```

### powershell

```console
PS> . ~/.dotfiles/ps/provision.ps1
PS> . ~/.dotfiles/ps/setup.ps1
```
