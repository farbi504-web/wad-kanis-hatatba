@echo off
chcp 65001 >nul
title واد كنيس حطاطبة - تجربة محلية
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\try-local-windows.ps1"
pause
