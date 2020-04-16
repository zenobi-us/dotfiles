
# Load the oh-my-zsh's library.
antigen use oh-my-zsh

# Bundles from the default repo (robbyrussell's oh-my-zsh).
antigen bundle git
antigen-bundle git-flow
antigen bundle pip
antigen bundle command-not-found
antigen-bundle docker
antigen bundle djui/alias-tips
# enable viewing commits in browser
antigen bundle sindresorhus/pure
antigen bundle zsh-users/zsh-autosuggestions

#
# Auto Environment Setup
#
AUTOENV_FILE_ENTER=.env
antigen bundle Tarrasch/zsh-autoenv

# Syntax highlighting bundle.
antigen bundle zsh-users/zsh-syntax-highlighting
antigen bundle robbyrussell/oh-my-zsh plugins/npm
antigen bundle robbyrussell/oh-my-zsh plugins/gitignore
antigen bundle robbyrussell/oh-my-zsh plugins/git-flow-avh

# Load the theme.
# antigen theme XsErG/zsh-themes themes/lazyuser

# Tell antigen that you're done.
antigen apply