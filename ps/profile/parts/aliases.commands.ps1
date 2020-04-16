function global:Where-Is-It {
    Param(
        [string]$command
    )

    (gcm $command).Path
}

set-alias host resolve-dnsname

function global:refresh-path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") +
                ";" +
                [System.Environment]::GetEnvironmentVariable("Path","User")
}