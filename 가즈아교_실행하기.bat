@echo off
title GAZUA CULT 3D TEMPLE
cd /d "%~dp0"
echo ========================================================
echo  [GAZUA CULT] Starting 3D Megachurch Online Temple...
echo ========================================================
echo.
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Python detected! Opening browser and starting server...
    start "" "http://localhost:8080/index.html"
    python server.py
) else (
    echo Opening directly in default browser...
    start "" "index.html"
)
pause
