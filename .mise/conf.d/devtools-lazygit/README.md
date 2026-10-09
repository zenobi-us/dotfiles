# Lazygit configuration

This directory contains the Lazygit configuration managed by mise.

## Install

Run:

```bash
mise bootstrap --only dotfiles --yes
```

Mise links each file into `~/.config/lazygit`.

## Fetch behavior

Lazygit fetches remote refs every 5 minutes.

It fast-forwards local `main` and `master` branches after fetch when they are strictly behind their upstream branch.

It does not fast-forward the currently checked-out branch or a diverged branch.
