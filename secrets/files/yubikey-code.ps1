ykman oath accounts code | 
    # split
    ForEach-Object { $_ -split '\s+' } |
    # select second element
    Select-Object -Index 1 |
    # copy to clipboard
    Set-Clipboard