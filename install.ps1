$account = "airtonix"

$repo    = "dotfiles"

$branch  = "master"



$powerShellVersion = $PSVersionTable.PSVersion.Major

$dotNetFullVersion = [version](get-itemproperty -Path "HKLM:\Software\Microsoft\NET Framework Setup\NDP\v4\Full" -ErrorAction SilentlyContinue).Version

$dotNetClientVersion = [version](get-itemproperty -Path "HKLM:\Software\Microsoft\NET Framework Setup\NDP\v4\Client" -ErrorAction SilentlyContinue).Version



$hasSupportedPowershellVersion = (

  ($powerShellVersion -ge 3) -and 

  (

    $dotNetFullVersion -ge [version]"4.5" -or

    $dotNetClientVersion -ge [version]"4.5"

  )

)



if (!$hasSupportedPowershellVersion) {

  write-warning -Message @"

Insuffcient versions of powershell or dotnet available.



   powershell: $powerShellVersion (requires v3+) 

   dot net: $dotNetFullVersion (requires 4.5+)

   dot net client: $dotNetClientVersion (requires 4.5+)

"@

  

  return;

}



function Ensure-Directory {

    param (

        [string]$folder

    )



    Get-ChildItem $folder -Recurse | Remove-Item

    new-item -ItemType Directory -Path $folder



    return $folder

}





function Download-File {

  param (

    [string]$url,

    [string]$file

  )

  write-host "Downloading $url"

  $filename = split-path $url -Leaf

  $output =  join-path $env:TEMP $repo

  $downloaded = join-path $output $filename

  

  Ensure-Directory $output



  [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

  invoke-webrequest -UseBasicParsing -Uri $url -OutFile $downloaded 



  write-host "Dowloaded $downloaded"

  

  return $downloaded

}



function Unzip-File {

    param (

        [string]$archive,

        [string]$destinationPath

    )

    write-host "Extracting $filePath to $destinationPath"



    Ensure-Directory $destinationPath

    $hash = get-hash $archive

    $tmp = Ensure-Directory join-path $env:TEMP (join-path $repo $hash)

    

    expand-archive $archive $tmp

    get-childitem (join-path $tmp "$repo-$branch") -Recurse | move-item $destinationPath

    Get-ChildItem $tmp -Recurse | Remove-Item

    write-host "Extracted to $destinationPath"



}



$installDir = join-path $HOME (join-path ".$repo" "$repo-$branch")

$archive = Download-File "https://github.com/$account/$repo/archive/$branch.zip"

Unzip-File $archive $installDir



push-location $installDir

& .\ps\provision\index.ps1

pop-location



