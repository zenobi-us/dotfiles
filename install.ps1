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

    $dotNetClientVersion -ge [version]"4.5"

  )

)



if (!$hasSupportedPowershellVersion) {
  Write-Warning -Message @"
Insuffcient versions of powershell or dotnet available.
   powershell: $powerShellVersion (requires v3+) 
   dot net: $dotNetFullVersion (requires 4.5+)
   dot net client: $dotNetClientVersion (requires 4.5+)
"@
  return;
}


function Download-File {
  param (
    [string]$url,
    [string]$file
  )
  
  Write-Host "Downloading $url"
  $filename = Split-Path $url -Leaf
  $output =  Join-Path $env:TEMP "$repo-$filename"
  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $output 
  return "$output/$filename"
}



function Unzip-File {
    param (
        [string]$File,
        [string]$Destination = (Get-Location).Path
    )

    $filePath = Resolve-Path $File
    $fileHash = Get-FileHash $filePath
    $destinationPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Destination)
    $tempDir = Join-Path $env:TEMP "$repo-$fileHash"

    if (![System.IO.Directory]::Exists($tempDir)) {[System.IO.Directory]::CreateDirectory($tempDir)}
    Write-Host "Extracting $filePath to $tempDir"

    if ([System.IO.Directory]::Exists($destinationPath)) {[System.IO.Directory]::Delete($destinationPath, $true)}

    try {
        [System.Reflection.Assembly]::LoadWithPartialName("System.IO.Compression.FileSystem") | Out-Null
        [System.IO.Compression.ZipFile]::ExtractToDirectory("$filePath", "$destinationPath")
    } catch {
        Write-Warning -Message "Unexpected Error. Error details: $_.Exception.Message"
    }

    Write-Host "Moving to $destinationPath"

    if ([System.IO.Directory]::Exists($destinationPath)) {
      [System.IO.Directory]::Delete($destinationPath, $true)
      [System.IO.Directory]::CreateDirectory($destinationPath)
    }

    Push-Location $destinationPath
}



$installDir = Join-Path $HOME (Join-Path ".$repo" "$repo-$branch")



$archive = Download-File "https://github.com/$account/$repo/archive/$branch.zip"

Unzip-File $archive $installDir



Push-Location $installDir

& .\ps\provision\index.ps1

Pop-Location
