$account = "airtonix"
$repo    = "dotfiles"
$branch  = "master"

$powerShellVersion = $PSVersionTable.PSVersion.Major
$dotNetFullVersion = [version](Get-ItemProperty -Path "HKLM:\Software\Microsoft\NET Framework Setup\NDP\v4\Full" -ErrorAction SilentlyContinue).Version
$dotNetClientVersion = [version](Get-ItemProperty -Path "HKLM:\Software\Microsoft\NET Framework Setup\NDP\v4\Client" -ErrorAction SilentlyContinue).Version

$hasSupportedPowershellVersion = (
  ($powerShellVersion -ge 3) -and 
  (
    $dotNetFullVersion -ge [version]"4.5" -or
     -ge [version]"4.5"
  )
)

if (!$hasSupportedPowershellVersion) {
  Write-Warning -Message @"
  Your need Powershell or DotNet needs upgrading.

  You have:
   powershell: $powerShellVersion
   dot net: $dotNetFullVersion
   dot net client: $dotNetClientVersion
"@
  
  return;
}


$dotfilesTempDir = Join-Path $env:TEMP "dotfiles"
if (![System.IO.Directory]::Exists($dotfilesTempDir)) {[System.IO.Directory]::CreateDirectory($dotfilesTempDir)}
$sourceFile = Join-Path $dotfilesTempDir "dotfiles.zip"
$dotfilesInstallDir = Join-Path $HOME (Join-Path ".dotfiles" "$repo-$branch")


function Download-File {
  param (
    [string]$url,
    [string]$file
  )
  Write-Host "Downloading $url to $file"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $file 

}

function Unzip-File {
    param (
        [string]$File,
        [string]$Destination = (Get-Location).Path
    )

    $filePath = Resolve-Path $File
    $destinationPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Destination)
    
    Write-Host "Extracting $filePath to $destinationPath"
    
    if ([System.IO.Directory]::Exists($destinationPath)) {[System.IO.Directory]::Delete($destinationPath, $true)}
    
    try {
        [System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null
        [System.IO.Compression.ZipFile]::ExtractToDirectory("$filePath", "$destinationPath")
    } catch {
        Write-Warning -Message "Unexpected Error. Error details: $_.Exception.Message"
    }
}

Download-File "https://github.com/$account/$repo/archive/$branch.zip" $sourceFile
if ([System.IO.Directory]::Exists($dotfilesInstallDir)) {[System.IO.Directory]::Delete($dotfilesInstallDir, $true)}
Unzip-File $sourceFile $dotfilesTempDir

Push-Location $dotfilesInstallDir
& .\ps\provision\index.ps1
Pop-Location

