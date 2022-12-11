dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
wsl --set-default-version 2
Invoke-WebRequest -Uri https://aka.ms/wslubuntu2004 -OutFile Ubuntu.appx -UseBasicParsing
Add-AppxPackage .\Ubuntu.appx
wsl --set-version Ubuntu-20.04 2
Restart-Service LxssManager

# If you get the following error
# > The user has not been granted the requested logon type at this computer
# Then execute the following
# ```powershell
# Restart-Service vmcompute
# ```