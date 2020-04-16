function load-parts ($source) {
  $parts=get-childitem ($source + "*.ps1");
  $prefix=$(split-path $($source) -leaf)

  write-host "${prefix}.loading: " -nonewline

  $failed=@()

  foreach ($file in $parts){
    try {
      import-module ${file}
      write-host "." -nonewline
    } catch {
      write-host "x" -nonewline
      $failed += ${file}
    }
  }

  write-host ""

  if ($failed.Count > 0) {
    write-host "${prefix}.failed ${failed}"
  }
}