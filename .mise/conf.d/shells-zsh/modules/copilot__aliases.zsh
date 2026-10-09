if ! command -v gh &> /dev/null ; then
  asdf install github-cli latest
  asdf global github-cli latest
fi

 # if copilot extension not installed 
if ! gh extension list | grep -q copilot ; then
  gh extension install github/gh-copilot
fi

alias copilot='gh copilot' ;
alias suggest='gh copilot suggest' ;
alias explain='gh copilot explain' ;
