# scripts\backup.ps1 — Backup de Supabase (ejecutar desde cualquier carpeta)
# Pide la clave service_role (no se guarda en ningún archivo), exporta todo, comprime y conserva los últimos 14 backups.
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
Set-Location $repo

$env:SUPABASE_URL = 'https://szaebpgqgokhmqdykukw.supabase.co'
$secure = Read-Host 'Pega la clave service_role de Supabase (no se guarda)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
$env:SUPABASE_SERVICE_ROLE_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)

# La carpeta de backups queda AL LADO del repo (fuera de git): ...\EcoMatriX App\backups
$backups = Join-Path (Split-Path $repo -Parent) 'backups'

try {
  node scripts/backup-supabase.mjs $backups
  $code = $LASTEXITCODE
} finally {
  Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
}

if ($code -ne 0) {
  Write-Host "`nEl backup terminó con errores (código $code). Revisa los mensajes de arriba." -ForegroundColor Yellow
}

# Comprimir la carpeta más reciente y borrar la carpeta sin comprimir
$ultima = Get-ChildItem $backups -Directory -Filter 'ecometrix-backup-*' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($ultima) {
  $zip = "$($ultima.FullName).zip"
  Compress-Archive -Path "$($ultima.FullName)\*" -DestinationPath $zip -Force
  Remove-Item $ultima.FullName -Recurse -Force
  Write-Host "`nArchivo listo: $zip" -ForegroundColor Green
}

# Conservar solo los 14 backups más recientes
Get-ChildItem $backups -Filter 'ecometrix-backup-*.zip' | Sort-Object LastWriteTime -Descending | Select-Object -Skip 14 | Remove-Item -Force
