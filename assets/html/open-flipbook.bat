@echo off
cd /d "%~dp0"
where py >nul 2>nul
if %errorlevel% equ 0 (
  py -3 notes-server.py
) else (
  python notes-server.py
)
pause
