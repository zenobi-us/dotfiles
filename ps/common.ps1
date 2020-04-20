
# https://github.com/ralish/PSDotFiles
# Install-Module -Name PSDotFiles
#

function Write-Error([string]$message) {
    [Console]::ForegroundColor = 'red'
    [Console]::Error.WriteLine($message)
    [Console]::ResetColor()
}


function Write-Warn([string]$message) {
    [Console]::ForegroundColor = 'yellow'
    [Console]::Error.WriteLine($message)
    [Console]::ResetColor()
}

function Write-Info([string]$message) {
    [Console]::ForegroundColor = 'white'
    [Console]::Error.WriteLine($message)
    [Console]::ResetColor()
}


function StowFile([String]$link, [String]$target) {
	$file = Get-Item $link -ErrorAction SilentlyContinue

	if($file) {
		if ($file.LinkType -ne "SymbolicLink") {
			Write-Error "$($file.FullName) already exists and is not a symbolic link"
			return
		} elseif ($file.Target -ne $target) {
			Write-Error "$($file.FullName) already exists and points to '$($file.Target)', it should point to '$target'"
			return
		} else {
			Write-Verbose "$($file.FullName) already linked"
			return
		}
	} else {
	$folder = Split-Path $link
		if(-not (Test-Path $folder)) {
			Write-Verbose "Creating folder $folder"
			New-Item -Type Directory -Path $folder
		}
	}

	Write-Verbose "Creating link $link to $target"
	(New-Item -Path $link -ItemType SymbolicLink -Value $target -ErrorAction Continue).Target
}


function Stow([String]$package, [String]$target) {
	if(-not $target) {
		Write-Error "Could not define the target link folder of $package"
	}

	ls $DotFilesPath\$package | % {
		if(-not $_.PSIsContainer) {
			StowFile (Join-Path -Path $target -ChildPath $_.Name) $_.FullName
		}
	}
}


function Install([String]$package) {
	if(-not ((choco list $package --exact --local-only --limitoutput) -like "$package*")) {
		Write-Verbose "Installing package $package"
		choco install $package -y
	} else {
		Write-Verbose "Package $package already installed"
	}
}


function DownloadFile([string]$url, [string]$target, [string]$hash) {
		if(Test-Path $target) {
			Write-Verbose "$target already downloaded"
		} else {
			Write-Verbose "Downloading $url to $target"
			try {
				(New-Object System.Net.WebClient).DownloadFile($url, $target)
			} catch {
				Write-Error $_
			}
			$targethash = Get-FileHash $target -Algorithm "SHA256"

			$diff = 0
			Compare-Object -Referenceobject $hash -Differenceobject $targethash.Hash | % { If ($_.Sideindicator -ne " ==") { $diff += 1 } }

			if ($diff -ne 0) {
				Write-Error "Downloaded file '$target' from url '$url' does not match expected hash!`nExpected: $hash`nActual  : $($targethash.Hash)"
			}
		}
}


function SetEnvVariable([string]$target, [string]$name, [string]$value) {
	$existing = [Environment]::GetEnvironmentVariable($name,$target)
	if($existing) {
		Write-Verbose "Environment variable $name already set to '$existing'"
	} else {
		Write-Verbose "Adding the $name environment variable to '$value'"
		[Environment]::SetEnvironmentVariable($name, $value, $target)
	}
}


function load-parts ($source) {
  if(-not (Test-Path $source)) {
    return
  }

  $parts=get-childitem (join-path $source "*.ps1");
  $prefix=$(split-path $($source) -leaf)

  write-host "${prefix}.loading [${parts.count}] " -nonewline

  $Fails = New-Object System.Collections.ArrayList

  foreach ($file in $parts){
    try {
      $ErrorActionPreference = "Stop"; #Make all errors terminating
      import-module ${file}
      write-host "." -nonewline
    } catch {
      write-host "x" -nonewline
      [void]$Fails.add($file)
    }
    finally{
      $ErrorActionPreference = "Continue"; #Reset the error action pref to default
    }
  }

  write-host ""

  if ($Fails.count -gt 0) {
    write-host "${prefix}.errors "
    foreach($fail in $Fails) {
      write-host " - $(split-path $($fail) -leaf)"
    }
  }

}