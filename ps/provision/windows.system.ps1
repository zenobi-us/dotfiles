set-exploreroptions -showhiddenfilesfoldersdrives -showprotectedosfiles -showfileextensions
set-taskbarsmall
enable-remotedesktop
disable-bingsearch
disable-gamebartips

choco install microsoft-hyper-v-all -source windowsfeatures -Y
choco install telnetclient -source windowsfeatures -Y
choco install microsoft-build-tools -Y
choco install windows-sdk-10.0 -Y