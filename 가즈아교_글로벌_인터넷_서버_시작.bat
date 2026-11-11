@echo off
chcp 65001 >nul
title GAZUA CULT ONLINE TEMPLE SERVER
cd /d "%~dp0"

echo ========================================================
echo  [가즈아교] 글로벌 인터넷 멀티플레이 서버를 시작합니다...
echo ========================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [오류] Python이 설치되어 있지 않거나 환경변수 PATH에 등록되지 않았습니다.
    echo 파이썬을 설치하시거나 시스템 관리자에게 문의하세요.
    pause
    exit /b
)

python start_online_server.py
pause

