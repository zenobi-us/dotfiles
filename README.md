# DotFiles

- zsh
- powershell

# Install

**unix**

```bash
$ git clone https://github.com/airtonix/dotfiles ~/.dotfiles
```

**windows**

```bash
iex ((new-object net.webclient).DownloadString('https://raw.github.com/airtonix/dotfiles/master/install.ps1'))
```

### zsh
1. install zsh
2. set it as your shell `chsh $(which zsh)`
3. log out
4. log in
5. link the configuration files

```bash
$ ~/.dotfiles/zsh/setup
```

### powershell

```bash
PS> . ~/.dotfiles/ps/provision.ps1
PS> . ~/.dotfiles/ps/setup.ps1
```
