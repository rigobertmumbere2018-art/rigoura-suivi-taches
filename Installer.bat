@echo off
title Installation - Rigoura Suivi des tâches
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Installer.ps1"
if errorlevel 1 (
  echo.
  echo L'installation n'a pas abouti. Verifie que Microsoft Edge ou Google Chrome est installe.
  pause
)
