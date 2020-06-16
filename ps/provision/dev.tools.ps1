Install-Module -Name Set-PsEnv

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

(Invoke-WebRequest -Uri https://raw.githubusercontent.com/python-poetry/poetry/master/get-poetry.py -UseBasicParsing).Content | python


scoop install sublime-text
