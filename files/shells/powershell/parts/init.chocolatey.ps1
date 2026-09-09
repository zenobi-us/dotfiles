# Chocolatey profile
$ChocolateyProfile = "$env:ChocolateyInstall\helpers\chocolateyProfile.psm1"
if (test-path($ChocolateyProfile)) {
  import-module "$ChocolateyProfile"
}