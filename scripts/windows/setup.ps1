# Instalador rápido (Windows + winget)
# Ejecutar como Administrador

function Ensure-Admin {
  $id=[Security.Principal.WindowsIdentity]::GetCurrent()
  $p=new-object Security.Principal.WindowsPrincipal($id)
  if(-not $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)){
    $psi=New-Object System.Diagnostics.ProcessStartInfo "powershell"
    $psi.Arguments="-NoProfile -ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Definition)`""
    $psi.Verb="runas";[System.Diagnostics.Process]::Start($psi)|Out-Null;exit
  }
}

function Winget-Install($Id){ winget install --id $Id -e --accept-package-agreements --accept-source-agreements -h 0 | Out-Null }

Ensure-Admin
$ErrorActionPreference="Stop"; $ProgressPreference="SilentlyContinue"

Winget-Install "OpenJS.NodeJS.LTS"
Winget-Install "Git.Git"
Winget-Install "Gyan.FFmpeg"

$env:Path=[System.Environment]::GetEnvironmentVariable("Path","Machine")+";"+[System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Listo. Asegúrate de crear .env o config.json y ejecuta: npm i && npm run start" -ForegroundColor Green
