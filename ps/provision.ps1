
set-executionpolicy unrestricted -s cu
iex (new-object net.webclient).downloadstring('https://get.scoop.sh')
iex ((new-object system.net.webclient).downloadstring('https://chocolatey.org/install.ps1'))

choco install Boxstarter -Y

set-exploreroptions -showhiddenfilesfoldersdrives -showprotectedosfiles -showfileextensions
set-taskbarsmall
enable-remotedesktop
disable-bingsearch
disable-gamebartips

choco install microsoft-hyper-v-all -source windowsfeatures -Y
choco install telnetclient -source windowsfeatures -Y
choco install microsoft-build-tools -Y
choco install windows-sdk-10.0 -Y
choco install nodist -Y
choco install 7zip -Y

nodist + latest
npm install -g npm
npm install -g microsoft-build-tools
npm config set msvs_version 2015

choco install -y openssh -params '"/SSHAgentFeature"'
choco install git --force

scoop bucket add extras
scoop install sublime-text
scoop install pshazz
scoop install concfg
scoop install tar

install-windowsupdate -accepteula
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser -Confirm