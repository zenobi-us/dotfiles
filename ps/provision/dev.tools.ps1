choco install git --force

git config --global credential.helper = manager
git config --global core.excludesfile "$HOME/.gitignore"
git config --global core.editor "code --wait"
git config --global core.autocrlf false
git config --global push.default matching

choco install nodist -Y
nodist + latest

npm install -g npm
npm install -g microsoft-build-tools
npm config set msvs_version 2015


scoop install sublime-text
