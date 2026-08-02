param(
  [Parameter(Mandatory = $true)]
  [string]$BackupPath
)

$ErrorActionPreference = "Stop"
$resolved = (Resolve-Path -LiteralPath $BackupPath).Path
& pg_restore --list $resolved | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Backup verification failed" }
Write-Output "Backup is readable: $resolved"
