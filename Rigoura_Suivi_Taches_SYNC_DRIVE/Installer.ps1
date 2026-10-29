$ErrorActionPreference = "Stop"
$AppName = "Rigoura Suivi des tâches"
$InstallDir = Join-Path $env:LOCALAPPDATA "RigouraSuiviTaches"
$Desktop = [Environment]::GetFolderPath("Desktop")
$SourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path

New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Copy-Item (Join-Path $SourceDir "SuiviTaches.html") (Join-Path $InstallDir "SuiviTaches.html") -Force
Copy-Item (Join-Path $SourceDir "RigouraSuivi.ico") (Join-Path $InstallDir "RigouraSuivi.ico") -Force

# Find Edge or Chrome. Both can open the local app in an app-like window, offline.
$Browser = $null
$Candidates = @(
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
  "$env:LOCALAPPDATA\Microsoft\Edge\Application\msedge.exe",
  "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
  "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)
foreach ($candidate in $Candidates) {
  if (Test-Path $candidate) { $Browser = $candidate; break }
}
if (-not $Browser) {
  $cmd = Get-Command msedge.exe -ErrorAction SilentlyContinue
  if ($cmd) { $Browser = $cmd.Source }
}
if (-not $Browser) {
  $cmd = Get-Command chrome.exe -ErrorAction SilentlyContinue
  if ($cmd) { $Browser = $cmd.Source }
}
if (-not $Browser) {
  throw "Microsoft Edge ou Google Chrome est nécessaire pour lancer l'application."
}

$HtmlPath = Join-Path $InstallDir "SuiviTaches.html"
$HtmlUrl = ([System.Uri]$HtmlPath).AbsoluteUri
$ShortcutPath = Join-Path $Desktop "Rigoura - Suivi des tâches.lnk"
$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Browser
$Shortcut.Arguments = "--app=`"$HtmlUrl`""
$Shortcut.WorkingDirectory = $InstallDir
$Shortcut.IconLocation = (Join-Path $InstallDir "RigouraSuivi.ico")
$Shortcut.Description = "Suivi quotidien des tâches - RIGOURA DESIGN"
$Shortcut.Save()

# Also create a Start Menu shortcut
$StartMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs"
$StartShortcutPath = Join-Path $StartMenu "Rigoura - Suivi des tâches.lnk"
$StartShortcut = $WshShell.CreateShortcut($StartShortcutPath)
$StartShortcut.TargetPath = $Browser
$StartShortcut.Arguments = "--app=`"$HtmlUrl`""
$StartShortcut.WorkingDirectory = $InstallDir
$StartShortcut.IconLocation = (Join-Path $InstallDir "RigouraSuivi.ico")
$StartShortcut.Description = "Suivi quotidien des tâches - RIGOURA DESIGN"
$StartShortcut.Save()

Write-Host ""
Write-Host "Installation terminée !" -ForegroundColor Green
Write-Host "Une icône a été créée sur le Bureau : Rigoura - Suivi des tâches"
Write-Host "Application installée dans : $InstallDir"
Write-Host "Tu peux maintenant fermer cette fenêtre."
Read-Host "Appuie sur Entrée pour terminer"
