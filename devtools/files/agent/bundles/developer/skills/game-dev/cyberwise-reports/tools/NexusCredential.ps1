# NexusCredential.ps1 -- keep a Nexus API key in Windows Credential Manager
# instead of in a script, a config file, or a chat log.
#
# Dot-source this, then:
#     Save-NexusApiKey                 # prompts, nothing echoed
#     Get-NexusApiKey                  # returns the key
#     Remove-NexusApiKey               # deletes it
#
# Uses the Win32 credential API directly rather than a PowerShell module, so it
# has no dependencies and the entry is visible to `cmdkey /list` like any other.
# Stored as a generic credential under the target name below.

# --- upstream guard ---------------------------------------------------------
# Advisory, and only that: silent while this copy matches what shipped, one
# short line when it does not, and it never blocks or changes an exit code.
# Rationale, and why it is deliberately not a PreToolUse hook: UpstreamGuard.ps1.
$cwGuard = Join-Path $PSScriptRoot '..\..\cyberwise\tools\UpstreamGuard.ps1'
if (Test-Path -LiteralPath $cwGuard) { try { . $cwGuard; Invoke-CwStartupGuard } catch { } }

$script:NexusCredTarget = 'cyberwise:nexus-api'

if (-not ('CredMan' -as [type])) {
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class CredMan
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    private struct CREDENTIAL
    {
        public uint Flags;
        public uint Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public uint CredentialBlobSize;
        public IntPtr CredentialBlob;
        public uint Persist;
        public uint AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredWriteW([In] ref CREDENTIAL credential, uint flags);

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredReadW(string target, uint type, uint flags, out IntPtr credential);

    [DllImport("advapi32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
    private static extern bool CredDeleteW(string target, uint type, uint flags);

    [DllImport("advapi32.dll")]
    private static extern void CredFree(IntPtr buffer);

    private const uint GENERIC = 1;
    private const uint PERSIST_LOCAL_MACHINE = 2;

    public static void Write(string target, string user, string secret)
    {
        byte[] blob = System.Text.Encoding.Unicode.GetBytes(secret);
        IntPtr mem = Marshal.AllocHGlobal(blob.Length);
        try {
            Marshal.Copy(blob, 0, mem, blob.Length);
            CREDENTIAL c = new CREDENTIAL();
            c.Type = GENERIC;
            c.TargetName = target;
            c.CredentialBlobSize = (uint)blob.Length;
            c.CredentialBlob = mem;
            c.Persist = PERSIST_LOCAL_MACHINE;
            c.UserName = string.IsNullOrEmpty(user) ? "nexus" : user;
            if (!CredWriteW(ref c, 0))
                throw new Exception("CredWrite failed: " + Marshal.GetLastWin32Error());
        } finally { Marshal.FreeHGlobal(mem); }
    }

    public static string Read(string target)
    {
        IntPtr p;
        if (!CredReadW(target, GENERIC, 0, out p)) return null;
        try {
            // Blob offset differs by architecture; marshal the struct properly.
            var c = (CREDENTIAL)Marshal.PtrToStructure(p, typeof(CREDENTIAL));
            if (c.CredentialBlobSize == 0) return null;
            return Marshal.PtrToStringUni(c.CredentialBlob, (int)c.CredentialBlobSize / 2);
        } finally { CredFree(p); }
    }

    public static bool Delete(string target) { return CredDeleteW(target, GENERIC, 0); }
}
'@
}

function Save-NexusApiKey {
    <#
        Prompts for the key without echoing it. Get yours from
        nexusmods.com/users/myaccount?tab=api - the Personal API Key at the
        bottom, not one of the per-application keys.
    #>
    param([string]$Target = $script:NexusCredTarget)

    $secure = Read-Host "Nexus personal API key" -AsSecureString
    $bstr   = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try   { $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }

    if ([string]::IsNullOrWhiteSpace($plain)) { Write-Warning 'nothing entered'; return }

    [CredMan]::Write($Target, 'nexus', $plain)
    Write-Host "stored as '$Target' (visible in: cmdkey /list)" -ForegroundColor Green
    Write-Host "length $($plain.Length) chars - the key itself was never displayed" -ForegroundColor DarkGray
}

function Get-NexusApiKey {
    param([string]$Target = $script:NexusCredTarget)
    return [CredMan]::Read($Target)
}

function Remove-NexusApiKey {
    param([string]$Target = $script:NexusCredTarget)
    if ([CredMan]::Delete($Target)) { Write-Host "removed '$Target'" -ForegroundColor Green }
    else { Write-Warning "nothing stored under '$Target'" }
}
