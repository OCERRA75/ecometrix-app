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
$env:SUPABASE_SERVICE_ROLE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY.Trim()

# Validación rápida: una clave completa mide >40 caracteres (legacy empieza por eyJ, la nueva por sb_secret_)
$k = $env:SUPABASE_SERVICE_ROLE_KEY
if ($k.Length -lt 40 -or -not ($k.StartsWith('eyJ') -or $k.StartsWith('sb_secret_'))) {
  Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
  Write-Host "La clave pegada no es válida (largo: $($k.Length)). Debe ser la service_role completa (eyJ...) o una secret key (sb_secret_...). No uses la anon/publishable." -ForegroundColor Red
  exit 1
}

# La carpeta de backups queda AL LADO del repo (fuera de git): ...\EcoMatriX App\backups
$backups = Join-Path (Split-Path $repo -Parent) 'backups'

try {
  node scripts/backup-supabase.mjs $backups
  $code = $LASTEXITCODE
} finally {
  Remove-Item Env:SUPABASE_SERVICE_ROLE_KEY -ErrorAction SilentlyContinue
}

if ($code -ne 0 -and $code -ne 3) {
  # Falló antes de exportar datos: borrar la carpeta vacía y NO crear zip
  Get-ChildItem $backups -Directory -Filter 'ecometrix-backup-*' -ErrorAction SilentlyContinue | Where-Object { -not (Get-ChildItem $_.FullName -Filter '_manifest.json') } | Remove-Item -Recurse -Force
  Write-Host "`nBackup FALLIDO (código $code). No se creó ningún archivo. Revisa el mensaje de arriba." -ForegroundColor Red
  exit 1
}
if ($code -eq 3) {
  Write-Host "`nBackup parcial: algunas tablas fallaron (ver _manifest.json -> errors)." -ForegroundColor Yellow
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
