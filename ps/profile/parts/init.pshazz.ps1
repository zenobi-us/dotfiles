try {
    $null = gcm pshazz -ea stop;
    pshazz init 'airtonix'
} catch { }
