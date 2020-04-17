function load-parts ($source) {
  $parts=get-childitem ($source + "*.ps1");
  $prefix=$(split-path $($source) -leaf)

  write-host "${prefix}.loading " -nonewline

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