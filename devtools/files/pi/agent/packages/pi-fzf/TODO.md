# TODO

## Long candidates can overflow the box

Items in the selector list aren't truncated to `innerWidth`, so a long candidate will render past the right border. Should use `truncateToWidth` (from `@mariozechner/pi-tui`) on each item line before passing it to `boxLine`.

## Support `selectPageUp` / `selectPageDown`

These are standard selection keybindings in pi. Users who navigate with page up/down in other selectors would expect them to work here too.

## `Fzf` instance recreated on every keystroke

`new Fzf(candidates, ...)` is constructed inside `applyFilter` on every input change. Since the candidate list never changes, the `Fzf` instance can be created once in the constructor and reused.

## Type cast smell in `index.ts`

`runFzfSelector` accepts `ExtensionContext` but casts it to `ExtensionCommandContext` when calling `executeAction`. It's always called from command/shortcut handlers which provide the richer type, so the parameter should be `ExtensionCommandContext` directly.
